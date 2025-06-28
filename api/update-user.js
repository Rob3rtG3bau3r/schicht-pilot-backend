export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, updateData, updateAuthEmail } = req.body;

  if (!id || !updateData) {
    return res.status(400).json({ error: 'ID oder updateData fehlt.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Update DB_User
    const { error: dbError } = await supabase
      .from('DB_User')
      .update(updateData)
      .eq('user_id', id);

    if (dbError) {
      console.error('DB Error:', dbError);
      return res.status(500).json({ error: dbError.message });
    }

    // Optional: Email in Auth ändern
    if (updateAuthEmail) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email: updateAuthEmail
      });

      if (authError) {
        console.error('Auth Error:', authError);
        return res.status(500).json({ error: authError.message });
      }
    }

    return res.status(200).json({ message: 'Benutzer erfolgreich aktualisiert' });
  } catch (err) {
    console.error('Fatal:', err);
    return res.status(500).json({ error: err.message });
  }
}

