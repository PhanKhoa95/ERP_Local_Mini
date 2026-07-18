import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const executeCleanup = process.argv.includes("--execute");

if (!supabaseUrl || !supabaseKey) {
  const missing = [
    !supabaseUrl && "VITE_SUPABASE_URL",
    !supabaseKey && "VITE_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean);
  console.error(`Missing required Supabase environment variable(s): ${missing.join(", ")}`);
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

  console.log(`Found ${data?.length ?? 0} matching test partner(s).`);

  if (data && data.length > 0) {
    if (!executeCleanup) {
      console.log("Dry run only. Re-run with --execute to delete KH-NEW-RETAIL.");
      return;
    }

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
