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

  // 1. Auth User anlegen
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  // 2. In DB_User speichern
  const { error: dbError } = await supabase.from('DB_User').insert([
    {
      user_id: authUser.user.id,
      email,
      vorname: userData.vorname,
      nachname: userData.nachname,
      rolle: userData.rolle,
      firma_id: userData.firma,
      unit_id: userData.unit,
      funktion: userData.funktion,
      erstellt_von: userData.erstellt_von || null,
      erstellt_am: new Date().toISOString(),
      aktiv: true,
    },
  ]);

  if (dbError) {
    return res.status(500).json({ error: dbError.message });
  }

  // 3. Optional: Kunde zusätzlich in DB_Kunden eintragen
  if (
    userData.rolle === 'Admin_Dev' &&
    userData.funktion === 'Kostenverantwortlich'
  ) {
    // prüfen, ob Firma bereits existiert
    const { data: bestehenderKunde, error: checkError } = await supabase
      .from('DB_Kunden')
      .select('id')
      .eq('firmenname', userData.firma);

    if (checkError) {
      return res.status(500).json({ error: checkError.message });
    }

    if (!bestehenderKunde || bestehenderKunde.length === 0) {
      const { error: kundenError } = await supabase.from('DB_Kunden').insert([
        {
          firmenname: userData.firma,
          verantwortlich: `${userData.vorname} ${userData.nachname}`,
          verantwortlich_uuid: authUser.user.id,
          created_by: userData.erstellt_von || null,
          created_at: new Date().toISOString(),
          aktiv: true,
        },
      ]);

      if (kundenError) {
        return res.status(500).json({ error: kundenError.message });
      }
    }
  }


  // 4. Erfolg zurückgeben
  return res.status(200).json({ user: authUser.user });
}
