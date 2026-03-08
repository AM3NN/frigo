import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { loginSchema, createUserSchema, crateActionSchema } from "@shared/schema";
import session from "express-session";
import bcrypt from "bcrypt";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
    name: string;
  }
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (req.session.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  const { seedData } = await import("./seed");
  await seedData();

  app.post("/api/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const user = await storage.getUserByPhone(parsed.data.phone);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(parsed.data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.name = user.name;

      res.json({
        id: user.id,
        name: user.name,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/me", (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({
      id: req.session.userId,
      name: req.session.name,
      role: req.session.role,
    });
  });

  app.get("/api/my-profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/my-history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getMovementsByUser(req.session.userId!);
      res.json(history);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/my-export", requireAuth, async (req, res) => {
    try {
      const history = await storage.getMovementsByUser(req.session.userId!);
      const user = await storage.getUser(req.session.userId!);

      let csv = "Type,Quantity,Added By,Date,Time\n";
      history.forEach((m) => {
        const d = new Date(m.date);
        csv += `${m.type},${m.quantity},${m.addedBy},${d.toLocaleDateString()},${d.toLocaleTimeString()}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${user?.name || "history"}.csv`);
      res.send(csv);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getRegularUsers();
      const safeUsers = users.map(({ password, ...u }) => u);
      res.json(safeUsers);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const exists = await storage.getUserByPhone(parsed.data.phone);
      if (exists) {
        return res.status(400).json({ message: "A user with this phone already exists" });
      }

      const user = await storage.createUser({
        name: parsed.data.name,
        phone: parsed.data.phone,
        password: parsed.data.password,
        role: "user",
      });

      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted" });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/crates/add", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = crateActionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const updated = await storage.updateUserCrates(parsed.data.userId, parsed.data.quantity);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createMovement({
        userId: parsed.data.userId,
        type: "ADD",
        quantity: parsed.data.quantity,
        addedBy: req.session.name || "Admin",
      });

      res.json({ newTotal: updated.currentCrates });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/crates/return", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = crateActionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const updated = await storage.updateUserCrates(parsed.data.userId, -parsed.data.quantity);
      if (!updated) {
        return res.status(400).json({ message: "User not found or insufficient crates" });
      }

      await storage.createMovement({
        userId: parsed.data.userId,
        type: "RETURN",
        quantity: parsed.data.quantity,
        addedBy: req.session.name || "Admin",
      });

      res.json({ newTotal: updated.currentCrates });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/history/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const history = await storage.getMovementsByUser(req.params.userId);
      res.json(history);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/history", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const history = await storage.getAllMovements();
      res.json(history);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/export/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const history = await storage.getMovementsByUser(req.params.userId);
      const user = await storage.getUser(req.params.userId);

      let csv = "Type,Quantity,Added By,Date,Time\n";
      history.forEach((m) => {
        const d = new Date(m.date);
        csv += `${m.type},${m.quantity},${m.addedBy},${d.toLocaleDateString()},${d.toLocaleTimeString()}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${user?.name || "history"}.csv`);
      res.send(csv);
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}
