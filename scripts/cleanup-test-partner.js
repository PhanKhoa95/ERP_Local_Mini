import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars in process.env:", { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking for KH-NEW-RETAIL...");
  const { data, error } = await supabase
    .from("partners")
    .select("id, name, code")
    .eq("code", "KH-NEW-RETAIL");

  if (error) {
    console.error("Error fetching partner:", error);
    process.exit(1);
  }

  console.log("Found partners:", data);

  if (data && data.length > 0) {
    console.log("Deleting partner KH-NEW-RETAIL...");
    const { error: delError } = await supabase
      .from("partners")
      .delete()
      .eq("code", "KH-NEW-RETAIL");

    if (delError) {
      console.error("Error deleting partner:", delError);
      process.exit(1);
    }
    console.log("Deleted successfully!");
  } else {
    console.log("Partner not found. No cleanup needed.");
  }
}

run();
