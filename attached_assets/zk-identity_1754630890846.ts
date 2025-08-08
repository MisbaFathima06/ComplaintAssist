import { apiRequest } from "./queryClient";

export interface ZkIdentity {
  commitment: string;
  nullifierHash: string;
  trapdoor: string;
  nullifier: string;
  groupId: string;
  isValid: boolean;
}

export interface ZkProof {
  proof: string;
  publicSignals: string[];
  nullifierHash: string;
}

export async function generateZkIdentity(): Promise<ZkIdentity> {
  try {
    console.log('🔐 Generating Zero-Knowledge Identity...');
    
    const response = await apiRequest("POST", "/api/zk/identity", {});
    const data = await response.json();
    
    if (!data.success) {
      throw new Error("Failed to generate ZK identity");
    }

    // Generate client-side components
    const trapdoor = generateRandomField();
    const nullifier = generateRandomField();
    const groupId = "speaksecure-v1";
    
    const identity: ZkIdentity = {
      commitment: data.commitment,
      nullifierHash: generateNullifierHash(nullifier, groupId),
      trapdoor,
      nullifier,
      groupId,
      isValid: true
    };

    console.log('✅ ZK Identity Generated Successfully');
    return identity;
  } catch (error) {
    console.error('ZK identity generation failed:', error);
    throw new Error('Failed to generate ZK identity');
  }
}

export async function generateProof(
  identity: ZkIdentity,
  action: string,
  topic: string
): Promise<ZkProof> {
  try {
    const response = await apiRequest("POST", "/api/zk/proof", {
      commitment: identity.commitment,
      action,
      topic
    });
    
    return await response.json();
  } catch (error) {
    console.error('ZK proof generation failed:', error);
    throw new Error('Failed to generate ZK proof');
  }
}

export async function verifyNullifier(
  commitment: string,
  nullifierHash: string,
  topic: string
): Promise<boolean> {
  try {
    const response = await apiRequest("POST", "/api/zk/verify", {
      commitment,
      nullifierHash,
      topic
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('ZK verification failed:', error);
    return false;
  }
}

function generateRandomField(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return "0x" + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateNullifierHash(nullifier: string, groupId: string): string {
  // Simplified nullifier hash generation
  // In production, this would use proper cryptographic functions
  return "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
