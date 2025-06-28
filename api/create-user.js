import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🧠 Authentifizierten User aus dem Cookie holen
  const supabaseServer = createMiddlewareSupabaseClient({ req, res });
  const { data: { user } } = await supabaseServer.auth.getUser();
  const erstellt_von = user?.id || null;

  // 📥 Request-Daten
  const { email, password, userData } = req.body;

  if (!email || !password || !userData) {
    return res.status(400).json({ error: 'Pflichtdaten fehlen.' });
  }

  // 🗝️ Supabase Service Client mit Admin-Rechten
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 🔐 Auth-User anlegen
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  // 🧾 Benutzer in DB_User speichern
  const { error: dbError } = await supabase.from('DB_User').insert([
    {
      user_id: authUser.user.id,
      email,
      vorname: userData.vorname,
      nachname: userData.nachname,
      rolle: userData.rolle,
      firma_id: userData.firma_id,
      unit_id: userData.unit_id,
      funktion: userData.funktion,
      erstellt_von,
      erstellt_am: new Date().toISOString(),
      aktiv: true,
    },
  ]);

  if (dbError) {
    return res.status(500).json({ error: dbError.message });
  }

  // 🧾 Optional: Kunde in DB_Kunden speichern
  if (
    userData.rolle === 'Admin_Dev' &&
    userData.funktion === 'Kostenverantwortlich'
  ) {
    const { data: bestehenderKunde, error: checkError } = await supabase
      .from('DB_Kunden')
      .select('id')
      .eq('firmenname', userData.firma);

    if (checkError) return res.status(500).json({ error: checkError.message });

    if (!bestehenderKunde || bestehenderKunde.length === 0) {
      const { error: kundenError } = await supabase.from('DB_Kunden').insert([
        {
          firmenname: userData.firma,
          verantwortlich: `${userData.vorname} ${userData.nachname}`,
          verantwortlich_uuid: authUser.user.id,
          created_by: erstellt_von,
          created_at: new Date().toISOString(),
          aktiv: true,
        },
      ]);

      if (kundenError) {
        return res.status(500).json({ error: kundenError.message });
      }
    }
  }

  // ✅ Erfolg zurück
  return res.status(200).json({ user: authUser.user });
}
