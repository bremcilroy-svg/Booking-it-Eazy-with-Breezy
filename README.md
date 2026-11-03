# Book It Eazy with Breezy

Static GitHub Pages website + Supabase database and authentication.

## 1. Create Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor**, paste `schema.sql`, and run it **once** on a fresh project. This enables Row Level Security (RLS) and creates tables and access policies.
3. In **Project Settings → API** (or the project's **Connect** panel), copy your project URL and **publishable** key (or legacy `anon` key). **NEVER use a secret/service_role key in a browser file.**
4. Open `config.js` and replace `YOUR-PROJECT` and `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY` with your values. It is normal for public browser keys to appear in a public repository: database security relies on RLS, not hiding the publishable key.
5. Under **Authentication → URL Configuration**, set the Site URL to your final GitHub Pages URL. Add it to redirect URLs as needed. Under **Authentication → Providers → Email**, choose whether signups require email confirmation. Configure an SMTP provider for reliable production email delivery.
6. Create your own account using **My Trips → Create Account** and confirm your email if prompted. In Supabase **Authentication → Users**, verify the account exists.
7. In **SQL Editor**, run this statement with your real admin email:

```sql
insert into public.admins(user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
on conflict do nothing;
```

8. Sign out and back in. Go to the **Agent Login** link in the footer. Only the account listed in `admins` can manage inquiries, posts, bookings and commission records.

## 2. Publish on GitHub Pages

1. Create a GitHub repository, for example `book-it-eazy`.
2. Upload `index.html`, `config.js`, `schema.sql`, `README.md`, and the entire `assets/` folder **keeping the directory structure**. You can upload the extracted ZIP contents; do not upload only the ZIP file.
3. Commit to the `main` branch.
4. Open repository **Settings → Pages**. Select **Deploy from a branch**, branch `main`, folder `/ (root)`; save.
5. Wait for deployment, then open `https://YOURUSERNAME.github.io/book-it-eazy/`.
6. Test the quote form and the admin dashboard from two separate browsers/devices.

## 3. Add your Costa Maya photo

Place your actual photo at `assets/breezy-photo.jpg`. A generic placeholder appears if the file is absent. Do not publish a private photo without permission.

## 4. What works

- Mobile responsive homepage, navigation and tropical palm animation
- Cruise line filtering and inquiry prefill
- Illustrative estimator (no fabricated live prices or discounts)
- Public blog articles from Supabase, full article reading
- Private admin publishing and deleting posts
- Quote submissions to Supabase; private agent inbox and status updates
- Supabase email/password signup and sign-in
- Customer trips: users see only bookings linked to their Auth User ID
- Admin booking creation and commission calculator
- Unofficial training practice quizzes

## 5. Important launch checklist

- **Inquiries are stored, not emailed.** To receive notifications, create a trusted server-side notification flow (e.g., Supabase Database Webhook → Edge Function → email provider). Never put an email API secret in browser JavaScript.
- **Public inquiry forms can be spammed.** Before advertising widely, add CAPTCHA/Turnstile with server-side verification, rate limiting, and abuse monitoring. Client-only checks are insufficient.
- Configure privacy policy, terms, business/host agency disclosures, and any legally required seller-of-travel disclosures with appropriate professional advice.
- Verify all credentials, partner relationships, promotions, fares, booking transfer terms, and fee claims before publishing. Sample cruise ideas are not bookable inventory.
- Avoid collecting passports, payment cards, dates of birth, or other sensitive travel documents in this basic form.
- **Do not publish client names, emails or notes** in public pages or commit them to GitHub.
- Booking status and portal are informational; this site does not process supplier bookings, payments, or real-time inventory.
- For client accounts, consider turning off open signup if you prefer to invite customers manually. Never assign admin access through a public signup form.
- Test Supabase RLS with an anonymous browser, a regular user, and your admin account.
- For high-volume production, add pagination, email notifications, backups, an audit log, and robust account recovery.

## 6. Security notes

`admins` has no public insert policy. Only a privileged SQL editor / service role can assign admin access. Admin policies check the authenticated user on the server via `public.is_admin()`; merely editing browser code cannot grant admin database permissions. Visitors may insert new inquiries but cannot read them. Clients may read only their own linked bookings. Blog posts are publicly readable only if published. Never use a Supabase secret/service role key in GitHub Pages.

## 7. Technical note

The project uses plain HTML/CSS/JavaScript and the Supabase JS v2 browser SDK. It requires no Node build step. It is intentionally compatible with GitHub Pages static hosting. Browser network access is required for Supabase and external images/fonts.
