import crypto from 'crypto';

export interface EncryptedData {
  encryptedData: string;
  key: string;
  iv: string;
}

export class EncryptionService {
  private algorithm = 'aes-256-cbc';

  async encrypt(data: string): Promise<EncryptedData> {
    try {
      // Generate random key and IV
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAutoPadding(true);
      
      // Encrypt data
      let encryptedData = cipher.update(data, 'utf8', 'hex');
      encryptedData += cipher.final('hex');
      
      return {
        encryptedData,
        key: key.toString('hex'),
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decrypt(encryptedData: string, keyHex: string, ivHex: string): Promise<string> {
    try {
      const key = Buffer.from(keyHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAutoPadding(true);
      
      // Decrypt data
      let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');
      
      return decryptedData;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async hashData(data: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  async verifyHash(data: string, hash: string): Promise<boolean> {
    const computedHash = await this.hashData(data);
    return computedHash === hash;
  }
}
