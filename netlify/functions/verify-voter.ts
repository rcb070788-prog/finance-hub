import { createClient } from '@supabase/supabase-js';

/**
 * VERIFY VOTER FUNCTION
 * This matches input against the private voter_registry table.
 * Requirement: voter_id must match, PLUS last_name AND (either date_of_birth OR street_address).
 */

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

  // API: Application Programming Interface
  // SQL: Structured Query Language
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { lastName, voterId, dob, address } = JSON.parse(event.body);

    // 1. Query Supabase for a row where voter_id = voterId AND last_name = lastName.
    const { data, error } = await supabase
      .from('voter_registry')
      .select('*')
      .eq('voter_id', voterId)
      .ilike('last_name', lastName) // Case-insensitive match
      .single();

    if (error || !data) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "No matching record found in the voter registry." }),
      };
    }

    // 2. Check if (row.date_of_birth == dob) OR (row.street_address == address).
    const dobMatch = data.date_of_birth === dob;
    const addressMatch = data.street_address.toLowerCase().includes(address.toLowerCase());

    if (dobMatch || addressMatch) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          district: data.district,
          fullName: `${lastName}, Voter ${voterId}` // We'd usually have a first name, but using ID for now
        }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Identity verification failed. Information does not match." }),
      };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "System error during verification" }) };
  }
};