import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: true }
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS-Header global setzen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Bei Preflight-Anfragen sofort 200 OK zurückgeben
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, updateData } = req.body;

  if (!id || !updateData) {
    return res.status(400).json({ error: 'Fehlende ID oder Daten' });
  }

  try {
    const { error } = await supabase
      .from('DB_User')
      .update(updateData)
      .eq('user_id', id);

    if (error) {
      console.error('Update-Fehler:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Update erfolgreich' });
  } catch (err) {
    console.error('Server-Fehler:', err);
    return res.status(500).json({ error: err.message });
  }
}
