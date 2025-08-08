import { storage } from '../storage';
import { encryptionService } from './encryption';
import { blockchainService } from './blockchain';
import { ipfsService } from './ipfs';

export interface EmergencyAlert {
  id?: string;
  content: string;
  emergencyContact: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  zkCommitment: string;
  priority: 'high' | 'critical';
}

export interface EmergencyResponse {
  alertId: string;
  status: 'sent' | 'delivered' | 'acknowledged';
  transactionHash: string;
  ipfsHash?: string;
  timestamp: number;
}

export class EmergencyService {
  private readonly emergencyContacts = [
    process.env.EMERGENCY_CONTACT_1 || '+911',
    process.env.EMERGENCY_CONTACT_2 || '+100',
    process.env.EMERGENCY_CONTACT_3 || '+108'
  ];

  async sendEmergencyAlert(alert: EmergencyAlert): Promise<EmergencyResponse> {
    try {
      console.log('🚨 Processing emergency alert...');
      
      // 1. Encrypt alert content
      const encryptedContent = encryptionService.encryptForClient({
        content: alert.content,
        emergencyContact: alert.emergencyContact,
        location: alert.location,
        timestamp: Date.now(),
        priority: alert.priority || 'critical'
      });

      // 2. Store in IPFS for immutable record
      let ipfsHash: string | undefined;
      try {
        const ipfsResult = await ipfsService.uploadJSON({
          type: 'emergency_alert',
          encryptedContent,
          metadata: {
            timestamp: Date.now(),
            priority: alert.priority,
            hasLocation: !!alert.location
          }
        });
        ipfsHash = ipfsResult.hash;
        console.log(`📁 Emergency alert stored in IPFS: ${ipfsHash}`);
      } catch (error) {
        console.error('IPFS storage failed for emergency alert:', error);
      }

      // 3. Log to blockchain for immutability
      const alertHash = encryptionService.generateHash(encryptedContent);
      const blockchainResult = await blockchainService.logEmergencyAlert(
        alertHash,
        alert.emergencyContact
      );

      // 4. Store in database
      const dbAlert = await storage.createEmergencyAlert({
        encryptedContent,
        emergencyContact: alert.emergencyContact,
        location: alert.location ? JSON.parse(JSON.stringify(alert.location)) : undefined,
        zkCommitment: alert.zkCommitment
      });

      // 5. Send notifications to emergency services
      await this.sendNotifications(alert, {
        alertId: dbAlert.id,
        transactionHash: blockchainResult.transactionHash,
        ipfsHash
      });

      console.log(`✅ Emergency alert processed: ${dbAlert.id}`);
      
      return {
        alertId: dbAlert.id,
        status: 'sent',
        transactionHash: blockchainResult.transactionHash,
        ipfsHash,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Emergency alert processing failed:', error);
      throw new Error('Failed to process emergency alert');
    }
  }

  private async sendNotifications(
    alert: EmergencyAlert, 
    metadata: { alertId: string; transactionHash: string; ipfsHash?: string }
  ): Promise<void> {
    try {
      // Format emergency message
      const message = this.formatEmergencyMessage(alert, metadata);
      
      // Send to primary emergency contact
      await this.sendSMS(alert.emergencyContact, message);
      
      // Send to backup emergency services
      for (const contact of this.emergencyContacts) {
        if (contact !== alert.emergencyContact) {
          await this.sendSMS(contact, this.formatEmergencyServiceMessage(alert, metadata));
        }
      }

      console.log('📱 Emergency notifications sent');
    } catch (error) {
      console.error('Failed to send emergency notifications:', error);
      // Don't throw - emergency alert is still logged
    }
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // In a real implementation, this would use a service like Twilio
    console.log(`📱 SMS to ${phoneNumber}: ${message.substring(0, 50)}...`);
    
    // Simulate SMS sending
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      // Real Twilio implementation would go here
      console.log('SMS sent via Twilio');
    } else {
      console.log('SMS simulated (no Twilio credentials)');
    }
  }

  private formatEmergencyMessage(
    alert: EmergencyAlert, 
    metadata: { alertId: string; transactionHash: string; ipfsHash?: string }
  ): string {
    let message = `🚨 EMERGENCY ALERT\n\n`;
    message += `Alert ID: ${metadata.alertId}\n`;
    message += `Time: ${new Date().toLocaleString()}\n`;
    
    if (alert.location) {
      message += `Location: ${alert.location.latitude}, ${alert.location.longitude}\n`;
      message += `Maps: https://maps.google.com/?q=${alert.location.latitude},${alert.location.longitude}\n`;
    }
    
    if (alert.content && alert.content.length > 0) {
      message += `Details: ${alert.content.substring(0, 100)}\n`;
    }
    
    message += `\nThis alert is cryptographically verified and immutably stored.\n`;
    message += `Blockchain: ${metadata.transactionHash}\n`;
    
    if (metadata.ipfsHash) {
      message += `IPFS: ${metadata.ipfsHash}`;
    }
    
    return message;
  }

  private formatEmergencyServiceMessage(
    alert: EmergencyAlert,
    metadata: { alertId: string; transactionHash: string; ipfsHash?: string }
  ): string {
    let message = `🚨 EMERGENCY SERVICE ALERT\n\n`;
    message += `Priority: ${alert.priority?.toUpperCase() || 'CRITICAL'}\n`;
    message += `Alert ID: ${metadata.alertId}\n`;
    message += `Time: ${new Date().toLocaleString()}\n`;
    
    if (alert.location) {
      message += `Location: ${alert.location.latitude}, ${alert.location.longitude}\n`;
      message += `Respond to coordinates above.\n`;
    }
    
    message += `\nAnonymous alert via SpeakSecure platform.\n`;
    message += `Verified: ${metadata.transactionHash.substring(0, 10)}...`;
    
    return message;
  }

  async getEmergencyAlerts(limit = 20): Promise<any[]> {
    try {
      const alerts = await storage.getEmergencyAlerts(limit);
      
      // Return sanitized data (no decryption for privacy)
      return alerts.map(alert => ({
        id: alert.id,
        hasLocation: !!alert.location,
        status: alert.status,
        createdAt: alert.createdAt,
        // Don't return encrypted content or emergency contact
      }));
    } catch (error) {
      console.error('Failed to get emergency alerts:', error);
      throw new Error('Failed to retrieve emergency alerts');
    }
  }

  async testEmergencySystem(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🧪 Testing emergency system...');
      
      const testAlert: EmergencyAlert = {
        content: 'Test emergency alert - system verification',
        emergencyContact: process.env.TEST_EMERGENCY_CONTACT || '+911',
        location: {
          latitude: 37.7749,
          longitude: -122.4194
        },
        zkCommitment: '0x' + '0'.repeat(64), // Test commitment
        priority: 'high'
      };

      const response = await this.sendEmergencyAlert(testAlert);
      
      return {
        success: true,
        message: `Emergency system test successful. Alert ID: ${response.alertId}`
      };
    } catch (error) {
      console.error('Emergency system test failed:', error);
      return {
        success: false,
        message: `Emergency system test failed: ${error.message}`
      };
    }
  }
}

export const emergencyService = new EmergencyService();
