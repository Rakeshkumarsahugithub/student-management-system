import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Backend encryption utility (Level 2 - Server-side)
class BackendCrypto {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly BACKEND_ENCRYPTION_KEY = process.env.BACKEND_ENCRYPTION_KEY || 'backend-encryption-key-2024-very-secure';
  private static readonly FRONTEND_ENCRYPTION_KEY = process.env.FRONTEND_ENCRYPTION_KEY || 'frontend-encryption-key-2024-level1-secure';
  private static readonly IV_LENGTH = 16; // For AES, this is always 16

  /**
   * Generate a cryptographic key from the base key
   */
  private static getKey(): Buffer {
    return crypto.scryptSync(this.BACKEND_ENCRYPTION_KEY, 'salt', 32);
  }

  /**
   * Encrypt data on the backend (Level 2 encryption)
   * Uses deterministic IV based on input data for consistent results
   */
  static encrypt(data: string): string {
    try {
      const key = this.getKey();
      
      // Create deterministic IV based on input data
      // This ensures same input always produces same encrypted output
      const hash = crypto.createHash('sha256').update(data + this.BACKEND_ENCRYPTION_KEY).digest();
      const iv = hash.slice(0, this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine IV, authTag, and encrypted data
      const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      return result;
    } catch (error) {
      console.error('Backend encryption error:', error);
      throw new Error('Failed to encrypt data on backend');
    }
  }

  /**
   * Decrypt data on the backend (Level 2 decryption)
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getKey();
      const parts = encryptedData.split(':');
      
      if (parts.length === 3) {
        // New format: iv:authTag:encrypted (AES-256-GCM)
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
      } else if (parts.length === 2) {
        // Legacy format: iv:encrypted (AES-256-CBC or similar)
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        
        // Try AES-256-CBC first
        try {
          const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
          let decrypted = decipher.update(encrypted, 'base64', 'utf8');
          decrypted += decipher.final('utf8');
          return decrypted;
        } catch (error) {
          // Try without auth tag for GCM (might be legacy data)
          try {
            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            let decrypted = decipher.update(encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
          } catch (error2) {
            throw new Error('Failed to decrypt legacy format');
          }
        }
      } else {
        throw new Error('Invalid encrypted data format - expected 2 or 3 parts');
      }
    } catch (error) {
      console.error('Backend decryption error:', error);
      console.error('Encrypted data:', encryptedData);
      console.error('Data parts length:', encryptedData.split(':').length);
      throw new Error('Failed to decrypt data on backend');
    }
  }

  /**
   * Encrypt student object for database storage (Level 2)
   */
  static encryptStudentForDB(student: any): any {
    const encryptedStudent = { ...student };
    
    // Apply Level 2 encryption to already Level 1 encrypted fields
    if (student.fullName) encryptedStudent.fullName = this.encrypt(student.fullName);
    if (student.email) encryptedStudent.email = this.encrypt(student.email);
    if (student.phone) encryptedStudent.phone = this.encrypt(student.phone);
    if (student.address) encryptedStudent.address = this.encrypt(student.address);
    if (student.courseEnrolled) encryptedStudent.courseEnrolled = this.encrypt(student.courseEnrolled);
    if (student.password) encryptedStudent.password = this.encrypt(student.password); // Password gets double encryption
    
    return encryptedStudent;
  }

  /**
   * Decrypt student object from database (Level 2 only, leaving Level 1 for frontend)
   */
  static decryptStudentFromDB(encryptedStudent: any): any {
    const decryptedStudent = { ...encryptedStudent };
    
    // Decrypt Level 2 encryption only, leaving Level 1 for frontend
    // Handle cases where data might not be encrypted
    try {
      if (encryptedStudent.fullName && typeof encryptedStudent.fullName === 'string' && encryptedStudent.fullName.includes(':')) {
        decryptedStudent.fullName = this.decrypt(encryptedStudent.fullName);
      }
    } catch (error) {
      console.warn('Could not decrypt fullName, keeping original value');
    }

    try {
      if (encryptedStudent.email && typeof encryptedStudent.email === 'string' && encryptedStudent.email.includes(':')) {
        decryptedStudent.email = this.decrypt(encryptedStudent.email);
      }
    } catch (error) {
      console.warn('Could not decrypt email, keeping original value');
    }

    try {
      if (encryptedStudent.phone && typeof encryptedStudent.phone === 'string' && encryptedStudent.phone.includes(':')) {
        decryptedStudent.phone = this.decrypt(encryptedStudent.phone);
      }
    } catch (error) {
      console.warn('Could not decrypt phone, keeping original value');
    }

    try {
      if (encryptedStudent.address && typeof encryptedStudent.address === 'string' && encryptedStudent.address.includes(':')) {
        decryptedStudent.address = this.decrypt(encryptedStudent.address);
      }
    } catch (error) {
      console.warn('Could not decrypt address, keeping original value');
    }

    try {
      if (encryptedStudent.courseEnrolled && typeof encryptedStudent.courseEnrolled === 'string' && encryptedStudent.courseEnrolled.includes(':')) {
        decryptedStudent.courseEnrolled = this.decrypt(encryptedStudent.courseEnrolled);
      }
    } catch (error) {
      console.warn('Could not decrypt courseEnrolled, keeping original value');
    }

    try {
      if (encryptedStudent.password && typeof encryptedStudent.password === 'string' && encryptedStudent.password.includes(':')) {
        decryptedStudent.password = this.decrypt(encryptedStudent.password);
      }
    } catch (error) {
      console.warn('Could not decrypt password, keeping original value');
    }
    
    return decryptedStudent;
  }

  /**
   * Hash password for authentication (separate from encryption)
   */
  static hashPassword(password: string): string {
    return crypto.pbkdf2Sync(password, 'student-mgmt-salt', 10000, 64, 'sha512').toString('hex');
  }

  /**
   * Verify password against hash
   */
  static verifyPassword(password: string, hash: string): boolean {
    const hashVerify = this.hashPassword(password);
    return hashVerify === hash;
  }

  /**
   * Generate JWT-like token for authentication
   */
  static generateAuthToken(payload: any): string {
    const tokenData = {
      ...payload,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    return this.encrypt(JSON.stringify(tokenData));
  }

  /**
   * Verify and decode auth token
   */
  static verifyAuthToken(token: string): any {
    try {
      const decrypted = this.decrypt(token);
      const tokenData = JSON.parse(decrypted);
      
      if (Date.now() > tokenData.expires) {
        throw new Error('Token expired');
      }
      
      return tokenData;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Decrypt frontend-encrypted data (Level 1 decryption)
   * This is used on the backend to decrypt data that was encrypted by the frontend
   */
  static decryptFrontendData(encryptedData: string): string {
    try {
      const crypto = require('crypto');
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.FRONTEND_ENCRYPTION_KEY, 'salt', 32);
      
      // Try to parse the CryptoJS format
      try {
        // For CryptoJS format, we need to use a different approach
        // CryptoJS uses a different format than Node.js crypto
        // For now, return as-is to maintain Level 1 encryption for frontend
        return encryptedData;
      } catch (error) {
        console.warn('Could not decrypt frontend data, keeping encrypted:', error);
        return encryptedData;
      }
    } catch (error) {
      console.error('Frontend data decryption error:', error);
      throw new Error('Failed to decrypt frontend data');
    }
  }
}

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        studentId: string;
        email: string;
        timestamp: number;
        expires: number;
      };
    }
  }
}

// Authentication middleware functions

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify and decode the token
    const decoded = BackendCrypto.verifyAuthToken(token);
    
    // Add user data to request object
    req.user = decoded;
    
    next();
  } catch (error: any) {
    console.error('Token verification error:', error.message);
    
    if (error.message === 'Token expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid or malformed token'
    });
  }
};

// Rate limiting functionality
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs
        };
        return next();
      }

      this.store[key].count++;

      if (this.store[key].count > this.maxRequests) {
        const resetTime = Math.ceil((this.store[key].resetTime - now) / 1000);
        
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: resetTime
        });
        return;
      }

      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': (this.maxRequests - this.store[key].count).toString(),
        'X-RateLimit-Reset': new Date(this.store[key].resetTime).toISOString()
      });

      next();
    };
  }
}

// Create rate limiters
export const generalRateLimit = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
);

export const authRateLimit = new RateLimiter(
  15 * 60 * 1000, // 15 minutes
  5 // Only 5 login attempts per 15 minutes
);

export default BackendCrypto;