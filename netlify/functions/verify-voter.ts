
import { createClient } from '@supabase/supabase-js';

// 1. Check for keys before we even try to run
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 2. Safety check: Did the user add the Service Key to Netlify?
  if (!supabaseUrl || !supabaseServiceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Configuration Error: Missing SUPABASE_SERVICE_KEY in Netlify settings." })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { lastName, voterId, dob, address } = JSON.parse(event.body);

    // 3. Search the registry
    const { data: voter, error } = await supabase
      .from('voter_registry')
      .select('*')
      .eq('voter_id', voterId)
      .ilike('last_name', lastName) 
      .single();

    if (error || !voter) {
      // Log the error for the developer to see in Netlify logs
      console.error("Supabase Error:", error);
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: "Voter ID or Last Name not found. Check spelling (Must be ALL CAPS)." }) 
      };
    }

    const dobMatches = dob && voter.date_of_birth === dob;
    const addressMatches = address && voter.street_address.toUpperCase().includes(address.toUpperCase());

    if (dobMatches || addressMatches) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          district: voter.district,
          fullName: `${voter.first_name || ''} ${voter.last_name}`.trim().toUpperCase()
        }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Identity check failed. Your Date of Birth or Street Address doesn't match our records." })
      };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "System error during verification." }) };
  }
};
