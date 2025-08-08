import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const zkIdentities = pgTable("zk_identities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  commitment: text("commitment").notNull().unique(),
  nullifierHash: text("nullifier_hash").notNull(),
  groupId: text("group_id").notNull().default('speaksecure-v1'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const complaints = pgTable("complaints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceId: text("reference_id").notNull().unique(),
  zkCommitment: text("zk_commitment").notNull(),
  category: text("category").notNull(),
  encryptedContent: text("encrypted_content").notNull(),
  encryptionKey: text("encryption_key").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  priority: text("priority").notNull().default('medium'),
  status: text("status").notNull().default('pending'),
  isPublic: boolean("is_public").default(false),
  isEmergency: boolean("is_emergency").default(false),
  includeLocation: boolean("include_location").default(false),
  location: jsonb("location").$type<{lat: number, lng: number}>(),
  emergencyContact: text("emergency_contact"),
  ipfsHash: text("ipfs_hash"),
  blockchainHash: text("blockchain_hash"),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const complaintUpdates = pgTable("complaint_updates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  complaintId: uuid("complaint_id").notNull().references(() => complaints.id),
  status: text("status").notNull(),
  message: text("message").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const upvotes = pgTable("upvotes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  complaintId: uuid("complaint_id").notNull().references(() => complaints.id),
  nullifierHash: text("nullifier_hash").notNull().unique(),
  zkProof: text("zk_proof").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  zkCommitment: text("zk_commitment").notNull(),
  encryptedContent: text("encrypted_content").notNull(),
  emergencyContact: text("emergency_contact").notNull(),
  includeLocation: boolean("include_location").default(false),
  location: jsonb("location").$type<{lat: number, lng: number}>(),
  status: text("status").notNull().default('active'),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(),
  category: text("category"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertZkIdentitySchema = createInsertSchema(zkIdentities).pick({
  commitment: true,
  nullifierHash: true,
  groupId: true,
});

export const insertComplaintSchema = createInsertSchema(complaints).pick({
  zkCommitment: true,
  category: true,
  encryptedContent: true,
  encryptionKey: true,
  tags: true,
  priority: true,
  isPublic: true,
  isEmergency: true,
  includeLocation: true,
  location: true,
  emergencyContact: true,
  ipfsHash: true,
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).pick({
  zkCommitment: true,
  encryptedContent: true,
  emergencyContact: true,
  includeLocation: true,
  location: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertZkIdentity = z.infer<typeof insertZkIdentitySchema>;
export type ZkIdentity = typeof zkIdentities.$inferSelect;

export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;

export type InsertComplaintUpdate = typeof complaintUpdates.$inferInsert;
export type ComplaintUpdate = typeof complaintUpdates.$inferSelect;

export type InsertUpvote = typeof upvotes.$inferInsert;
export type Upvote = typeof upvotes.$inferSelect;

export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;

export type InsertAnalytics = typeof analytics.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
