import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  // CORS erlauben
  res.setHeader('Access-Control-Allow-Origin', '*'); // ODER z. B. 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS preflight für CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id: user_id, updateData, updateAuthEmail } = req.body;

  if (!user_id || !updateData) {
    return res.status(400).json({ error: 'user_id oder updateData fehlt.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // User-Daten in DB_User ändern
    const { error: updateError } = await supabase
      .from('DB_User')
      .update(updateData)
      .eq('user_id', user_id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // Auth-E-Mail ändern (wenn mitgegeben)
    if (updateAuthEmail) {
      const { error: authError } = await supabase.auth.admin.updateUserById(user_id, {
        email: updateAuthEmail,
      });

      if (authError) {
        return res.status(500).json({ error: 'Auth-Mail konnte nicht geändert werden: ' + authError.message });
      }
    }

    return res.status(200).json({ message: 'Benutzer erfolgreich aktualisiert.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}



