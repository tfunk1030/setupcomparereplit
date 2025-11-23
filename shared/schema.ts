import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Comparison table
export const comparisons = pgTable("comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  setupAName: text("setup_a_name").notNull(),
  setupBName: text("setup_b_name").notNull(),
  setupAData: jsonb("setup_a_data").notNull(),
  setupBData: jsonb("setup_b_data").notNull(),
  deltaData: jsonb("delta_data").notNull(),
  interpretations: jsonb("interpretations").notNull(),
  carName: text("car_name"),
  trackName: text("track_name"),
  isPublic: boolean("is_public").default(false),
  shareToken: varchar("share_token").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comparisonsRelations = relations(comparisons, ({ one }) => ({
  user: one(users, {
    fields: [comparisons.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  comparisons: many(comparisons),
}));

export const insertComparisonSchema = createInsertSchema(comparisons).omit({
  id: true,
  createdAt: true,
});

export type InsertComparison = z.infer<typeof insertComparisonSchema>;
export type Comparison = typeof comparisons.$inferSelect;

// Setup parameter types
export interface SetupParameter {
  value: string | number;
  unit?: string;
}

export interface SetupGroup {
  [key: string]: SetupParameter | SetupGroup;
}

export interface ParsedSetup {
  suspension?: SetupGroup;
  aero?: SetupGroup;
  tires?: SetupGroup;
  dampers?: SetupGroup;
  arb?: SetupGroup;
  brakes?: SetupGroup;
  differential?: SetupGroup;
  [key: string]: SetupGroup | undefined;
}

export interface ParameterDelta {
  oldValue: string | number;
  newValue: string | number;
  delta: string | number;
  percentChange?: number;
  unit?: string;
  magnitude: 'none' | 'minor' | 'moderate' | 'major';
}

export interface Interpretation {
  parameter: string;
  category: string;
  icon: string;
  summary: string;
  explanation: string;
  impact: 'positive' | 'negative' | 'neutral';
}
