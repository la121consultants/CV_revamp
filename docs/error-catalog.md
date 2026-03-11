# Error Catalog & UI Audit Tracker

This file is the central audit tracker for backend error codes and user-facing copy.

## Active error codes

| Code | HTTP status | Where it is emitted | Internal message | Customer-facing message |
|---|---:|---|---|---|
| `ERR_2001_USAGE_LIMIT_REACHED` | 402 | `track-usage`, `revamp-cv`, `generate-suggestions` | Usage limit reached. | You've used all free CV trials for today. Upgrade your plan or try again tomorrow. |
| `ERR_2002_INVALID_REQUEST` | 400 | `revamp-cv` | Invalid request payload. | Some required information is missing. Please review your inputs and try again. |
| `ERR_2003_AUTH_REQUIRED` | 401 | `_shared/auth` | Authentication required. | Please sign in to continue. |
| `ERR_2004_RATE_LIMITED` | 429 | `revamp-cv`, `generate-suggestions` | Rate limit exceeded. | You're making requests too quickly. Please wait a moment and try again. |
| `ERR_2005_SERVICE_MISCONFIGURED` | 500 | `revamp-cv`, `generate-suggestions` | Required service configuration is missing. | Our service is temporarily unavailable. Please try again shortly. |
| `ERR_2006_UPSTREAM_FAILURE` | 502 | `revamp-cv`, `generate-suggestions` | AI provider request failed. | We couldn't complete your request due to a temporary AI service issue. Please try again. |
| `ERR_2007_INVALID_AUTH_TOKEN` | 401 | `_shared/auth` | Invalid or expired authentication token. | Your session has expired. Please sign in again. |
| `ERR_2500_INTERNAL_ERROR` | 500 | `track-usage`, `revamp-cv`, `generate-suggestions` and generic catch paths | Unexpected server error. | Something went wrong on our side. Please try again. |

## Audit process

1. Add/update an entry in `supabase/functions/_shared/errors.ts`.
2. Mirror/update frontend mapping in `src/lib/errorTracker.ts`.
3. Ensure the UI reads `customerMessage` (not raw transport errors like non-2xx).
4. Update this document when adding/removing a code or changing wording.

## Legacy behavior addressed

- Supabase function transport errors (`non-2xx`) could surface technical messages in the UI.
- The app now parses structured edge-function errors and shows `customerMessage` instead.
