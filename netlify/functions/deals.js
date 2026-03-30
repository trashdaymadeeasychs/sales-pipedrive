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
    // GET — list all deals for user
    if (event.httpMethod === 'GET') {
      const rows = await sql`
        SELECT * FROM deals WHERE user_id = ${userId} ORDER BY created_at DESC
      `;
      return ok(rows.map(dbToClient));
    }

    // POST — create deal
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const [row] = await sql`
        INSERT INTO deals (user_id, title, contact, org, value, stage, probability, note_log)
        VALUES (${userId}, ${body.title}, ${body.contact || null}, ${body.org || null},
                ${body.value || 0}, ${body.stage || 'Lead In'}, ${body.probability || 20},
                ${JSON.stringify(body.noteLog || [])}::jsonb)
        RETURNING *
      `;
      return ok(dbToClient(row));
    }

    // PUT — update deal
    if (event.httpMethod === 'PUT') {
      if (!id) return err('Missing id', 400);
      const body = JSON.parse(event.body || '{}');
      const [row] = await sql`
        UPDATE deals SET
          title       = ${body.title},
          contact     = ${body.contact || null},
          org         = ${body.org || null},
          value       = ${body.value || 0},
          stage       = ${body.stage || 'Lead In'},
          probability = ${body.probability || 20},
          note_log    = ${JSON.stringify(body.noteLog || [])}::jsonb,
          updated_at  = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;
      if (!row) return err('Not found', 404);
      return ok(dbToClient(row));
    }

    // DELETE
    if (event.httpMethod === 'DELETE') {
      if (!id) return err('Missing id', 400);
      await sql`DELETE FROM deals WHERE id = ${id} AND user_id = ${userId}`;
      return ok({ success: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('deals error:', e);
    return err(e.message);
  }
};

function dbToClient(r) {
  return {
    id: r.id,
    title: r.title,
    contact: r.contact || '',
    org: r.org || '',
    value: Number(r.value) || 0,
    stage: r.stage,
    probability: r.probability,
    noteLog: r.note_log || [],
    created: r.created_at?.split('T')[0] || '',
    updatedAt: r.updated_at,
  };
}
