import { users, shareholderApplications, type User, type InsertUser, type ShareholderApplication, type InsertShareholderApplication } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createShareholderApplication(application: InsertShareholderApplication): Promise<ShareholderApplication>;
  getShareholderApplication(id: number): Promise<ShareholderApplication | undefined>;
  getAllShareholderApplications(): Promise<ShareholderApplication[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
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

  async createShareholderApplication(insertApplication: InsertShareholderApplication): Promise<ShareholderApplication> {
    const [application] = await db
      .insert(shareholderApplications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async getShareholderApplication(id: number): Promise<ShareholderApplication | undefined> {
    const [application] = await db.select().from(shareholderApplications).where(eq(shareholderApplications.id, id));
    return application || undefined;
  }

  async getAllShareholderApplications(): Promise<ShareholderApplication[]> {
    return await db.select().from(shareholderApplications);
  }
}

export const storage = new DatabaseStorage();
