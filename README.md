This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment Variables

Create a `.env.local` with the following keys so the signup/login APIs can talk to Supabase and issue JWTs:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` ? any random string used to sign login JWTs

## Signup API

`POST /api/signup`

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "super-secret",
  "licenseKey": "XXXX-XXXX-XXXX-XXXX"
}
```

Behavior:

- Validate that the license key exists, has `user_id = null`, and reserve it for the new user.
- Hash the password with `bcrypt`, insert into `users`, and set `license_id` to that license.
- If username/email already exist or the license is used, return `409`.

## Login API

`POST /api/login`

```json
{
  "email": "john@example.com",
  "password": "super-secret"
}
```

Behavior:

- Validate email and password; on failure return `401`.
- On success return `{ token, user }`; `token` is a 2-hour JWT that can be stored in `localStorage` for later requests.

## Manual Test Flow

1. In Supabase, add a `licenses` row with `user_id = null` and an unused `license_key`.
2. Open `/signup`, fill username/email/password/license key, then submit.
3. After success, verify in Supabase that `users` has the new row and `licenses.user_id` points to it.
4. Use the new email/password at `/login`; confirm success, `localStorage.sqlbots_token` exists, and you are redirected to `/dashboard` within 2 seconds.
"# sqlbot-dashboard" 
