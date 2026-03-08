import { storage } from "./storage";

export async function seedData() {
  await storage.seedAdmin();

  const sampleUsers = [
    { name: "Ahmad", phone: "0551234567", password: "1234" },
    { name: "Mohammed", phone: "0559876543", password: "1234" },
    { name: "Khalid", phone: "0553456789", password: "1234" },
    { name: "Omar", phone: "0557891234", password: "1234" },
    { name: "Youssef", phone: "0552345678", password: "1234" },
  ];

  for (const u of sampleUsers) {
    const existing = await storage.getUserByPhone(u.phone);
    if (!existing) {
      const created = await storage.createUser({
        name: u.name,
        phone: u.phone,
        password: u.password,
        role: "user",
      });

      const randomCrates = Math.floor(Math.random() * 15) + 1;
      await storage.updateUserCrates(created.id, randomCrates);

      await storage.createMovement({
        userId: created.id,
        type: "ADD",
        quantity: randomCrates,
        addedBy: "Admin",
      });

      if (Math.random() > 0.5) {
        const returnQty = Math.floor(Math.random() * Math.min(randomCrates, 5)) + 1;
        await storage.updateUserCrates(created.id, -returnQty);
        await storage.createMovement({
          userId: created.id,
          type: "RETURN",
          quantity: returnQty,
          addedBy: "Admin",
        });
      }
    }
  }
}
