import { WebSocket } from 'ws';

export interface NotificationData {
  type: string;
  message: string;
  data?: any;
}

export class NotificationService {
  private subscribers = new Map<WebSocket, Set<string>>();
  private topicSubscribers = new Map<string, Set<WebSocket>>();

  subscribe(ws: WebSocket, topic: string, identifier?: string): void {
    // Add to subscriber list
    if (!this.subscribers.has(ws)) {
      this.subscribers.set(ws, new Set());
    }
    this.subscribers.get(ws)!.add(topic);

    // Add to topic subscribers
    const topicKey = identifier ? `${topic}:${identifier}` : topic;
    if (!this.topicSubscribers.has(topicKey)) {
      this.topicSubscribers.set(topicKey, new Set());
    }
    this.topicSubscribers.get(topicKey)!.add(ws);

    console.log(`WebSocket subscribed to topic: ${topicKey}`);
  }

  unsubscribe(ws: WebSocket): void {
    const topics = this.subscribers.get(ws);
    if (topics) {
      // Remove from topic subscribers
      topics.forEach(topic => {
        const subscribers = this.topicSubscribers.get(topic);
        if (subscribers) {
          subscribers.delete(ws);
          if (subscribers.size === 0) {
            this.topicSubscribers.delete(topic);
          }
        }
      });
    }

    // Remove from subscribers
    this.subscribers.delete(ws);
    console.log('WebSocket unsubscribed from all topics');
  }

  async broadcast(topic: string, data: NotificationData, identifier?: string): Promise<void> {
    const topicKey = identifier ? `${topic}:${identifier}` : topic;
    const subscribers = this.topicSubscribers.get(topicKey);

    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message = JSON.stringify({
      topic: topicKey,
      timestamp: new Date().toISOString(),
      ...data
    });

    subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
          this.unsubscribe(ws);
        }
      }
    });

    console.log(`Broadcasted to ${subscribers.size} subscribers on topic: ${topicKey}`);
  }

  async sendNotification(recipient: string, data: NotificationData): Promise<boolean> {
    try {
      // In production, this would integrate with email/SMS services
      console.log(`Notification to ${recipient}:`, data);
      
      // Simulate notification sending
      return true;
    } catch (error) {
      console.error('Notification sending failed:', error);
      return false;
    }
  }

  async notifyComplaintUpdate(complaintId: string, status: string, message: string): Promise<void> {
    await this.broadcast('complaint_update', {
      type: 'status_update',
      message: `Complaint status updated to: ${status}`,
      data: {
        complaintId,
        status,
        message,
        timestamp: new Date().toISOString()
      }
    }, complaintId);
  }

  async notifyEmergencyAlert(alertData: any): Promise<void> {
    await this.broadcast('emergency_alert', {
      type: 'emergency',
      message: 'New emergency alert received',
      data: alertData
    });
  }

  async notifyNewComplaint(complaint: any): Promise<void> {
    if (complaint.isPublic) {
      await this.broadcast('new_complaint', {
        type: 'new_public_complaint',
        message: 'New public complaint submitted',
        data: {
          id: complaint.id,
          category: complaint.category,
          priority: complaint.priority,
          createdAt: complaint.createdAt
        }
      });
    }
  }

  getSubscriberCount(topic: string, identifier?: string): number {
    const topicKey = identifier ? `${topic}:${identifier}` : topic;
    return this.topicSubscribers.get(topicKey)?.size || 0;
  }

  getActiveTopics(): string[] {
    return Array.from(this.topicSubscribers.keys());
  }

  async sendBulkNotification(recipients: string[], data: NotificationData): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        const sent = await this.sendNotification(recipient, data);
        if (sent) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { successful, failed };
  }
}
