# Sanad live web MVP

Version: v0.9.0

A dependency-free browser MVP is deployed on Vercel and talks directly to the live Supabase backend using the public publishable key only.

Implemented in the live browser MVP:
- Email sign-up/sign-in/sign-out through Supabase Auth.
- Profile read using RLS.
- Public published-property search.
- Office accreditation submission through an authenticated Edge Function.
- Four service request types through REST + RLS.
- Start a property conversation through an authenticated Edge Function.
- Read/send conversation messages through REST + RLS.
- Anonymous transaction tracking through the rate-limited resolver function.

Web-facing Edge Functions now include CORS handling for browser calls.

The Vercel preview is intentionally separate from the Expo/React Native build. It lets us test live backend workflows while the current execution container cannot resolve external npm registries.
