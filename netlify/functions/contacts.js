const { neon } = require('@neondatabase/serverless');
const { cors, verifyToken, unauthorized, ok, err } = require('./_helpers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  const user = verifyToken(event);
  if (!user) return unauthorized();

  const sql = neon(process.env.DATABASE_URL);
  const userId = user.sub;
  const id = event.queryStringParameters?.id;

  try {
    if (event.httpMethod === 'GET') {
      const rows = await sql`SELECT * FROM contacts WHERE user_id = ${userId} ORDER BY created_at DESC`;
      return ok(rows.map(dbToClient));
    }

    if (event.httpMethod === 'POST') {
      const b = JSON.parse(event.body || '{}');
      const [row] = await sql`
        INSERT INTO contacts (user_id, name, email, phone, org, role)
        VALUES (${userId}, ${b.name}, ${b.email || null}, ${b.phone || null}, ${b.org || null}, ${b.role || null})
        RETURNING *
      `;
      return ok(dbToClient(row));
    }

    if (event.httpMethod === 'PUT') {
      if (!id) return err('Missing id', 400);
      const b = JSON.parse(event.body || '{}');
      const [row] = await sql`
        UPDATE contacts SET
          name = ${b.name}, email = ${b.email || null}, phone = ${b.phone || null},
          org = ${b.org || null}, role = ${b.role || null}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;
      if (!row) return err('Not found', 404);
      return ok(dbToClient(row));
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return err('Missing id', 400);
      await sql`DELETE FROM contacts WHERE id = ${id} AND user_id = ${userId}`;
      return ok({ success: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('contacts error:', e);
    return err(e.message);
  }
};

function dbToClient(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email || '',
    phone: r.phone || '',
    org: r.org || '',
    role: r.role || '',
    created: r.created_at?.split('T')[0] || '',
  };
}
