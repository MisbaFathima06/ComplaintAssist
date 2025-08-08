import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { zkIdentityService } from '../services/zk-identity';
import { insertUpvoteSchema } from '@shared/schema';

const router = Router();

// Upvote a complaint with ZK proof
router.post('/', async (req, res) => {
  try {
    console.log('👍 Processing upvote...');
    
    const upvoteSchema = insertUpvoteSchema.extend({
      action: z.string().default('upvote'),
      topic: z.string() // complaint reference ID
    });

    const validationResult = upvoteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid upvote data',
        details: validationResult.error.errors
      });
    }

    const { complaintId, nullifierHash, zkProof, action, topic } = validationResult.data;

    // Check if complaint exists
    const complaint = await storage.getComplaintById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Check if nullifier already used for this action/topic
    const alreadyUsed = await storage.checkNullifierUsed(nullifierHash, action, topic);
    if (alreadyUsed) {
      return res.status(409).json({
        success: false,
        error: 'You have already upvoted this complaint'
      });
    }

    // Verify ZK proof
    const zkProofData = {
      proof: zkProof,
      publicSignals: [nullifierHash, action, topic], // Simplified
      nullifierHash
    };

    const isValidProof = await zkIdentityService.verifyProof(zkProofData, action, topic);
    if (!isValidProof) {
      return res.status(401).json({
        success: false,
        error: 'Invalid zero-knowledge proof'
      });
    }

    // Create upvote record
    const upvote = await storage.createUpvote({
      complaintId,
      nullifierHash,
      zkProof
    });

    // Increment complaint upvote count
    await storage.incrementComplaintUpvotes(complaintId);

    // Track nullifier usage
    await storage.addNullifier(nullifierHash, action, topic);

    console.log(`✅ Upvote recorded for complaint: ${complaintId}`);

    res.json({
      success: true,
      upvoteId: upvote.id,
      complaintId,
      newUpvoteCount: complaint.upvotes + 1,
      message: 'Upvote recorded successfully'
    });

  } catch (error) {
    console.error('Upvote failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record upvote',
      message: error.message
    });
  }
});

// Check if user can upvote a complaint
router.post('/check', async (req, res) => {
  try {
    const checkSchema = z.object({
      complaintId: z.string().min(1),
      nullifierHash: z.string().min(1),
      action: z.string().default('upvote')
    });

    const validationResult = checkSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid check data',
        details: validationResult.error.errors
      });
    }

    const { complaintId, nullifierHash, action } = validationResult.data;

    // Check if complaint exists
    const complaint = await storage.getComplaintById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    // Use reference ID as topic for nullifier check
    const topic = complaint.referenceId;

    // Check if nullifier already used
    const alreadyUsed = await storage.checkNullifierUsed(nullifierHash, action, topic);

    res.json({
      success: true,
      canUpvote: !alreadyUsed,
      alreadyUpvoted: alreadyUsed,
      complaintId,
      currentUpvotes: complaint.upvotes,
      message: alreadyUsed ? 'Already upvoted' : 'Can upvote'
    });

  } catch (error) {
    console.error('Upvote check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check upvote eligibility'
    });
  }
});

// Get upvote statistics for a complaint
router.get('/stats/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await storage.getComplaintById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      stats: {
        complaintId,
        totalUpvotes: complaint.upvotes,
        referenceId: complaint.referenceId,
        category: complaint.category,
        status: complaint.status,
        createdAt: complaint.createdAt
      }
    });

  } catch (error) {
    console.error('Failed to get upvote stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve upvote statistics'
    });
  }
});

// Get trending complaints (most upvoted)
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const timeframe = req.query.timeframe as string || '7d'; // 1d, 7d, 30d

    // Get public complaints and sort by upvotes
    const complaints = await storage.getPublicComplaints(50, 0);
    
    // Sort by upvotes (descending) and take top N
    const trending = complaints
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, limit)
      .map(complaint => ({
        referenceId: complaint.referenceId,
        category: complaint.category,
        status: complaint.status,
        upvotes: complaint.upvotes,
        tags: complaint.tags,
        createdAt: complaint.createdAt,
        // Note: encrypted content not returned
      }));

    res.json({
      success: true,
      trending,
      timeframe,
      count: trending.length,
      message: 'Trending complaints retrieved successfully'
    });

  } catch (error) {
    console.error('Failed to get trending complaints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trending complaints'
    });
  }
});

export default router;
