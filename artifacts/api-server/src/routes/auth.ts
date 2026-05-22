import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const JWT_SECRET = process.env.SESSION_SECRET ?? "fallback-secret-change-me";
const TOKEN_EXPIRY = "8h";

router.post("/admin/login", (req, res): void => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Email et mot de passe requis." });
    return;
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
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

export default router;
