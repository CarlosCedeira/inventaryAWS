const COOKIE_NAME = "bretema_session";

interface CookieResponse {
  clearCookie(name: string, options: SessionCookieOptions): unknown;
}

export interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
  path: string;
}

function sessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  };
}

function clearSessionCookie(res: CookieResponse): void {
  const { maxAge, ...options } = sessionCookieOptions();
  void maxAge;
  res.clearCookie(COOKIE_NAME, options as SessionCookieOptions);
}

export { COOKIE_NAME, clearSessionCookie, sessionCookieOptions };
