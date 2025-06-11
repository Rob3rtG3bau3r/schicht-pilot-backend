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

  // ✅ Eingabedaten prüfen
  const { email, password, kundenData } = req.body;

  if (!email || !password || !kundenData || !kundenData.firmenname) {
    return res.status(400).json({ error: 'Pflichtdaten fehlen.' });
  }

  // ✅ User im Auth-System anlegen
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return res.status(500).json({ error: 'Fehler beim Anlegen des Users: ' + authError.message });
  }

  const userId = authUser.user.id;

  // ✅ Firma speichern inkl. Referenz zum User
  const { error: kundeError } = await supabase.from('DB_Kunde').insert([
    {
      firmenname: kundenData.firmenname,
      aktiv: true,
      verantwortlich: userId,
      erstellt_von: userId,
      created_at: new Date().toISOString(),
    },
  ]);

  if (kundeError) {
    return res.status(500).json({ error: 'Fehler beim Speichern des Kunden: ' + kundeError.message });
  }

  // ✅ User in DB_User eintragen
  const { error: userError } = await supabase.from('DB_User').insert([
    {
      user_id: userId,
      email,
      vorname: kundenData.vorname || '',
      nachname: kundenData.nachname || '',
      rolle: kundenData.rolle || 'Admin_Dev',
      firma: kundenData.firmenname,
      funktion: kundenData.funktion || 'Kostenverantwortlich',
      erstellt_von: userId,
      erstellt_am: new Date().toISOString(),
      aktiv: true,
    },
  ]);

  if (userError) {
    return res.status(500).json({ error: 'User angelegt, aber Eintrag in DB_User fehlgeschlagen: ' + userError.message });
  }

  return res.status(200).json({ message: 'Kunde und Verantwortlicher erfolgreich gespeichert.', user_id: userId });
}
