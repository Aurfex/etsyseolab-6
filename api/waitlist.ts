import { VercelRequest, VercelResponse } from '@vercel/node';

// This is a simple mock API for the waitlist. 
// In a production app, we would use Supabase, MongoDB, or an email service like Mailchimp.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    console.log(`[Waitlist] New signup: ${email}`);
    
    // Simulate a bit of latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Success response
    return res.status(200).json({ 
      success: true, 
      message: 'Successfully added to waitlist' 
    });
  } catch (error) {
    console.error('[Waitlist] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
