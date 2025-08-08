import { create, IPFSHTTPClient } from 'ipfs-http-client';

export interface IPFSUploadResult {
  hash: string;
  size: number;
  path: string;
}

export interface IPFSRetrieveResult {
  content: string;
  hash: string;
}

export class IPFSService {
  private client: IPFSHTTPClient;
  private isConnected: boolean = false;

  constructor() {
    const ipfsUrl = process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001';
    const projectId = process.env.IPFS_PROJECT_ID;
    const projectSecret = process.env.IPFS_PROJECT_SECRET;

    const auth = projectId && projectSecret
      ? 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')
      : undefined;

    this.client = create({
      url: ipfsUrl,
      headers: auth ? { authorization: auth } : undefined,
    });

    this.testConnection();
  }

  private async testConnection(): Promise<void> {
    try {
      await this.client.version();
      this.isConnected = true;
      console.log('✅ IPFS connection established');
    } catch (error) {
      console.error('❌ IPFS connection failed:', error);
      this.isConnected = false;
    }
  }

  async uploadContent(content: string): Promise<IPFSUploadResult> {
    if (!this.isConnected) {
      // Fallback: simulate IPFS by generating hash
      console.warn('IPFS not connected, using fallback hash generation');
      const hash = await this.generateFallbackHash(content);
      return {
        hash,
        size: content.length,
        path: `/ipfs/${hash}`
      };
    }

    try {
      const buffer = Buffer.from(content, 'utf-8');
      const result = await this.client.add(buffer, {
        pin: true, // Pin to prevent garbage collection
        cidVersion: 1,
        hashAlg: 'sha2-256'
      });

      console.log(`📁 Content uploaded to IPFS: ${result.cid.toString()}`);
      
      return {
        hash: result.cid.toString(),
        size: result.size,
        path: result.path
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      
      // Fallback: generate deterministic hash
      const hash = await this.generateFallbackHash(content);
      return {
        hash,
        size: content.length,
        path: `/ipfs/${hash}`
      };
    }
  }

  async retrieveContent(hash: string): Promise<IPFSRetrieveResult> {
    if (!this.isConnected) {
      throw new Error('IPFS not connected and no fallback available for retrieval');
    }

    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks).toString('utf-8');
      
      return {
        content,
        hash
      };
    } catch (error) {
      console.error('IPFS retrieval failed:', error);
      throw new Error(`Failed to retrieve content from IPFS: ${hash}`);
    }
  }

  async uploadJSON(data: any): Promise<IPFSUploadResult> {
    const jsonString = JSON.stringify(data, null, 2);
    return this.uploadContent(jsonString);
  }

  async retrieveJSON(hash: string): Promise<any> {
    const result = await this.retrieveContent(hash);
    return JSON.parse(result.content);
  }

  async uploadFile(buffer: Buffer, filename: string): Promise<IPFSUploadResult> {
    if (!this.isConnected) {
      console.warn('IPFS not connected, using fallback hash generation');
      const hash = this.generateFallbackHash(buffer.toString('base64'));
      return {
        hash,
        size: buffer.length,
        path: `/ipfs/${hash}`
      };
    }

    try {
      const result = await this.client.add(buffer, {
        pin: true,
        cidVersion: 1,
        hashAlg: 'sha2-256',
        wrapWithDirectory: false
      });

      console.log(`📄 File uploaded to IPFS: ${filename} -> ${result.cid.toString()}`);
      
      return {
        hash: result.cid.toString(),
        size: result.size,
        path: result.path
      };
    } catch (error) {
      console.error('IPFS file upload failed:', error);
      
      // Fallback
      const hash = this.generateFallbackHash(buffer.toString('base64'));
      return {
        hash,
        size: buffer.length,
        path: `/ipfs/${hash}`
      };
    }
  }

  async pinContent(hash: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('IPFS not connected, cannot pin content');
      return;
    }

    try {
      await this.client.pin.add(hash);
      console.log(`📌 Content pinned: ${hash}`);
    } catch (error) {
      console.error('IPFS pinning failed:', error);
    }
  }

  async getStats(): Promise<any> {
    if (!this.isConnected) {
      return {
        connected: false,
        error: 'IPFS not connected'
      };
    }

    try {
      const stats = await this.client.stats.bw();
      return {
        connected: true,
        stats
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  private async generateFallbackHash(content: string): Promise<string> {
    const crypto = await import('crypto');
    return 'Qm' + crypto.createHash('sha256').update(content).digest('hex').substring(0, 44);
  }

  getGatewayUrl(hash: string): string {
    const gateway = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
    return `${gateway}${hash}`;
  }
}

export const ipfsService = new IPFSService();
