import { 
  users, zkIdentities, complaints, complaintUpdates, upvotes, 
  emergencyAlerts, analytics, 
  type User, type InsertUser, type ZkIdentity, type InsertZkIdentity,
  type Complaint, type InsertComplaint, type ComplaintUpdate, type InsertComplaintUpdate,
  type Upvote, type InsertUpvote, type EmergencyAlert, type InsertEmergencyAlert,
  type Analytics, type InsertAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // ZK Identity management
  getZkIdentity(commitment: string): Promise<ZkIdentity | undefined>;
  createZkIdentity(identity: InsertZkIdentity): Promise<ZkIdentity>;
  verifyNullifierHash(nullifierHash: string): Promise<boolean>;

  // Complaint management
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  getComplaint(referenceId: string): Promise<Complaint | undefined>;
  getComplaintById(id: string): Promise<Complaint | undefined>;
  updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint>;
  getPublicComplaints(limit?: number, offset?: number, filters?: any): Promise<Complaint[]>;
  searchComplaints(query: string): Promise<Complaint[]>;

  // Complaint updates
  addComplaintUpdate(update: InsertComplaintUpdate): Promise<ComplaintUpdate>;
  getComplaintUpdates(complaintId: string): Promise<ComplaintUpdate[]>;

  // Upvoting system
  addUpvote(upvote: InsertUpvote): Promise<Upvote>;
  getUpvoteCount(complaintId: string): Promise<number>;
  hasUpvoted(complaintId: string, nullifierHash: string): Promise<boolean>;

  // Emergency alerts
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getActiveEmergencyAlerts(): Promise<EmergencyAlert[]>;
  updateEmergencyAlert(id: string, status: string): Promise<EmergencyAlert>;

  // Analytics
  recordAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalytics(eventType?: string, days?: number): Promise<Analytics[]>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // ZK Identity management
  async getZkIdentity(commitment: string): Promise<ZkIdentity | undefined> {
    const [identity] = await db.select().from(zkIdentities)
      .where(and(eq(zkIdentities.commitment, commitment), eq(zkIdentities.isActive, true)));
    return identity || undefined;
  }

  async createZkIdentity(identity: InsertZkIdentity): Promise<ZkIdentity> {
    const [zkIdentity] = await db.insert(zkIdentities).values(identity).returning();
    return zkIdentity;
  }

  async verifyNullifierHash(nullifierHash: string): Promise<boolean> {
    const [existing] = await db.select({ id: zkIdentities.id }).from(zkIdentities)
      .where(eq(zkIdentities.nullifierHash, nullifierHash));
    return !existing; // Returns true if nullifier hasn't been used
  }

  // Complaint management
  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const referenceId = `SPK-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const complaintData = {
      referenceId,
      zkCommitment: complaint.zkCommitment,
      category: complaint.category,
      encryptedContent: complaint.encryptedContent,
      encryptionKey: complaint.encryptionKey,
      tags: complaint.tags || [],
      priority: complaint.priority || 'medium',
      isPublic: complaint.isPublic || false,
      isEmergency: complaint.isEmergency || false,
      includeLocation: complaint.includeLocation || false,
      location: complaint.location,
      emergencyContact: complaint.emergencyContact,
      ipfsHash: complaint.ipfsHash
    };
    const [newComplaint] = await db.insert(complaints)
      .values(complaintData)
      .returning();
    return newComplaint;
  }

  async getComplaint(referenceId: string): Promise<Complaint | undefined> {
    const [complaint] = await db.select().from(complaints)
      .where(eq(complaints.referenceId, referenceId));
    return complaint || undefined;
  }

  async getComplaintById(id: string): Promise<Complaint | undefined> {
    const [complaint] = await db.select().from(complaints)
      .where(eq(complaints.id, id));
    return complaint || undefined;
  }

  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint> {
    const [complaint] = await db.update(complaints)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(complaints.id, id))
      .returning();
    return complaint;
  }

  async getPublicComplaints(limit = 20, offset = 0, filters: any = {}): Promise<Complaint[]> {
    let conditions = [eq(complaints.isPublic, true)];

    if (filters.category && filters.category !== 'all') {
      conditions.push(eq(complaints.category, filters.category));
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(complaints.status, filters.status));
    }

    return await db.select().from(complaints)
      .where(and(...conditions))
      .orderBy(desc(complaints.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchComplaints(query: string): Promise<Complaint[]> {
    return await db.select().from(complaints)
      .where(and(
        eq(complaints.isPublic, true),
        or(
          sql`${complaints.encryptedContent} ILIKE ${`%${query}%`}`,
          sql`${complaints.tags}::text ILIKE ${`%${query}%`}`
        )
      ))
      .orderBy(desc(complaints.createdAt));
  }

  // Complaint updates
  async addComplaintUpdate(update: InsertComplaintUpdate): Promise<ComplaintUpdate> {
    const [complaintUpdate] = await db.insert(complaintUpdates)
      .values(update)
      .returning();
    return complaintUpdate;
  }

  async getComplaintUpdates(complaintId: string): Promise<ComplaintUpdate[]> {
    return await db.select().from(complaintUpdates)
      .where(eq(complaintUpdates.complaintId, complaintId))
      .orderBy(desc(complaintUpdates.createdAt));
  }

  // Upvoting system
  async addUpvote(upvote: InsertUpvote): Promise<Upvote> {
    const [newUpvote] = await db.insert(upvotes).values(upvote).returning();
    
    // Increment complaint upvote count
    await db.update(complaints)
      .set({ upvotes: sql`${complaints.upvotes} + 1` })
      .where(eq(complaints.id, upvote.complaintId));
    
    return newUpvote;
  }

  async getUpvoteCount(complaintId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(upvotes)
      .where(eq(upvotes.complaintId, complaintId));
    return result.count;
  }

  async hasUpvoted(complaintId: string, nullifierHash: string): Promise<boolean> {
    const [existing] = await db.select({ id: upvotes.id }).from(upvotes)
      .where(and(
        eq(upvotes.complaintId, complaintId),
        eq(upvotes.nullifierHash, nullifierHash)
      ));
    return !!existing;
  }

  // Emergency alerts
  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [emergencyAlert] = await db.insert(emergencyAlerts)
      .values(alert)
      .returning();
    return emergencyAlert;
  }

  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts)
      .where(eq(emergencyAlerts.status, 'active'))
      .orderBy(desc(emergencyAlerts.createdAt));
  }

  async updateEmergencyAlert(id: string, status: string): Promise<EmergencyAlert> {
    const [alert] = await db.update(emergencyAlerts)
      .set({ status })
      .where(eq(emergencyAlerts.id, id))
      .returning();
    return alert;
  }

  // Analytics
  async recordAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [result] = await db.insert(analytics)
      .values(analyticsData)
      .returning();
    return result;
  }

  async getAnalytics(eventType?: string, days = 30): Promise<Analytics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let conditions = [sql`${analytics.createdAt} >= ${cutoffDate}`];

    if (eventType) {
      conditions.push(eq(analytics.eventType, eventType));
    }

    return await db.select().from(analytics)
      .where(and(...conditions))
      .orderBy(desc(analytics.createdAt));
  }
}

export const storage = new DatabaseStorage();
