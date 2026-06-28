const crypto = require('crypto');
const { enforce, clientIp } = require('../lib/rateLimit');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforce(req, res, 'admin-confirm:' + clientIp(req), 5)) return;

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || !safeEqual(adminKey, process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_confirmed_at) {
      return res.status(200).json({ message: 'Already confirmed', email });
    }

    const updateRes = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_confirm: true }),
      }
    );
    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.msg || 'Update failed');
    }

    return res.status(200).json({ message: 'User confirmed successfully', email });
  } catch (err) {
    console.error('Confirm user error:', err.message);
    return res.status(500).json({ error: 'Failed to confirm user' });
  }
};

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 100;
  while (true) {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_ANON_KEY,
        },
      }
    );
    if (!res.ok) throw new Error('Failed to list users');
    const data = await res.json();
    const users = data.users || [];
    const match = users.find(u => u.email === email);
    if (match) return match;
    if (users.length < perPage) return null;
    page++;
  }
}
