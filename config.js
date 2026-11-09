// Public config. Publishable key is safe in a public page (insert-only RLS on waitlist).
// NEVER put a secret / service_role key here.
window.SCOOL_CONFIG = {
  SUPABASE_URL: "https://bdrnwgsrptzezfubfcux.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_L4n1C31nlCzGdh7dvzZzjQ_2WmM5XsR",
  // TODO(Blaise): set a real contact email, e.g. "name@example.com". Empty = footer shows "Contact: coming soon".
  CONTACT_EMAIL: "",
  // The waitlist table only has an email column today. Flip to true after backend adds grade + school columns.
  SEND_GRADE_AND_SCHOOL: false
};
