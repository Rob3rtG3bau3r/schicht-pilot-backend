// /pages/api/update-user.js
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

  const { user_id, updatedData } = req.body;

  if (!user_id || !updatedData) {
    return res.status(400).json({ error: 'user_id oder updatedData fehlt.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { error: updateError } = await supabase
      .from('DB_User')
      .update(updatedData)
      .eq('user_id', user_id);

    if (updateError) {
      console.error('❌ Fehler beim User-Update:', updateError);
      return res.status(500).json({ error: 'Update fehlgeschlagen: ' + updateError.message });
    }
    // Wenn updateAuthEmail mitgeschickt wird, versuche auch die Mail in Supabase Auth zu ändern
if (req.body.updateAuthEmail) {
  const { data: userData, error: fetchError } = await supabase
    .from('DB_User')
    .select('email')
    .eq('user_id', user_id)
    .single();

  if (fetchError) {
    return res.status(500).json({ error: 'Auth-Email lesen fehlgeschlagen: ' + fetchError.message });
  }

  const { data: userAuth } = await supabase.auth.admin.listUsers();
  const user = userAuth.users.find(u => u.email === userData.email);

  if (user) {
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, {
      email: req.body.updateAuthEmail,
    });

    if (authUpdateError) {
      return res.status(500).json({ error: 'Auth-Mail-Update fehlgeschlagen: ' + authUpdateError.message });
    }
  }
}


    return res.status(200).json({ message: '✅ Benutzer erfolgreich aktualisiert.' });
  } catch (err) {
    console.error('💥 Schwerer Fehler:', err);
    return res.status(500).json({ error: 'Unerwarteter Fehler: ' + err.message });
  }
}
