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
      const rows = await sql`SELECT * FROM organizations WHERE user_id = ${userId} ORDER BY created_at DESC`;
      return ok(rows.map(dbToClient));
    }

    if (event.httpMethod === 'POST') {
      const b = JSON.parse(event.body || '{}');
      const [row] = await sql`
        INSERT INTO organizations (user_id, name, contact_name, phone, email, market_location, website)
        VALUES (${userId}, ${b.name}, ${b.contactName || null}, ${b.phone || null},
                ${b.email || null}, ${b.marketLocation || null}, ${b.website || null})
        RETURNING *
      `;
      return ok(dbToClient(row));
    }

    if (event.httpMethod === 'PUT') {
      if (!id) return err('Missing id', 400);
      const b = JSON.parse(event.body || '{}');
      const [row] = await sql`
        UPDATE organizations SET
          name = ${b.name}, contact_name = ${b.contactName || null}, phone = ${b.phone || null},
          email = ${b.email || null}, market_location = ${b.marketLocation || null},
          website = ${b.website || null}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;
      if (!row) return err('Not found', 404);
      return ok(dbToClient(row));
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return err('Missing id', 400);
      await sql`DELETE FROM organizations WHERE id = ${id} AND user_id = ${userId}`;
      return ok({ success: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('orgs error:', e);
    return err(e.message);
  }
};

function dbToClient(r) {
  return {
    id: r.id,
    name: r.name,
    contactName: r.contact_name || '',
    phone: r.phone || '',
    email: r.email || '',
    marketLocation: r.market_location || '',
    website: r.website || '',
  };
}
