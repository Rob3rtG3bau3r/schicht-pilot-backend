import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  // ✅ CORS Header setzen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Preflight okay
  }

  const { id, updateData, updateAuthEmail } = req.body;

  if (!id || !updateData) {
    return res.status(400).json({ error: 'id oder updateData fehlt.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 🟡 Optional: Auth-E-Mail ändern
  if (updateAuthEmail) {
    const { error: emailErr } = await supabase.auth.admin.updateUserById(id, {
      email: updateAuthEmail,
    });
    if (emailErr) {
      console.error('❌ Fehler beim Aktualisieren der Auth-E-Mail:', emailErr);
      return res.status(500).json({ error: 'Fehler beim Aktualisieren der E-Mail: ' + emailErr.message });
    }
  }

  const { error } = await supabase
    .from('DB_User')
    .update(updateData)
    .eq('user_id', id);

  if (error) {
    console.error('❌ Fehler beim User-Update:', error);
    return res.status(500).json({ error: 'Update fehlgeschlagen: ' + error.message });
  }

  return res.status(200).json({ message: '✅ Benutzer erfolgreich aktualisiert.' });
}
