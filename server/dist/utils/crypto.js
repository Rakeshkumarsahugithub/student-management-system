"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
// Backend encryption utility (Level 2 - Server-side)
class BackendCrypto {
    /**
     * Generate a cryptographic key from the base key
     */
    static getKey() {
        return crypto_1.default.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    }
    /**
     * Encrypt data on the backend (Level 2 encryption)
     */
    static encrypt(data) {
        try {
            const key = this.getKey();
            const iv = crypto_1.default.randomBytes(this.IV_LENGTH);
            const cipher = crypto_1.default.createCipheriv(this.ALGORITHM, key, iv);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            // Combine IV, authTag, and encrypted data
            const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
            return result;
        }
        catch (error) {
            console.error('Backend encryption error:', error);
            throw new Error('Failed to encrypt data on backend');
        }
    }
    /**
     * Decrypt data on the backend (Level 2 decryption)
     */
    static decrypt(encryptedData) {
        try {
            const key = this.getKey();
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const decipher = crypto_1.default.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            console.error('Backend decryption error:', error);
            throw new Error('Failed to decrypt data on backend');
        }
    }
    /**
     * Encrypt student object for database storage (Level 2)
     */
    static encryptStudentForDB(student) {
        const encryptedStudent = { ...student };
        // Apply Level 2 encryption to already Level 1 encrypted fields
        if (student.fullName)
            encryptedStudent.fullName = this.encrypt(student.fullName);
        if (student.email)
            encryptedStudent.email = this.encrypt(student.email);
        if (student.phone)
            encryptedStudent.phone = this.encrypt(student.phone);
        if (student.address)
            encryptedStudent.address = this.encrypt(student.address);
        if (student.courseEnrolled)
            encryptedStudent.courseEnrolled = this.encrypt(student.courseEnrolled);
        if (student.password)
            encryptedStudent.password = this.encrypt(student.password); // Password gets double encryption
        return encryptedStudent;
    }
    /**
     * Decrypt student object from database (Level 2 only, leaving Level 1 for frontend)
     */
    static decryptStudentFromDB(encryptedStudent) {
        const decryptedStudent = { ...encryptedStudent };
        // Decrypt Level 2 encryption only, leaving Level 1 for frontend
        if (encryptedStudent.fullName)
            decryptedStudent.fullName = this.decrypt(encryptedStudent.fullName);
        if (encryptedStudent.email)
            decryptedStudent.email = this.decrypt(encryptedStudent.email);
        if (encryptedStudent.phone)
            decryptedStudent.phone = this.decrypt(encryptedStudent.phone);
        if (encryptedStudent.address)
            decryptedStudent.address = this.decrypt(encryptedStudent.address);
        if (encryptedStudent.courseEnrolled)
            decryptedStudent.courseEnrolled = this.decrypt(encryptedStudent.courseEnrolled);
        if (encryptedStudent.password)
            decryptedStudent.password = this.decrypt(encryptedStudent.password);
        return decryptedStudent;
    }
    /**
     * Hash password for authentication (separate from encryption)
     */
    static hashPassword(password) {
        return crypto_1.default.pbkdf2Sync(password, 'student-mgmt-salt', 10000, 64, 'sha512').toString('hex');
    }
    /**
     * Verify password against hash
     */
    static verifyPassword(password, hash) {
        const hashVerify = this.hashPassword(password);
        return hashVerify === hash;
    }
    /**
     * Generate JWT-like token for authentication
     */
    static generateAuthToken(payload) {
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
    static verifyAuthToken(token) {
        try {
            const decrypted = this.decrypt(token);
            const tokenData = JSON.parse(decrypted);
            if (Date.now() > tokenData.expires) {
                throw new Error('Token expired');
            }
            return tokenData;
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
}
BackendCrypto.ALGORITHM = 'aes-256-gcm';
BackendCrypto.ENCRYPTION_KEY = process.env.BACKEND_ENCRYPTION_KEY || 'backend-encryption-key-2024-very-secure'; // In production, use strong environment variable
BackendCrypto.IV_LENGTH = 16; // For AES, this is always 16
exports.default = BackendCrypto;
//# sourceMappingURL=crypto.js.map