// /pages/api/create-kunde-en.js (NEU! angepasst für DB_Kunden)
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { kundenData } = req.body;
  console.log('🛎 Anfrage erhalten:', req.body);

  if (!kundenData?.firmenname || !kundenData?.verantwortlich) {
    return res.status(400).json({ error: 'Pflichtdaten fehlen (Firmenname, Verantwortlich).' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const insertData = {
      firmenname: kundenData.firmenname,
      verantwortlich: kundenData.verantwortlich,
      created_by: kundenData.created_by || null,
      aktiv: true,
    };

    const { error: kundeError } = await supabase.from('DB_Kunden').insert([insertData]);

    if (kundeError) {
      console.error('❌ DB_Kunden Insert Error:', kundeError);
      return res.status(500).json({ error: 'Insert in DB_Kunden fehlgeschlagen: ' + kundeError.message });
    }

    return res.status(200).json({ message: '✅ Kunde erfolgreich gespeichert.' });

  } catch (err) {
    console.error('💥 Schwerer Fehler:', err);
    return res.status(500).json({ error: 'Unerwarteter Fehler: ' + err.message });
  }
}
