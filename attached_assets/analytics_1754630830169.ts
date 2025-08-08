import { storage } from '../storage';

export interface AnalyticsData {
  eventType: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsSummary {
  totalComplaints: number;
  totalUpvotes: number;
  totalEmergencyAlerts: number;
  categoriesBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  timeSeriesData: Array<{ date: string; count: number }>;
}

export class AnalyticsService {
  async recordEvent(eventType: string, data: Record<string, any> = {}): Promise<void> {
    try {
      await storage.recordAnalytics({
        eventType,
        category: data.category,
        metadata: data
      });
      
      console.log(`Analytics recorded: ${eventType}`, data);
    } catch (error) {
      console.error('Analytics recording failed:', error);
    }
  }

  async getSummary(days = 30): Promise<AnalyticsSummary> {
    try {
      const analytics = await storage.getAnalytics(undefined, days);
      
      // Calculate summary statistics
      const summary: AnalyticsSummary = {
        totalComplaints: 0,
        totalUpvotes: 0,
        totalEmergencyAlerts: 0,
        categoriesBreakdown: {},
        statusBreakdown: {},
        timeSeriesData: []
      };

      // Process analytics data
      analytics.forEach(record => {
        switch (record.eventType) {
          case 'complaint_submitted':
            summary.totalComplaints++;
            if (record.metadata?.category) {
              summary.categoriesBreakdown[record.metadata.category] = 
                (summary.categoriesBreakdown[record.metadata.category] || 0) + 1;
            }
            break;
          
          case 'complaint_upvoted':
            summary.totalUpvotes++;
            break;
          
          case 'emergency_alert_sent':
            summary.totalEmergencyAlerts++;
            break;
        }
      });

      // Generate time series data
      summary.timeSeriesData = await this.generateTimeSeriesData(days);

      return summary;
    } catch (error) {
      console.error('Analytics summary failed:', error);
      throw new Error('Failed to generate analytics summary');
    }
  }

  async getEventCounts(eventType: string, days = 30): Promise<number> {
    try {
      const analytics = await storage.getAnalytics(eventType, days);
      return analytics.length;
    } catch (error) {
      console.error('Event count retrieval failed:', error);
      return 0;
    }
  }

  async getCategoryBreakdown(days = 30): Promise<Record<string, number>> {
    try {
      const analytics = await storage.getAnalytics('complaint_submitted', days);
      const breakdown: Record<string, number> = {};
      
      analytics.forEach(record => {
        if (record.metadata?.category) {
          breakdown[record.metadata.category] = 
            (breakdown[record.metadata.category] || 0) + 1;
        }
      });
      
      return breakdown;
    } catch (error) {
      console.error('Category breakdown failed:', error);
      return {};
    }
  }

  async getHourlyStats(days = 7): Promise<Array<{ hour: number; count: number }>> {
    try {
      const analytics = await storage.getAnalytics(undefined, days);
      const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
      
      analytics.forEach(record => {
        const hour = new Date(record.createdAt!).getHours();
        hourlyStats[hour].count++;
      });
      
      return hourlyStats;
    } catch (error) {
      console.error('Hourly stats failed:', error);
      return [];
    }
  }

  async getPopularTags(limit = 10): Promise<Array<{ tag: string; count: number }>> {
    try {
      // This would need to be implemented with proper tag extraction from complaints
      // For now, return mock data
      return [
        { tag: 'harassment', count: 45 },
        { tag: 'discrimination', count: 32 },
        { tag: 'workplace', count: 28 },
        { tag: 'abuse', count: 23 },
        { tag: 'corruption', count: 19 }
      ].slice(0, limit);
    } catch (error) {
      console.error('Popular tags retrieval failed:', error);
      return [];
    }
  }

  private async generateTimeSeriesData(days: number): Promise<Array<{ date: string; count: number }>> {
    const timeSeriesData = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Get events for this date
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      // In a real implementation, this would filter by date
      const count = Math.floor(Math.random() * 10); // Mock data
      
      timeSeriesData.push({
        date: dateString,
        count
      });
    }
    
    return timeSeriesData;
  }

  async generateReport(days = 30): Promise<any> {
    try {
      const summary = await this.getSummary(days);
      const categoryBreakdown = await this.getCategoryBreakdown(days);
      const hourlyStats = await this.getHourlyStats(days);
      const popularTags = await this.getPopularTags();
      
      return {
        period: `${days} days`,
        generatedAt: new Date().toISOString(),
        summary,
        categoryBreakdown,
        hourlyStats,
        popularTags
      };
    } catch (error) {
      console.error('Report generation failed:', error);
      throw new Error('Failed to generate analytics report');
    }
  }
}
