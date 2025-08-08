import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const zkIdentities = pgTable("zk_identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commitment: text("commitment").notNull().unique(),
  nullifierHash: text("nullifier_hash").notNull().unique(),
  groupId: text("group_id").notNull().default("speaksecure-v1"),
  isValid: boolean("is_valid").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  commitmentIdx: index("commitment_idx").on(table.commitment),
  nullifierIdx: index("nullifier_idx").on(table.nullifierHash),
}));

export const complaints = pgTable("complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceId: varchar("reference_id").notNull().unique(),
  category: text("category").notNull(),
  encryptedContent: text("encrypted_content").notNull(),
  ipfsHash: text("ipfs_hash"),
  blockchainHash: text("blockchain_hash"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  isPublic: boolean("is_public").notNull().default(false),
  isEmergency: boolean("is_emergency").notNull().default(false),
  tags: text("tags").array(),
  location: jsonb("location"),
  upvotes: integer("upvotes").notNull().default(0),
  zkCommitment: text("zk_commitment").notNull(),
  nullifierHash: text("nullifier_hash").notNull(),
  emergencyContact: text("emergency_contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  referenceIdx: index("reference_idx").on(table.referenceId),
  statusIdx: index("status_idx").on(table.status),
  categoryIdx: index("category_idx").on(table.category),
  publicIdx: index("public_idx").on(table.isPublic),
  emergencyIdx: index("emergency_idx").on(table.isEmergency),
  commitmentIdx: index("complaint_commitment_idx").on(table.zkCommitment),
}));

export const upvotes = pgTable("upvotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  complaintId: varchar("complaint_id").notNull().references(() => complaints.id),
  nullifierHash: text("nullifier_hash").notNull().unique(),
  zkProof: text("zk_proof").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  complaintIdx: index("upvote_complaint_idx").on(table.complaintId),
  nullifierIdx: index("upvote_nullifier_idx").on(table.nullifierHash),
}));

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  encryptedContent: text("encrypted_content").notNull(),
  emergencyContact: text("emergency_contact").notNull(),
  location: jsonb("location"),
  status: text("status").notNull().default("sent"),
  zkCommitment: text("zk_commitment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("alert_status_idx").on(table.status),
  contactIdx: index("alert_contact_idx").on(table.emergencyContact),
}));

export const nullifierTracker = pgTable("nullifier_tracker", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nullifierHash: text("nullifier_hash").notNull().unique(),
  action: text("action").notNull(),
  topic: text("topic").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  nullifierIdx: index("tracker_nullifier_idx").on(table.nullifierHash),
  actionIdx: index("tracker_action_idx").on(table.action),
}));

// Relations
export const complaintsRelations = relations(complaints, ({ many }) => ({
  upvotes: many(upvotes),
}));

export const upvotesRelations = relations(upvotes, ({ one }) => ({
  complaint: one(complaints, {
    fields: [upvotes.complaintId],
    references: [complaints.id],
  }),
}));

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
  category: true,
  encryptedContent: true,
  priority: true,
  isPublic: true,
  isEmergency: true,
  tags: true,
  location: true,
  zkCommitment: true,
  nullifierHash: true,
  emergencyContact: true,
}).extend({
  tags: z.array(z.string()).optional(),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

export const insertUpvoteSchema = createInsertSchema(upvotes).pick({
  complaintId: true,
  nullifierHash: true,
  zkProof: true,
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).pick({
  encryptedContent: true,
  emergencyContact: true,
  location: true,
  zkCommitment: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertZkIdentity = z.infer<typeof insertZkIdentitySchema>;
export type ZkIdentity = typeof zkIdentities.$inferSelect;

export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;

export type InsertUpvote = z.infer<typeof insertUpvoteSchema>;
export type Upvote = typeof upvotes.$inferSelect;

export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;

export type NullifierTracker = typeof nullifierTracker.$inferSelect;
