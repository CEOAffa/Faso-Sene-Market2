import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, adminCredentialsTable } from "@workspace/db";

const router: IRouter = Router();

const JWT_SECRET = process.env.SESSION_SECRET ?? "fallback-secret-change-me";
const TOKEN_EXPIRY = "8h";

/** Ensure at least one admin credential row exists on first use */
async function getAdminCredential() {
  const rows = await db.select().from(adminCredentialsTable).limit(1);
  if (rows.length > 0) return rows[0];

  // Bootstrap from env vars on very first run
  const email = process.env.ADMIN_EMAIL ?? "admin@fasosene.ml";
  const password = process.env.ADMIN_PASSWORD ?? "FasoSene@2026!";
  const hash = await bcrypt.hash(password, 12);
  const [row] = await db
    .insert(adminCredentialsTable)
    .values({ email, passwordHash: hash })
    .returning();
  return row;
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Email et mot de passe requis." });
    return;
  }

  const admin = await getAdminCredential();

  if (email !== admin.email) {
    res.status(401).json({ error: "Identifiants incorrects." });
    return;
  }

  const valid = await bcrypt.compare(String(password), admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Identifiants incorrects." });
    return;
  }

  const token = jwt.sign({ role: "admin", email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  res.json({ token });
});

router.get("/admin/verify", (req, res): void => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token manquant." });
    return;
  }

  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, payload });
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré." });
  }
});

router.post("/admin/change-password", async (req, res): Promise<void> => {
  // Require valid JWT
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non autorisé." });
    return;
  }
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
  } catch {
    res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
    return;
  }

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Tous les champs sont requis." });
    return;
  }
  if (String(newPassword).length < 8) {
    res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    return;
  }

  const admin = await getAdminCredential();
  const valid = await bcrypt.compare(String(currentPassword), admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Mot de passe actuel incorrect." });
    return;
  }

  const newHash = await bcrypt.hash(String(newPassword), 12);
  await db
    .update(adminCredentialsTable)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(adminCredentialsTable.id, admin.id));

  res.json({ success: true });
});

export default router;
