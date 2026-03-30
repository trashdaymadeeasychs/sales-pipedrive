const jwt = require('jsonwebtoken');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function verifyToken(event) {
  const JWT_SECRET = process.env.JWT_SECRET || 'crm-secret-change-me';
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function unauthorized() {
  return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Unauthorized' }) };
}

function ok(data) {
  return { statusCode: 200, headers: cors, body: JSON.stringify(data) };
}

function err(msg, code = 500) {
  return { statusCode: code, headers: cors, body: JSON.stringify({ error: msg }) };
}

module.exports = { cors, verifyToken, unauthorized, ok, err };
