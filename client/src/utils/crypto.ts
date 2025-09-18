import CryptoJS from 'crypto-js';

// Frontend encryption utility (Level 1 - Client-side)
class FrontendCrypto {
  private static readonly ENCRYPTION_KEY = 'frontend-encryption-key-2024-level1-secure'; // Level 1 encryption key (different from backend)
  private static readonly FALLBACK_KEY = 'backend-encryption-key-2024-very-secure'; // Fallback key for compatibility
  private static readonly LEGACY_KEYS = [
    'backend-encryption-key-2024-very-secure', // Original backend key that was used for frontend initially
    'student-management-secret-key',
    'encryption-key-2024',
    'my-secret-key',
    'secret-key',
    'default-key',
    'frontend-encryption-key-2024-level1-secure', // Current frontend key
    'student-mgmt-2024',
    'crypto-key-2024',
    // Add variations of the working key
    'crypto-key-2024-secure',
    'crypto-key-2024-level1',
    'crypto-key-2024-frontend',
    'student-crypto-key-2024',
    'management-crypto-key-2024',
    // Add more potential original keys
    'student-management-encryption-key',
    'level1-encryption-key',
    'frontend-key-2024',
    'client-encryption-key',
    // Try some simple keys that might have been used initially
    'test-key',
    'demo-key',
    'sample-key',
    'student-key',
    'management-key',
    // Add more comprehensive key variations
    'student-management-key',
    'student-management-2024',
    'student-system-key',
    'management-system-key',
    'app-encryption-key',
    'application-key',
    'system-key',
    'database-key',
    'user-key',
    'profile-key',
    'form-key',
    'data-key',
    // Try common development keys
    'dev-key',
    'development-key',
    'local-key',
    'localhost-key',
    // Try variations with numbers
    'key123',
    'key2024',
    'student123',
    'management123',
    // Try simple passwords
    'password',
    'admin',
    'user',
    '12345',
    'qwerty'
  ]; // Additional keys to try for legacy data

  /**
   * Encrypt data on the frontend before sending to backend
   * Uses fixed salt to ensure consistent encryption results
   */
  static encrypt(data: string): string {
    try {
      // Use fixed salt to ensure same input always produces same output
      const salt = CryptoJS.enc.Hex.parse('73616c74'); // 'salt' in hex
      const key = CryptoJS.PBKDF2(this.ENCRYPTION_KEY, salt, {
        keySize: 256/32,
        iterations: 1000
      });
      
      // Use fixed IV for consistent results
      const iv = CryptoJS.enc.Hex.parse('31323334353637383930313233343536'); // Fixed 16-byte IV
      
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Return in format: iv:encrypted (base64)
      return iv.toString(CryptoJS.enc.Base64) + ':' + encrypted.toString();
    } catch (error) {
      console.error('Frontend encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Test decryption with a specific encrypted string (for debugging)
   */
  static testDecrypt(encryptedData: string): void {
    const testKeys = [
      'backend-encryption-key-2024-very-secure', // Try this first - likely the original key
      'frontend-encryption-key-2024-level1-secure',
      'student-management-secret-key',
      'encryption-key-2024',
      'my-secret-key',
      'secret-key',
      'default-key',
      'student-mgmt-2024',
      'crypto-key-2024',
      'test-key',
      'password',
      '123456'
    ];

    console.log('🔍 Testing decryption for:', encryptedData.substring(0, 50) + '...');
    
    for (const key of testKeys) {
      try {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (result && result.length > 0) {
          console.log(`✅ SUCCESS! Key: "${key}" -> Result: "${result}"`);
          return;
        }
      } catch (error) {
        // Continue
      }
    }
    console.log('❌ No key worked for this encrypted data');
  }

  /**
   * Decrypt data received from backend
   */
  static decrypt(encryptedData: string): string {
    // With fresh database, prioritize the correct frontend key first
    const keysToTry = [this.ENCRYPTION_KEY, this.FALLBACK_KEY, 'crypto-key-2024', ...this.LEGACY_KEYS];
    
    // Check if it's new fixed-salt format (iv:encrypted)
    if (encryptedData.includes(':') && !encryptedData.startsWith('U2FsdGVkX1')) {
      try {
        const parts = encryptedData.split(':');
        if (parts.length === 2) {
          const iv = CryptoJS.enc.Base64.parse(parts[0]);
          const encrypted = parts[1];
          
          // Use same fixed salt as encryption
          const salt = CryptoJS.enc.Hex.parse('73616c74');
          const key = CryptoJS.PBKDF2(this.ENCRYPTION_KEY, salt, {
            keySize: 256/32,
            iterations: 1000
          });
          
          const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          });
          
          const result = decrypted.toString(CryptoJS.enc.Utf8);
          if (result && result.length > 0) {
            console.log(`✅ Fixed-salt format decrypted successfully`);
            return result;
          }
        }
      } catch (error) {
        console.log('❌ Fixed-salt decryption failed, trying legacy formats');
      }
    }
    
    // Check if it's CryptoJS salted format (starts with "U2FsdGVkX1")
    if (encryptedData.startsWith('U2FsdGVkX1')) {
      for (const key of keysToTry) {
        try {
          const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
          const result = decrypted.toString(CryptoJS.enc.Utf8);
          
          if (result && result.length > 0) {
            console.log(`✅ CryptoJS salted decrypted with key: ${key}`);
            return result;
          }
        } catch (error) {
          // Continue to next key
        }
      }
    }
    
    // Try other formats for non-salted data
    for (const key of keysToTry) {
      try {
        // Try CryptoJS default format (base64 encoded)
        try {
          const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
          const result = decrypted.toString(CryptoJS.enc.Utf8);
          
          // Check if decryption was successful and result is not empty
          if (result && result.length > 0) {
            return result;
          }
        } catch (error) {
          // Continue to next format
        }
        
        // If default format fails, try custom formats
        const parts = encryptedData.split(':');
        
        if (parts.length === 2) {
          // Backend 2-part format: hex_iv:base64_encrypted
          // This is data that backend failed to decrypt (Level 2 encryption)
          try {
            const cryptoKey = CryptoJS.enc.Utf8.parse(key.padEnd(32, '0'));
            const iv = CryptoJS.enc.Hex.parse(parts[0]);
            const encrypted = parts[1];
            
            const customDecrypted = CryptoJS.AES.decrypt(encrypted, cryptoKey, {
              iv: iv,
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7
            });
            
            const result = customDecrypted.toString(CryptoJS.enc.Utf8);
            if (result && result.length > 0) {
              console.log(`✅ Decrypted 2-part format with key: ${key}`);
              return result;
            }
          } catch (error) {
            // Continue to next format
          }
          
          // Try interpreting as CryptoJS format (treat the whole thing as encrypted data)
          try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
            const result = decrypted.toString(CryptoJS.enc.Utf8);
            if (result && result.length > 0) {
              console.log(`✅ Decrypted 2-part as CryptoJS with key: ${key}`);
              return result;
            }
          } catch (error) {
            // Continue to next key
          }
        }
      } catch (error) {
        // Continue to next key
      }
    }
    
    console.error('Frontend decryption error: Unable to decrypt with any key or format');
    console.error('Encrypted data format:', encryptedData);
    console.error('Data starts with U2FsdGVkX1 (CryptoJS salted):', encryptedData.startsWith('U2FsdGVkX1'));
    throw new Error('Failed to decrypt data');
  }

  /**
   * Encrypt student object (all sensitive fields)
   */
  static encryptStudentData(student: any): any {
    const encryptedStudent = { ...student };
    
    // Encrypt sensitive fields
    if (student.fullName) encryptedStudent.fullName = this.encrypt(student.fullName);
    if (student.email) encryptedStudent.email = this.encrypt(student.email);
    if (student.phone) encryptedStudent.phone = this.encrypt(student.phone);
    if (student.address) encryptedStudent.address = this.encrypt(student.address);
    if (student.courseEnrolled) encryptedStudent.courseEnrolled = this.encrypt(student.courseEnrolled);
    
    return encryptedStudent;
  }

  /**
   * Decrypt student object (all sensitive fields)
   */
  static decryptStudentData(encryptedStudent: any): any {
    const decryptedStudent = { ...encryptedStudent };
    
    // Decrypt sensitive fields with error handling
    try {
      if (encryptedStudent.fullName && typeof encryptedStudent.fullName === 'string') {
        decryptedStudent.fullName = this.decrypt(encryptedStudent.fullName);
      }
    } catch (error) {
      console.warn('Could not decrypt fullName:', error);
      decryptedStudent.fullName = encryptedStudent.fullName || 'Encrypted Data';
    }
    
    try {
      if (encryptedStudent.email && typeof encryptedStudent.email === 'string') {
        decryptedStudent.email = this.decrypt(encryptedStudent.email);
      }
    } catch (error) {
      console.warn('Could not decrypt email:', error);
      decryptedStudent.email = encryptedStudent.email || 'Encrypted Data';
    }
    
    try {
      if (encryptedStudent.phone && typeof encryptedStudent.phone === 'string') {
        decryptedStudent.phone = this.decrypt(encryptedStudent.phone);
      }
    } catch (error) {
      console.warn('Could not decrypt phone:', error);
      decryptedStudent.phone = encryptedStudent.phone || 'Encrypted Data';
    }
    
    try {
      if (encryptedStudent.address && typeof encryptedStudent.address === 'string') {
        decryptedStudent.address = this.decrypt(encryptedStudent.address);
      }
    } catch (error) {
      console.warn('Could not decrypt address:', error);
      decryptedStudent.address = encryptedStudent.address || 'Encrypted Data';
    }
    
    try {
      if (encryptedStudent.courseEnrolled && typeof encryptedStudent.courseEnrolled === 'string') {
        decryptedStudent.courseEnrolled = this.decrypt(encryptedStudent.courseEnrolled);
      }
    } catch (error) {
      console.warn('Could not decrypt courseEnrolled:', error);
      decryptedStudent.courseEnrolled = encryptedStudent.courseEnrolled || 'Encrypted Data';
    }
    
    return decryptedStudent;
  }

  /**
   * Generate session token for user authentication
   */
  static generateSessionToken(email: string): string {
    const timestamp = Date.now().toString();
    const sessionData = `${email}:${timestamp}`;
    return this.encrypt(sessionData);
  }

  /**
   * Validate session token
   */
  static validateSessionToken(token: string): { email: string; timestamp: number } | null {
    try {
      const decrypted = this.decrypt(token);
      const [email, timestamp] = decrypted.split(':');
      return { email, timestamp: parseInt(timestamp) };
    } catch (error) {
      return null;
    }
  }
}

export default FrontendCrypto;