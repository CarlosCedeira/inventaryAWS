const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.AUTH_SECRET;
}

function createToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: "8h",
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

module.exports = {
  createToken,
  verifyToken,
};
