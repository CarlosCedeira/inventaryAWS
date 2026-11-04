const COOKIE_NAME = "bretema_session";

function sessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  };
}

function clearSessionCookie(res) {
  const { maxAge, ...options } = sessionCookieOptions();
  res.clearCookie(COOKIE_NAME, options);
}

module.exports = { COOKIE_NAME, sessionCookieOptions, clearSessionCookie };
