import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // ✅ CORS-Header setzen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // ✅ Preflight beantworten
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Supabase verbinden
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ✅ Payload prüfen
  const { kundenData } = req.body;

  if (!kundenData || !kundenData.firmenname) {
    return res.status(400).json({ error: 'Firmenname fehlt.' });
  }

  // ✅ Eintrag in DB_Kunde speichern
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
