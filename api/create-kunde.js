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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { kundenData } = req.body;

  if (!kundenData || !kundenData.firmenname) {
    return res.status(400).json({ error: 'Firmenname fehlt.' });
  }

  const { error } = await supabase.from('DB_Kunde').insert([
    {
      firmenname: kundenData.firmenname,
      aktiv: kundenData.aktiv ?? true,
      erstellt_von: kundenData.erstellt_von || null,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Kunde erfolgreich angelegt.' });
}
