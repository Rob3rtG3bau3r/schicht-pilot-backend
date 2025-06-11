import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { email, password, userData } = req.body;

  if (!email || !password || !userData) {
    return res.status(400).json({ error: 'Pflichtdaten fehlen.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  // 🔄 DB_User befüllen
  const { error: dbError } = await supabase.from('DB_User').insert([
    {
      user_id: authUser.user.id,
      email,
      vorname: userData.vorname,
      nachname: userData.nachname,
      rolle: userData.rolle,
      firma: userData.firma,
      unit: userData.unit,
      funktion: userData.funktion,
      erstellt_von: userData.erstellt_von || null,
      erstellt_am: new Date().toISOString(),
      aktiv: true,
    },
  ]);

  if (dbError) {
    return res.status(500).json({ error: dbError.message });
  }

  return res.status(200).json({ user: authUser.user });
}
