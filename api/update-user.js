// /pages/api/update-user.js
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  const allowedOrigins = ['http://localhost:5173', 'https://schicht-pilot-frontend.vercel.app'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, updateData, updateAuthEmail } = req.body;

  if (!id || !updateData) {
    return res.status(400).json({ error: 'Fehlende Daten: id oder updateData fehlt.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { error: updateError } = await supabase
      .from('DB_User')
      .update(updateData)
      .eq('user_id', id);

    if (updateError) {
      console.error('❌ Update-Fehler DB_User:', updateError);
      return res.status(500).json({ error: 'Fehler beim Speichern: ' + updateError.message });
    }

    // Optional: Mail-Adresse im Auth-Backend ändern
    if (updateAuthEmail) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email: updateAuthEmail,
      });

      if (authError) {
        console.warn('⚠️ Auth-Update Warnung:', authError.message);
      }
    }

    return res.status(200).json({ message: '✅ Benutzer erfolgreich aktualisiert.' });
  } catch (err) {
    console.error('💥 Schwerer Fehler:', err);
    return res.status(500).json({ error: 'Serverfehler: ' + err.message });
  }
}

