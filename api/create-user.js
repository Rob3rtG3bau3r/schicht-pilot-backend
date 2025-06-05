import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: true,
  },
};
 
export default async function handler(req, res) {
  // ✅ Diese Header müssen immer gesetzt werden – auch bei POST
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // ✅ Sofort auf OPTIONS antworten (Preflight-Anfrage)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Dein eigentlicher Code
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail oder Passwort fehlt.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ user: data.user });
}
