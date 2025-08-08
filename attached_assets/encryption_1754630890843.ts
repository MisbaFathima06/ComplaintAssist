export class ClientEncryption {
  private static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  private static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  private static async importKey(keyData: string): Promise<CryptoKey> {
    const raw = new Uint8Array(atob(keyData).split('').map(c => c.charCodeAt(0)));
    return await crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(data: string): Promise<{ encryptedData: string; key: string; iv: string }> {
    const key = await this.generateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encodedData = new TextEncoder().encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedData
    );
    
    return {
      encryptedData: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      key: await this.exportKey(key),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  static async decrypt(encryptedData: string, keyData: string, ivData: string): Promise<string> {
    const key = await this.importKey(keyData);
    const iv = new Uint8Array(atob(ivData).split('').map(c => c.charCodeAt(0)));
    const encrypted = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }

  static generateRandomId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
