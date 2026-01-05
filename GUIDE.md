
# 🏛 Phase 2 & 3: Database & Security Guide

Follow these steps to finish securing your voter list and connecting your website to the database.

---

## 1. Create your Tables
(See previous section for SQL code to paste into the Supabase SQL Editor).

---

## 2. Import your CSV
1. Go to **Table Editor** > `voter_registry`.
2. Click **Insert** > **Import CSV**.
3. Upload your file and click **Save**.

---

## 3. Enable Security (RLS) - The "Invisible Table" Trick
1. In the **Table Editor**, look at the top right of your `voter_registry` table.
2. Click the **RLS Disabled** (or "Enable RLS") button.
3. A window appears. Click **Confirm** or **Enable RLS**.
4. **STOP HERE.** Do not click "New Policy."
   - **Why?** In Supabase, if RLS is ON and there are NO policies, the table is 100% private. 
   - Public users and even logged-in users will get an error if they try to look at it.
   - This is perfect. Your private voter list is now safe.

---

## 4. Connecting Netlify to Supabase (The "Keys")
Your Netlify Functions need "Master Keys" to read the private table.

1. **In Supabase**:
   - Go to **Project Settings** (gear icon) > **API**.
   - Find the **Project URL**. Copy it.
   - Find the **service_role** key (Click "Reveal" to see it). **Copy this carefully.** (Never share this key with anyone!)

2. **In Netlify**:
   - Go to your **Site Settings** > **Environment variables**.
   - Click **Add a variable** and create these two:
     - Key: `SUPABASE_URL` | Value: (Paste your Project URL)
     - Key: `SUPABASE_SERVICE_KEY` | Value: (Paste your Service Role Key)
   - Click **Save**.

---

## 5. Verification Checklist
- [ ] `voter_registry` has RLS Enabled.
- [ ] `voter_registry` has ZERO policies (shows "0 policies").
- [ ] Netlify has the two "Environment variables" saved.

Now, when a user tries to sign up, the Netlify Function will use that `SUPABASE_SERVICE_KEY` to "unlock" the registry, check the voter's details, and then "lock" it again before sending the answer back to the user.
