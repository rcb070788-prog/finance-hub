
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: JSON.stringify({ error: "Missing Auth Header" }) };
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

    // Admin Check
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profErr || !profile?.is_admin) {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden: Admins only. Please ensure your profile is marked as admin." }) };
    }

    const { action, payload } = JSON.parse(event.body);

    switch (action) {
      case 'CREATE_POLL':
        const { pollData, options } = payload;
        
        // 1. Create Poll
        const { data: newPoll, error: pErr } = await supabase
          .from('polls')
          .insert([{ ...pollData, created_by: user.id }])
          .select()
          .single();
        
        if (pErr) {
          console.error("DB Error creating poll:", pErr);
          throw new Error("DB Error: " + pErr.message);
        }

        // 2. Create Options
        const pollOptions = options.map((opt: string) => ({
          poll_id: newPoll.id,
          text: opt
        }));
        
        const { error: optErr } = await supabase.from('poll_options').insert(pollOptions);
        if (optErr) {
          console.error("DB Error creating options:", optErr);
          // Cleanup the poll if options fail
          await supabase.from('polls').delete().eq('id', newPoll.id);
          throw new Error("Failed to save poll options.");
        }

        return { statusCode: 200, body: JSON.stringify({ success: true, pollId: newPoll.id }) };

      case 'BAN_USER':
        const { error: banErr } = await supabase
          .from('profiles')
          .update({ is_banned: payload.isBanned })
          .eq('id', payload.targetUserId);
        if (banErr) throw banErr;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };

      case 'MODERATE_COMMENT':
        const { error: modErr } = await supabase
          .from('poll_comments')
          .update({ is_hidden: payload.isHidden })
          .eq('id', payload.commentId);
        if (modErr) throw modErr;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };

      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
    }
  } catch (err: any) {
    console.error("Admin Function Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
