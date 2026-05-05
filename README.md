# Book Nest Web

This workspace now boots as a Bun-powered TanStack Start app.

## Run

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun run dev
```

The app starts on `http://localhost:3000`.

## Build

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun run build
```

## Test

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun run test
```

## Email verification proxy

Server-side proxy for email verification is scaffolded at `src/lib/emailVerification.ts`. To enable:

1. Set an API key in your environment (or `.env` loaded by the runtime):
   - `EMAIL_VERIFY_API_KEY=<your-provider-key>`
   - `EMAIL_VERIFY_API_URL` (optional, defaults to ValidEmail `https://api.validemail.io/v1/verify`)
2. Call `verifyEmailClient(email)` from client code; the request is handled server-side so the key never reaches the browser.

## Google sign-in

Google sign-in is wired through Google Identity Services and saves the signed-in Google profile into the existing Book Nest account profile.

1. Create a Google OAuth client:
   - Application type: Web application
   - Authorized JavaScript origins: `https://booknest.website`
   - Add your Vercel preview/deployment URL too if you want Google sign-in there.
2. Add this Vercel environment variable:
   - `VITE_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com`
3. Redeploy after saving the variable.

## Deploying to Vercel (SSR)

1. Env vars in Vercel project settings:
   - `EMAIL_VERIFY_API_KEY`
   - `EMAIL_VERIFY_API_URL` (e.g., `https://api.sniffmail.io/verify`)
   - `VITE_GOOGLE_CLIENT_ID`
2. Build settings:
   - Install: `bun install`
   - Build: `bun run build`
   - Output directory: leave blank
3. Runtime:
   - Nitro generates Vercel output in `.vercel/output`.
   - Node.js version is pinned to 22.x.
4. Connect the repo in Vercel and deploy (Hobby tier is fine).

## Structure

- `src/`: TanStack Start web app
- `src/routes/`: route files
- `src/components/`: shared UI
- `Book Nest/`: preserved SwiftUI source from the original macOS version

## Next product work

- Replace placeholder dashboard data with route loaders and server functions
- Add shared backend storage
- Port reservations, invites, chat, and day notes from the old SwiftUI prototype
