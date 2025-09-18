declare class BackendCrypto {
    private static readonly ALGORITHM;
    private static readonly ENCRYPTION_KEY;
    private static readonly IV_LENGTH;
    /**
     * Generate a cryptographic key from the base key
     */
    private static getKey;
    /**
     * Encrypt data on the backend (Level 2 encryption)
     */
    static encrypt(data: string): string;
    /**
     * Decrypt data on the backend (Level 2 decryption)
     */
    static decrypt(encryptedData: string): string;
    /**
     * Encrypt student object for database storage (Level 2)
     */
    static encryptStudentForDB(student: any): any;
    /**
     * Decrypt student object from database (Level 2 only, leaving Level 1 for frontend)
     */
    static decryptStudentFromDB(encryptedStudent: any): any;
    /**
     * Hash password for authentication (separate from encryption)
     */
    static hashPassword(password: string): string;
    /**
     * Verify password against hash
     */
    static verifyPassword(password: string, hash: string): boolean;
    /**
     * Generate JWT-like token for authentication
     */
    static generateAuthToken(payload: any): string;
    /**
     * Verify and decode auth token
     */
    static verifyAuthToken(token: string): any;
}
export default BackendCrypto;
//# sourceMappingURL=crypto.d.ts.map