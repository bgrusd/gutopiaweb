# Account confirmation landing page

`account-confirmed.html` is the website destination for the mobile app’s email-confirmation redirect. It matches the site’s navy/violet/Sora design and offers a manual, token-free `gutopia://auth/confirmed` app link, an App Store fallback and website/support links. The user signs into the app separately.

The page’s first head script captures an implicit `access_token` fragment only in memory, then removes the entire query/fragment before resource loading or verification. A no-referrer policy prevents subsequent resource/navigation requests from carrying the original URL. It does not exchange `code` or `token_hash` callbacks.

For a well-formed implicit callback, it calls the project’s `/auth/v1/user` endpoint with the public publishable key and returned bearer token. The request omits cookies, uses no-store and is aborted after 15 seconds. The token is discarded after constructing that request; neither it nor the returned account is persisted. The page displays “email confirmed” only when the authenticated response includes a valid `email_confirmed_at` timestamp. It does not display an account email or transfer a session to the app.

Direct visits are neutral. Link errors, malformed or expired sessions, unsupported flows, unavailable networking and timeouts give safe instructions without reproducing raw link errors or credentials.

## Hosting and Auth configuration are separate

Serving this page does not configure Supabase. The app must supply the website URL as its signup `emailRedirectTo`, and Supabase must allow the exact destination, normally:

```
https://gutopia.ai/account-confirmed.html
```

If the hosting configuration canonicalizes HTML paths, verify the returned path and the Supabase redirect configuration together. This source change makes no Supabase dashboard/configuration changes and sends no signup, confirmation or email request.

## Verification

All Auth responses are mocked before the first page script runs; no actual account or token is used. With the existing local static server:

```sh
PLAYWRIGHT_MODULE=/tmp/gutopia-web-qa/node_modules/playwright node scripts/test-account-confirmation.cjs
```

The check covers 13 states, immediate URL cleanup, verification before confirmed status, unsupported-flow refusal, expiry/errors/offline/15-second abort, no storage/token leaks/account-email exposure/real Auth requests, a token-free app link and 320/390-pixel layouts. Desktop/mobile screenshots were visually reviewed. Live email redirect and native app return behavior still require an actual end-to-end check after hosting and Auth configuration are deployed.
