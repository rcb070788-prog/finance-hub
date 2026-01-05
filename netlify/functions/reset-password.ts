import { createClient } from '@supabase/supabase-js';

/**
 * RESET PASSWORD FUNCTION
 * 1. Verify identity against voter_registry.
 * 2. Generate a temporary 6-character password.
 * 3. Update the user's password in Supabase Auth.
 */

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
  
  // Use the Service Key so we have "Admin" powers to change passwords
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { lastName, voterId, verifier } = JSON.parse(event.body);

    // 1. Check voter_registry for (voter_id AND last_name)
    const { data: voter, error: voterError } = await supabase
      .from('voter_registry')
      .select('*')
      .eq('voter_id', voterId)
      .ilike('last_name', lastName)
      .single();

    if (voterError || !voter) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "No matching voter record found." }),
      };
    }

    // 2. Confirm (dob == verifier) OR (address == verifier)
    const isVerified = voter.date_of_birth === verifier || 
                       voter.street_address.toLowerCase().includes(verifier.toLowerCase());

    if (!isVerified) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Verification details do not match our records." }),
      };
    }

    // 3. Find the user in Auth system to get their ID
    // Note: We assume the user has already signed up with an email. 
    // We search the 'profiles' table (or auth.users) to find who owns this voterId.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('voter_id', voterId)
      .single();

    if (profileError || !profile) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: "No registered account found for this Voter ID." }),
      };
    }

    // 4. Generate a temporary 6-character password (e.g., 'T-492X')
    const tempPassword = 'T-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    // 5. Update the user's password in Supabase Auth using Admin powers
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: tempPassword }
    );

    if (updateError) throw updateError;

    // In a real Phase 3, we would trigger an Email/SMS here. 
    // For now, we return success so the UI can show the message.
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `Identity verified. Your temporary password is: ${tempPassword}. Please log in and change it immediately.`,
        tempPassword // Returning it here for testing since we haven't set up the Email/SMS provider yet
      }),
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Reset failed" }) };
  }
};