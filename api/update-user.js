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

  const { id: userId, updateData, updateAuthEmail } = req.body;

  if (!userId || !updateData) {
    return res.status(400).json({ error: 'user_id oder updateData fehlt.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // ✅ 1. Zuerst normale Felder aktualisieren
    const { error: updateError } = await supabase
      .from('DB_User')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ Fehler beim User-Update:', updateError);
      return res.status(500).json({ error: 'Update fehlgeschlagen: ' + updateError.message });
    }

    // ✅ 2. Falls neue E-Mail mitgegeben wurde, auch in auth.users ändern
    if (updateAuthEmail) {
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
        email: updateAuthEmail,
      });

      if (authUpdateError) {
        console.error('❌ Fehler beim Auth-E-Mail-Update:', authUpdateError);
        return res.status(500).json({ error: 'E-Mail-Update fehlgeschlagen: ' + authUpdateError.message });
      }
    }

    return res.status(200).json({ message: '✅ Benutzer erfolgreich aktualisiert.' });
  } catch (err) {
    console.error('💥 Schwerer Fehler:', err);
    return res.status(500).json({ error: 'Unerwarteter Fehler: ' + err.message });
  }
}

