const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  const sql = neon(process.env.DATABASE_URL);
  const JWT_SECRET = process.env.JWT_SECRET || 'crm-secret-change-me';

  try {
    const { action, email, password, name } = JSON.parse(event.body || '{}');

    // ── REGISTER ──────────────────────────────────────────────
    if (action === 'register') {
      if (!name || !email || !password)
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Name, email and password required' }) };

      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0)
        return { statusCode: 409, headers: cors, body: JSON.stringify({ error: 'Email already registered' }) };

      const hash = await bcrypt.hash(password, 10);
      const [user] = await sql`
        INSERT INTO users (name, email, password_hash, role)
        VALUES (${name}, ${email}, ${hash}, 'user')
        RETURNING id, name, email, role
      `;

      const token = jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
      return { statusCode: 200, headers: cors, body: JSON.stringify({ token, user }) };
    }

    // ── LOGIN ─────────────────────────────────────────────────
    if (action === 'login') {
      if (!email || !password)
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Email and password required' }) };

      const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (!user)
        return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Invalid email or password' }) };

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid)
        return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Invalid email or password' }) };

      const token = jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
      return {
        statusCode: 200, headers: cors,
        body: JSON.stringify({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
      };
    }

    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Unknown action' }) };

  } catch (err) {
    console.error('Auth error:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
