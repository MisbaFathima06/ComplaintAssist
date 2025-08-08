import { 
  users, 
  zkIdentities, 
  complaints, 
  upvotes, 
  emergencyAlerts, 
  nullifierTracker,
  type User, 
  type InsertUser,
  type ZkIdentity,
  type InsertZkIdentity,
  type Complaint,
  type InsertComplaint,
  type Upvote,
  type InsertUpvote,
  type EmergencyAlert,
  type InsertEmergencyAlert,
  type NullifierTracker
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // ZK Identity methods
  createZkIdentity(identity: InsertZkIdentity): Promise<ZkIdentity>;
  getZkIdentityByCommitment(commitment: string): Promise<ZkIdentity | undefined>;
  getZkIdentityByNullifier(nullifierHash: string): Promise<ZkIdentity | undefined>;

  // Complaint methods
  createComplaint(complaint: InsertComplaint & { referenceId: string }): Promise<Complaint>;
  getComplaintByReferenceId(referenceId: string): Promise<Complaint | undefined>;
  getComplaintById(id: string): Promise<Complaint | undefined>;
  getPublicComplaints(limit?: number, offset?: number): Promise<Complaint[]>;
  updateComplaintStatus(id: string, status: string): Promise<void>;
  updateComplaintIPFS(id: string, ipfsHash: string): Promise<void>;
  updateComplaintBlockchain(id: string, blockchainHash: string): Promise<void>;
  incrementComplaintUpvotes(id: string): Promise<void>;

  // Upvote methods
  createUpvote(upvote: InsertUpvote): Promise<Upvote>;
  getUpvoteByNullifier(nullifierHash: string): Promise<Upvote | undefined>;

  // Emergency alert methods
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getEmergencyAlerts(limit?: number): Promise<EmergencyAlert[]>;

  // Nullifier tracking
  addNullifier(nullifierHash: string, action: string, topic: string): Promise<void>;
  checkNullifierUsed(nullifierHash: string, action: string, topic: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // ZK Identity methods
  async createZkIdentity(identity: InsertZkIdentity): Promise<ZkIdentity> {
    const [zkIdentity] = await db
      .insert(zkIdentities)
      .values(identity)
      .returning();
    return zkIdentity;
  }

  async getZkIdentityByCommitment(commitment: string): Promise<ZkIdentity | undefined> {
    const [identity] = await db
      .select()
      .from(zkIdentities)
      .where(eq(zkIdentities.commitment, commitment));
    return identity || undefined;
  }

  async getZkIdentityByNullifier(nullifierHash: string): Promise<ZkIdentity | undefined> {
    const [identity] = await db
      .select()
      .from(zkIdentities)
      .where(eq(zkIdentities.nullifierHash, nullifierHash));
    return identity || undefined;
  }

  // Complaint methods
  async createComplaint(complaint: InsertComplaint & { referenceId: string }): Promise<Complaint> {
    const [newComplaint] = await db
      .insert(complaints)
      .values(complaint)
      .returning();
    return newComplaint;
  }

  async getComplaintByReferenceId(referenceId: string): Promise<Complaint | undefined> {
    const [complaint] = await db
      .select()
      .from(complaints)
      .where(eq(complaints.referenceId, referenceId));
    return complaint || undefined;
  }

  async getComplaintById(id: string): Promise<Complaint | undefined> {
    const [complaint] = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, id));
    return complaint || undefined;
  }

  async getPublicComplaints(limit = 20, offset = 0): Promise<Complaint[]> {
    return await db
      .select()
      .from(complaints)
      .where(eq(complaints.isPublic, true))
      .orderBy(desc(complaints.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateComplaintStatus(id: string, status: string): Promise<void> {
    await db
      .update(complaints)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(complaints.id, id));
  }

  async updateComplaintIPFS(id: string, ipfsHash: string): Promise<void> {
    await db
      .update(complaints)
      .set({ 
        ipfsHash, 
        updatedAt: new Date() 
      })
      .where(eq(complaints.id, id));
  }

  async updateComplaintBlockchain(id: string, blockchainHash: string): Promise<void> {
    await db
      .update(complaints)
      .set({ 
        blockchainHash, 
        updatedAt: new Date() 
      })
      .where(eq(complaints.id, id));
  }

  async incrementComplaintUpvotes(id: string): Promise<void> {
    await db
      .update(complaints)
      .set({ 
        upvotes: sql`${complaints.upvotes} + 1`,
        updatedAt: new Date()
      })
      .where(eq(complaints.id, id));
  }

  // Upvote methods
  async createUpvote(upvote: InsertUpvote): Promise<Upvote> {
    const [newUpvote] = await db
      .insert(upvotes)
      .values(upvote)
      .returning();
    return newUpvote;
  }

  async getUpvoteByNullifier(nullifierHash: string): Promise<Upvote | undefined> {
    const [upvote] = await db
      .select()
      .from(upvotes)
      .where(eq(upvotes.nullifierHash, nullifierHash));
    return upvote || undefined;
  }

  // Emergency alert methods
  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [newAlert] = await db
      .insert(emergencyAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getEmergencyAlerts(limit = 50): Promise<EmergencyAlert[]> {
    return await db
      .select()
      .from(emergencyAlerts)
      .orderBy(desc(emergencyAlerts.createdAt))
      .limit(limit);
  }

  // Nullifier tracking
  async addNullifier(nullifierHash: string, action: string, topic: string): Promise<void> {
    await db
      .insert(nullifierTracker)
      .values({
        nullifierHash,
        action,
        topic
      });
  }

  async checkNullifierUsed(nullifierHash: string, action: string, topic: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(nullifierTracker)
      .where(
        and(
          eq(nullifierTracker.nullifierHash, nullifierHash),
          eq(nullifierTracker.action, action),
          eq(nullifierTracker.topic, topic)
        )
      );
    return !!existing;
  }
}

export const storage = new DatabaseStorage();
