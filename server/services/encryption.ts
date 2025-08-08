import crypto from 'crypto';

export interface EncryptedData {
  encryptedContent: string;
  iv: string;
  authTag: string;
  key: string;
}

export interface DecryptedData {
  content: string;
}

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits

  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  generateIV(): string {
    return crypto.randomBytes(this.ivLength).toString('hex');
  }

  encrypt(plaintext: string, key?: string): EncryptedData {
    try {
      const encryptionKey = key ? Buffer.from(key, 'hex') : crypto.randomBytes(this.keyLength);
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipherGCM(this.algorithm, encryptionKey, iv);
      cipher.setAAD(Buffer.from('speaksecure-auth'));
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encryptedContent: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        key: encryptionKey.toString('hex')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedData: EncryptedData): DecryptedData {
    try {
      const key = Buffer.from(encryptedData.key, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipherGCM(this.algorithm, key, iv);
      decipher.setAAD(Buffer.from('speaksecure-auth'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encryptedContent, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return {
        content: decrypted
      };
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Client-side encryption helper
  encryptForClient(data: any): string {
    const jsonString = JSON.stringify(data);
    const encrypted = this.encrypt(jsonString);
    
    // Return a single encrypted string that includes all components
    return Buffer.from(JSON.stringify(encrypted)).toString('base64');
  }

  // Client-side decryption helper
  decryptFromClient(encryptedString: string): any {
    try {
      const encryptedData = JSON.parse(Buffer.from(encryptedString, 'base64').toString());
      const decrypted = this.decrypt(encryptedData);
      return JSON.parse(decrypted.content);
    } catch (error) {
      console.error('Client decryption failed:', error);
      throw new Error('Failed to decrypt client data');
    }
  }

  // Hash function for blockchain
  generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate reference ID
  generateReferenceId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(6).toString('hex');
    return `SS-${timestamp}-${random}`.toUpperCase();
  }

  // Secure comparison
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

export const encryptionService = new EncryptionService();
