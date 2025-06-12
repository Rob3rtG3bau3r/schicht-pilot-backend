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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { email, password, kundenData } = req.body;

  if (!email || !password || !kundenData || !kundenData.firmenname) {
    return res.status(400).json({ error: 'Pflichtdaten fehlen.' });
  }

  // Schritt 1: Auth-User erstellen
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return res.status(500).json({ error: 'Fehler beim Anlegen des Users: ' + authError.message });
  }

  const userId = authUser.user.id;

  // Schritt 2: Kunde speichern
const { error: kundeError } = await supabase.from('DB_Kunde').insert([
  {
    firmenname: kundenData.firmenname,
    aktiv: kundenData.aktiv ?? true,
    verantwortlich: kundenData.verantwortlich,
    erstellt_von: kundenData.erstellt_von || null,
    created_at: new Date().toISOString(),
  },
]);

  if (kundeError) {
    return res.status(500).json({ error: 'Fehler beim Speichern des Kunden: ' + kundeError.message });
  }

  // Schritt 3: User in DB_User eintragen
  const { error: userError } = await supabase.from('DB_User').insert([
    {
      user_id: userId,
      email,
      vorname: kundenData.vorname || '',
      nachname: kundenData.nachname || '',
      rolle: kundenData.rolle || 'Admin_Dev',
      firma: kundenData.firmenname,
      funktion: kundenData.funktion || 'Kostenverantwortlich',
      erstellt_von: kundenData.erstellt_von || null,
      erstellt_am: new Date().toISOString(),
      aktiv: true,
    },
  ]);

  if (userError) {
    return res.status(500).json({ error: 'User angelegt, aber Eintrag in DB_User fehlgeschlagen: ' + userError.message });
  }

  return res.status(200).json({ message: 'Kunde + Verantwortlicher erfolgreich gespeichert.', user_id: userId });
}
