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
      const rows = await sql`SELECT * FROM activities WHERE user_id = ${userId} ORDER BY due ASC, created_at DESC`;
      return ok(rows.map(dbToClient));
    }

    if (event.httpMethod === 'POST') {
      const b = JSON.parse(event.body || '{}');
      const [row] = await sql`
        INSERT INTO activities (user_id, type, title, contact, deal, due, done)
        VALUES (${userId}, ${b.type || 'Call'}, ${b.title}, ${b.contact || null},
                ${b.deal || null}, ${b.due || null}, ${b.done || false})
        RETURNING *
      `;
      return ok(dbToClient(row));
    }

    if (event.httpMethod === 'PUT') {
      if (!id) return err('Missing id', 400);
      const b = JSON.parse(event.body || '{}');
      const [row] = await sql`
        UPDATE activities SET
          type = ${b.type || 'Call'}, title = ${b.title}, contact = ${b.contact || null},
          deal = ${b.deal || null}, due = ${b.due || null}, done = ${b.done || false},
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;
      if (!row) return err('Not found', 404);
      return ok(dbToClient(row));
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return err('Missing id', 400);
      await sql`DELETE FROM activities WHERE id = ${id} AND user_id = ${userId}`;
      return ok({ success: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('activities error:', e);
    return err(e.message);
  }
};

function dbToClient(r) {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    contact: r.contact || '',
    deal: r.deal || '',
    due: r.due?.toISOString?.()?.split('T')[0] || r.due || '',
    done: r.done,
  };
}
