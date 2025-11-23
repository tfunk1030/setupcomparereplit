import {
  users,
  comparisons,
  type User,
  type UpsertUser,
  type Comparison,
  type InsertComparison,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createComparison(comparison: InsertComparison): Promise<Comparison>;
  getComparison(id: string): Promise<Comparison | undefined>;
  getUserComparisons(userId: string): Promise<Comparison[]>;
  updateComparisonPublic(id: string, isPublic: boolean, shareToken?: string): Promise<Comparison | undefined>;
  getComparisonByShareToken(shareToken: string): Promise<Comparison | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createComparison(comparisonData: InsertComparison & { telemetryData?: any }): Promise<Comparison> {
    const [comparison] = await db
      .insert(comparisons)
      .values(comparisonData)
      .returning();
    return comparison;
  }

  async getComparison(id: string): Promise<Comparison | undefined> {
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.id, id));
    return comparison;
  }

  async getUserComparisons(userId: string): Promise<Comparison[]> {
    return await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.userId, userId))
      .orderBy(desc(comparisons.createdAt));
  }

  async updateComparisonPublic(
    id: string,
    isPublic: boolean,
    shareToken?: string
  ): Promise<Comparison | undefined> {
    const token = shareToken || randomUUID();
    const [comparison] = await db
      .update(comparisons)
      .set({ isPublic, shareToken: isPublic ? token : null })
      .where(eq(comparisons.id, id))
      .returning();
    return comparison;
  }

  async getComparisonByShareToken(shareToken: string): Promise<Comparison | undefined> {
    const [comparison] = await db
      .select()
      .from(comparisons)
      .where(eq(comparisons.shareToken, shareToken));
    return comparison;
  }
}

export const storage = new DatabaseStorage();
