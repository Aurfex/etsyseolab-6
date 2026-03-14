import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    const { error } = await supabase
      .from('waitlist')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(200).json({ 
          success: true, 
          message: 'You are already on the waitlist!' 
        });
      }
      throw error;
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Successfully added to waitlist' 
    });
  } catch (error: any) {
    console.error('[Waitlist] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
