import { login, logout, me } from "./auth.controller";

const express = require("express") as { Router: () => { post: (...args: unknown[]) => void; get: (...args: unknown[]) => void } };
const { requireAuth } = require("./auth.middleware") as { requireAuth: unknown };
const router = express.Router();

router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", logout);

export = router;
