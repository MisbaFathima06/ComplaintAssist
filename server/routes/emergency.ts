import { Router } from 'express';
import { z } from 'zod';
import { emergencyService } from '../services/emergency';
import { zkIdentityService } from '../services/zk-identity';

const router = Router();

// Send emergency alert
router.post('/alert', async (req, res) => {
  try {
    console.log('🚨 Processing emergency alert...');
    
    const alertSchema = z.object({
      content: z.string().min(1, 'Alert content is required'),
      emergencyContact: z.string().min(1, 'Emergency contact is required'),
      location: z.object({
        latitude: z.number(),
        longitude: z.number()
      }).optional(),
      zkCommitment: z.string().min(1, 'ZK commitment is required'),
      priority: z.enum(['high', 'critical']).default('critical')
    });

    const validationResult = alertSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid emergency alert data',
        details: validationResult.error.errors
      });
    }

    const alertData = validationResult.data;

    // Verify ZK identity
    const identityValid = await zkIdentityService.verifyIdentity(alertData.zkCommitment);
    if (!identityValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid zero-knowledge identity'
      });
    }

    // Process emergency alert
    const response = await emergencyService.sendEmergencyAlert({
      content: alertData.content,
      emergencyContact: alertData.emergencyContact,
      location: alertData.location,
      zkCommitment: alertData.zkCommitment,
      priority: alertData.priority
    });

    console.log(`✅ Emergency alert processed: ${response.alertId}`);

    res.json({
      success: true,
      alertId: response.alertId,
      status: response.status,
      transactionHash: response.transactionHash,
      ipfsHash: response.ipfsHash,
      timestamp: response.timestamp,
      message: 'Emergency alert sent successfully'
    });

  } catch (error) {
    console.error('Emergency alert failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send emergency alert',
      message: error.message
    });
  }
});

// Test emergency system
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Testing emergency system...');
    
    const testResult = await emergencyService.testEmergencySystem();
    
    if (testResult.success) {
      console.log('✅ Emergency system test passed');
    } else {
      console.log('❌ Emergency system test failed');
    }

    res.json({
      success: testResult.success,
      message: testResult.message,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Emergency system test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Emergency system test failed',
      message: error.message
    });
  }
});

// Get emergency alerts (admin only - would need auth in production)
router.get('/alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    const alerts = await emergencyService.getEmergencyAlerts(limit);
    
    res.json({
      success: true,
      alerts,
      count: alerts.length,
      message: 'Emergency alerts retrieved successfully'
    });

  } catch (error) {
    console.error('Failed to get emergency alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve emergency alerts'
    });
  }
});

// Get emergency system status
router.get('/status', async (req, res) => {
  try {
    // Check if emergency services are configured
    const hasEmergencyContacts = !!(
      process.env.EMERGENCY_CONTACT_1 || 
      process.env.EMERGENCY_CONTACT_2 || 
      process.env.EMERGENCY_CONTACT_3
    );

    const hasSMSConfig = !!(
      process.env.TWILIO_ACCOUNT_SID && 
      process.env.TWILIO_AUTH_TOKEN
    );

    res.json({
      success: true,
      status: {
        operational: true,
        emergencyContacts: hasEmergencyContacts,
        smsService: hasSMSConfig,
        features: {
          locationTracking: true,
          blockchainLogging: true,
          ipfsStorage: true,
          encryption: true
        },
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('Failed to get emergency status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get emergency system status'
    });
  }
});

// Emergency contact validation
router.post('/validate-contact', async (req, res) => {
  try {
    const contactSchema = z.object({
      emergencyContact: z.string().min(1, 'Emergency contact is required')
    });

    const validationResult = contactSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contact data',
        details: validationResult.error.errors
      });
    }

    const { emergencyContact } = validationResult.data;

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const isValidPhone = phoneRegex.test(emergencyContact.replace(/[\s\-\(\)]/g, ''));

    res.json({
      success: true,
      valid: isValidPhone,
      contact: emergencyContact,
      message: isValidPhone ? 'Valid emergency contact' : 'Invalid phone number format'
    });

  } catch (error) {
    console.error('Contact validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate emergency contact'
    });
  }
});

export default router;
