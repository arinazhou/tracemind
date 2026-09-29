# Turning on accounts (Firebase), about 5 minutes

Accounts let everyone sign in (Google or email/password) and keep their done ✓, dates,
notes and solutions on every device. Until these steps are done, the site works as
before: progress is saved in each browser.

Firebase's free **Spark** plan is enough (no credit card). You own the project, and
the records live in it.

## 1. Create the project
1. Open <https://console.firebase.google.com> and sign in with your Google account.
2. **Create a project** → name it `tracemind` → turn **off** Google Analytics (not needed) → **Create**.

## 2. Turn on sign-in
1. Left menu → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Google** → Enable → choose a support email → **Save**.
3. **Add new provider** → **Email/Password** → enable the first switch (not "Email link") → **Save**.
4. **Settings** tab → **Authorized domains** → **Add domain** → `arinazhou.github.io`.

## 3. Create the database and lock it down
1. Left menu → **Build → Firestore Database** → **Create database**.
2. Location: `nam5 (United States)` → **Next** → **Start in production mode** → **Create**.
3. **Rules** tab → replace everything with the contents of [`firestore.rules`](../firestore.rules) → **Publish**.
   These rules are what guarantee that people can only read and write their own records.

## 4. Connect the website
1. Project Overview (⚙️) → **Project settings** → **Your apps** → click the **`</>`** (Web) icon.
2. Nickname `tracemind-web` → **Register app** (no hosting needed).
3. Copy the `firebaseConfig = { ... }` block it shows, then either:
   - paste it into `web/src/cloud/config.ts` in place of `null`, commit and push, **or**
   - send it to whoever maintains the site.

These values identify the project; they are not passwords and are safe to commit.
After the next deploy, a **Sign in** button appears at the bottom of the sidebar.

## What users get
- **Continue with Google**, or email + password (with "Forgot password?" reset emails)
- Records sync live between devices; the first sign-in moves the browser's existing progress into the account
- **Sign out** clears the account's copy from that browser (good for shared lab computers)
- **Delete my data** erases all of that user's records

## Limits of the free plan
50,000 reads and 20,000 writes per day, 1 GiB stored. Loading a full profile is about 200
reads, and each check-off or note is 1 write, which is plenty for a class-sized group of users.
