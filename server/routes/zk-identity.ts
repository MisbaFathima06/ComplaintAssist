import { Router } from 'express';
import { z } from 'zod';
import { zkIdentityService } from '../services/zk-identity';
import { storage } from '../storage';

const router = Router();

// Generate a new ZK identity
router.post('/identity', async (req, res) => {
  try {
    console.log('🔐 Generating Zero-Knowledge Identity...');
    
    const { groupId } = req.body;
    
    // Generate ZK identity
    const identity = await zkIdentityService.generateIdentity(groupId);
    
    console.log(`✅ ZK Identity generated: ${identity.commitment.substring(0, 10)}...`);
    
    res.json({
      success: true,
      commitment: identity.commitment,
      nullifierHash: identity.nullifierHash,
      groupId: identity.groupId,
      message: 'Zero-knowledge identity generated successfully'
    });
    
  } catch (error) {
    console.error('ZK identity generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate zero-knowledge identity',
      message: error.message
    });
  }
});

// Generate a ZK proof
router.post('/proof', async (req, res) => {
  try {
    const proofSchema = z.object({
      commitment: z.string().min(1),
      nullifier: z.string().min(1),
      trapdoor: z.string().min(1),
      groupId: z.string().min(1),
      action: z.string().min(1),
      topic: z.string().min(1)
    });

    const validationResult = proofSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proof request data',
        details: validationResult.error.errors
      });
    }

    const { commitment, nullifier, trapdoor, groupId, action, topic } = validationResult.data;

    // Create identity object
    const identity = {
      commitment,
      nullifier,
      trapdoor,
      nullifierHash: '', // Will be generated in proof
      groupId
    };

    // Generate proof
    const proof = await zkIdentityService.generateProof(identity, action, topic);
    
    console.log(`🔏 ZK Proof generated for action: ${action}`);
    
    res.json({
      success: true,
      proof: proof.proof,
      publicSignals: proof.publicSignals,
      nullifierHash: proof.nullifierHash,
      message: 'Zero-knowledge proof generated successfully'
    });
    
  } catch (error) {
    console.error('ZK proof generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate zero-knowledge proof',
      message: error.message
    });
  }
});

// Verify a ZK proof
router.post('/verify', async (req, res) => {
  try {
    const verifySchema = z.object({
      proof: z.string().min(1),
      publicSignals: z.array(z.string()),
      nullifierHash: z.string().min(1),
      action: z.string().min(1),
      topic: z.string().min(1)
    });

    const validationResult = verifySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification data',
        details: validationResult.error.errors
      });
    }

    const { proof, publicSignals, nullifierHash, action, topic } = validationResult.data;

    const zkProof = {
      proof,
      publicSignals,
      nullifierHash
    };

    // Verify proof
    const isValid = await zkIdentityService.verifyProof(zkProof, action, topic);
    
    if (isValid) {
      console.log(`✅ ZK Proof verified for action: ${action}`);
    } else {
      console.log(`❌ ZK Proof verification failed for action: ${action}`);
    }
    
    res.json({
      success: isValid,
      verified: isValid,
      message: isValid ? 'Proof verified successfully' : 'Proof verification failed'
    });
    
  } catch (error) {
    console.error('ZK proof verification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify zero-knowledge proof',
      message: error.message
    });
  }
});

// Verify nullifier (check if already used)
router.post('/nullifier/check', async (req, res) => {
  try {
    const checkSchema = z.object({
      nullifierHash: z.string().min(1),
      action: z.string().min(1),
      topic: z.string().min(1)
    });

    const validationResult = checkSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid nullifier check data',
        details: validationResult.error.errors
      });
    }

    const { nullifierHash, action, topic } = validationResult.data;

    // Check if nullifier was already used
    const alreadyUsed = await storage.checkNullifierUsed(nullifierHash, action, topic);
    
    res.json({
      success: true,
      alreadyUsed,
      available: !alreadyUsed,
      message: alreadyUsed ? 'Nullifier already used' : 'Nullifier available'
    });
    
  } catch (error) {
    console.error('Nullifier check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check nullifier',
      message: error.message
    });
  }
});

// Get ZK identity by commitment (for verification)
router.get('/identity/:commitment', async (req, res) => {
  try {
    const { commitment } = req.params;

    if (!commitment || commitment.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid commitment'
      });
    }

    const identity = await storage.getZkIdentityByCommitment(commitment);
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        error: 'Identity not found'
      });
    }

    // Return only public information
    res.json({
      success: true,
      identity: {
        commitment: identity.commitment,
        groupId: identity.groupId,
        isValid: identity.isValid,
        createdAt: identity.createdAt
        // Note: nullifierHash is not returned for privacy
      }
    });
    
  } catch (error) {
    console.error('Failed to get ZK identity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve identity'
    });
  }
});

// Get ZK system statistics
router.get('/stats', async (req, res) => {
  try {
    // In a real implementation, you'd have proper aggregation queries
    res.json({
      success: true,
      stats: {
        totalIdentities: 0,
        activeIdentities: 0,
        totalProofs: 0,
        recentActivity: []
      }
    });
  } catch (error) {
    console.error('Failed to get ZK stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve ZK statistics'
    });
  }
});

export default router;
