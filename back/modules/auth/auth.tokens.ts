import type { SessionUser } from "./auth.model";

export type SessionTokenPayload = Pick<SessionUser, "id" | "tenant_id" | "session_version">;

const jwt = require("jsonwebtoken") as {
  sign: (payload: SessionUser, secret: string, options: { expiresIn: string }) => string;
  verify: (token: string, secret: string) => SessionTokenPayload;
};

function getSecret(): string {
  return process.env.AUTH_SECRET as string;
}

function createToken(payload: SessionUser): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "8h" });
}

function verifyToken(token: string): SessionTokenPayload | null {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

export { createToken, verifyToken };
