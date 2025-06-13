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

  const { email, password, kundenData } = req.body;
  console.log('🛎 Anfrage erhalten:', req.body);

  if (!email || !password || !kundenData?.firmenname || !kundenData?.verantwortlich) {
    return res.status(400).json({ error: 'Pflichtdaten fehlen (Email, Passwort, Firmenname, Verantwortlich).' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Schritt 1: Auth-User erstellen
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Supabase Auth-Fehler:', authError);
      return res.status(500).json({ error: 'Auth-Fehler: ' + authError.message });
    }

    const userId = authUser.user.id;

    // Schritt 2: Kunde in DB_Kunde eintragen (nur Minimalfelder)
    const kundePayload = {
      firmenname: kundenData.firmenname,
      aktiv: true,
      verantwortlich: kundenData.verantwortlich,
    };

    console.log('📦 DB_Kunde INSERT:', JSON.stringify(kundePayload, null, 2));

    const { error: kundeError } = await supabase
      .from('DB_Kunde')
      .insert([kundePayload]); // kein .select()

    if (kundeError) {
      console.error('❌ DB_Kunde Insert Error:', kundeError);
      return res.status(500).json({ error: 'Insert in DB_Kunde fehlgeschlagen: ' + kundeError.message });
    }

    console.log('✅ Kunde erfolgreich angelegt.');

    // Schritt 3: User in DB_User schreiben
    const userInsert = {
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
    };

    const { error: userError } = await supabase.from('DB_User').insert([userInsert]);

    if (userError) {
      console.error('❌ Fehler in DB_User:', userError);
      return res.status(500).json({ error: 'User-Eintrag fehlgeschlagen: ' + userError.message });
    }

    return res.status(200).json({
      message: '✅ Kunde + Verantwortlicher erfolgreich gespeichert.',
      user_id: userId,
    });

  } catch (err) {
    console.error('💥 Schwerer Fehler:', err);
    return res.status(500).json({ error: 'Unerwarteter Fehler: ' + err.message });
  }
}

