import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { users, movements, type User, type InsertUser, type Movement, type InsertMovement } from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRegularUsers(): Promise<User[]>;
  updateUserCrates(id: string, amount: number): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  createMovement(movement: InsertMovement): Promise<Movement>;
  getMovementsByUser(userId: string): Promise<Movement[]>;
  getAllMovements(): Promise<Movement[]>;
  seedAdmin(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [created] = await db.insert(users).values({ ...user, password: hashedPassword }).returning();
    return created;
  }

  async getRegularUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "user"));
  }

  async updateUserCrates(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newTotal = user.currentCrates + amount;
    if (newTotal < 0) return undefined;
    const [updated] = await db.update(users).set({ currentCrates: newTotal }).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    await db.delete(movements).where(eq(movements.userId, id));
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!deleted;
  }

  async createMovement(movement: InsertMovement): Promise<Movement> {
    const [created] = await db.insert(movements).values(movement).returning();
    return created;
  }

  async getMovementsByUser(userId: string): Promise<Movement[]> {
    return db.select().from(movements).where(eq(movements.userId, userId)).orderBy(desc(movements.date));
  }

  async getAllMovements(): Promise<Movement[]> {
    return db.select().from(movements).orderBy(desc(movements.date));
  }

  async seedAdmin(): Promise<void> {
    const existing = await this.getUserByPhone("00000000");
    if (!existing) {
      const hashedPassword = await bcrypt.hash("1234", 10);
      await db.insert(users).values({
        name: "Admin",
        phone: "00000000",
        password: hashedPassword,
        role: "admin",
        currentCrates: 0,
      });
    }
  }
}

export const storage = new DatabaseStorage();
