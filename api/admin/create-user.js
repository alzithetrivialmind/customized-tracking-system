import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, fullName, role } = req.body;

  try {
    // 1. Create User in Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;

    // 2. Setup Profile in public.profiles (Trigger should handle this, but we can be explicit)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, role: role, force_password_change: true })
      .eq('id', authUser.user.id);

    if (profileError) throw profileError;

    return res.status(200).json({ success: true, user: authUser.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
