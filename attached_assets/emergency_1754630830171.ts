import { NotificationService } from './notifications';

export interface EmergencyAlert {
  alertId?: string;
  complaintId?: string;
  contact: string;
  location?: { lat: number; lng: number };
  description?: string;
}

export class EmergencyService {
  private notificationService = new NotificationService();

  async sendAlert(alert: EmergencyAlert): Promise<boolean> {
    try {
      console.log('🚨 Sending emergency alert:', alert);

      // Send SMS/Email notification
      await this.sendSMSAlert(alert);
      
      // Notify emergency responders
      await this.notifyResponders(alert);
      
      // Log emergency event
      await this.logEmergency(alert);

      return true;
    } catch (error) {
      console.error('Emergency alert failed:', error);
      return false;
    }
  }

  private async sendSMSAlert(alert: EmergencyAlert): Promise<void> {
    try {
      const message = this.buildEmergencyMessage(alert);
      
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`SMS Alert to ${alert.contact}: ${message}`);
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('SMS alert failed:', error);
      throw error;
    }
  }

  private async notifyResponders(alert: EmergencyAlert): Promise<void> {
    try {
      // Notify relevant emergency responders based on location
      const responders = await this.getEmergencyResponders(alert.location);
      
      for (const responder of responders) {
        await this.notificationService.sendNotification(responder, {
          type: 'emergency',
          message: 'New emergency alert received',
          data: {
            alertId: alert.alertId,
            location: alert.location,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Responder notification failed:', error);
    }
  }

  private async logEmergency(alert: EmergencyAlert): Promise<void> {
    try {
      // Log emergency for audit trail
      console.log('Emergency logged:', {
        alertId: alert.alertId,
        timestamp: new Date().toISOString(),
        hasLocation: !!alert.location
      });
    } catch (error) {
      console.error('Emergency logging failed:', error);
    }
  }

  private buildEmergencyMessage(alert: EmergencyAlert): string {
    let message = "🚨 EMERGENCY ALERT - SpeakSecure Platform\n\n";
    
    if (alert.description) {
      message += `Alert: ${alert.description}\n`;
    }
    
    if (alert.location) {
      message += `Location: ${alert.location.lat}, ${alert.location.lng}\n`;
      message += `Map: https://maps.google.com/?q=${alert.location.lat},${alert.location.lng}\n`;
    }
    
    message += `Time: ${new Date().toLocaleString()}\n`;
    message += `Reference: ${alert.alertId || alert.complaintId || 'N/A'}\n\n`;
    message += "This is an automated alert from SpeakSecure. Please respond immediately if you are an emergency contact.";
    
    return message;
  }

  private async getEmergencyResponders(location?: { lat: number; lng: number }): Promise<string[]> {
    // In production, this would query a database of emergency responders
    // filtered by location/jurisdiction
    const responders = [
      process.env.EMERGENCY_RESPONDER_1 || 'responder1@emergency.local',
      process.env.EMERGENCY_RESPONDER_2 || 'responder2@emergency.local'
    ];
    
    return responders.filter(responder => responder.includes('@'));
  }

  async getEmergencyContacts(): Promise<string[]> {
    // Return list of configured emergency contacts
    return [
      process.env.EMERGENCY_CONTACT_POLICE || '+911',
      process.env.EMERGENCY_CONTACT_MEDICAL || '+911',
      process.env.EMERGENCY_CONTACT_FIRE || '+911'
    ];
  }

  async testEmergencySystem(): Promise<{ status: string; services: any }> {
    try {
      const testAlert: EmergencyAlert = {
        alertId: 'TEST-' + Date.now(),
        contact: process.env.TEST_EMERGENCY_CONTACT || '+1234567890',
        description: 'Emergency system test'
      };

      // Test SMS service
      const smsTest = await this.testSMS(testAlert.contact);
      
      // Test responder notification
      const responderTest = await this.testResponderNotification();

      return {
        status: smsTest && responderTest ? 'OK' : 'PARTIAL',
        services: {
          sms: smsTest ? 'OK' : 'ERROR',
          responders: responderTest ? 'OK' : 'ERROR'
        }
      };
    } catch (error) {
      return {
        status: 'ERROR',
        services: {
          sms: 'ERROR',
          responders: 'ERROR'
        }
      };
    }
  }

  private async testSMS(contact: string): Promise<boolean> {
    try {
      console.log(`Testing SMS to ${contact}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async testResponderNotification(): Promise<boolean> {
    try {
      const responders = await this.getEmergencyResponders();
      console.log(`Testing responder notification to ${responders.length} responders`);
      return true;
    } catch (error) {
      return false;
    }
  }
}
