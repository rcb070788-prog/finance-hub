
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase Client (Our bridge to the database)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { lastName, voterId, dob, address } = JSON.parse(event.body);

    // 1. First, find the voter by ID and Last Name
    const { data: voter, error } = await supabase
      .from('voter_registry')
      .select('*')
      .eq('voter_id', voterId)
      .ilike('last_name', lastName) // ilike makes it not care about Upper/Lower case
      .single();

    if (error || !voter) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: "Voter ID or Last Name not found in registry." }) 
      };
    }

    // 2. "Only Two" Rule: Check if either DOB or Address matches
    const dobMatches = dob && voter.date_of_birth === dob;
    const addressMatches = address && voter.street_address.toLowerCase().includes(address.toLowerCase());

    if (dobMatches || addressMatches) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          district: voter.district,
          fullName: `${voter.first_name || ''} ${voter.last_name}`.trim()
        }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Verification failed. Please check your Date of Birth or Street Address." })
      };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server connection error." }) };
  }
};
