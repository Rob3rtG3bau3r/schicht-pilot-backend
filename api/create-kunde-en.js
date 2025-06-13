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

  // Basisprüfung
  if (!email || !password || !kundenData?.firmenname || !kundenData?.verantwortlich) {
    return res.status(400).json({ error: 'Pflichtdaten fehlen (Email, Passwort, Firmenname, Verantwortlich).' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // ➤ Schritt 1: Auth-User erstellen
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Fehler bei Supabase Auth:', authError);
      return res.status(500).json({ error: 'Fehler beim Anlegen des Users: ' + authError.message });
    }

    const userId = authUser.user.id;

    // ➤ Schritt 2: Kunde in DB_Kunde speichern
    const kundePayload = {
      firmenname: kundenData.firmenname,
      aktiv: kundenData.aktiv ?? true,
      verantwortlich: kundenData.verantwortlich,
      erstellt_von: kundenData.erstellt_von || null,
      created_at: new Date().toISOString(),
      kosten_monatlich: 0,               // Standardwert statt null
      sprache: kundenData.sprache || 'de',
      feature_set: kundenData.feature_set || '',
      besonderheiten: kundenData.besonderheiten || '',
      logo_url: kundenData.logo_url || '',
      logo_bool: kundenData.logo_bool ?? false,
    };

    console.log('📦 Insert-Objekt für DB_Kunde:', kundePayload);
    console.log('✅ KundenData vor Insert:', JSON.stringify(kundenData, null, 2));
    
    const { data: kundeData, error: kundeError } = await supabase
      .from('DB_Kunde')
      .insert([kundePayload])
      .select();

    if (kundeError) {
      console.error('❌ Fehler beim Einfügen in DB_Kunde:', kundeError);
      return res.status(500).json({ error: 'Fehler beim Speichern des Kunden: ' + kundeError.message });
    }

    console.log('✅ Kunde gespeichert:', kundeData);

    // ➤ Schritt 3: User auch in DB_User eintragen
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
      }
    ]);

    if (userError) {
      console.error('❌ Fehler in DB_User:', userError);
      return res.status(500).json({ error: 'User angelegt, aber Eintrag in DB_User fehlgeschlagen: ' + userError.message });
    }

    return res.status(200).json({
      message: 'Kunde + Verantwortlicher erfolgreich gespeichert.',
      user_id: userId
    });

  } catch (err) {
    console.error('💥 Allgemeiner Fehler:', err);
    return res.status(500).json({ error: 'Unerwarteter Serverfehler: ' + err.message });
  }
}

