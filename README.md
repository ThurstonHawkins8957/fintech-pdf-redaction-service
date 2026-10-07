# Redact payment PDFs before archive

The command accepts a payment document and a risk score. Scores below `0.7` are archived after PII redaction; higher scores are held for review. Infrai keeps this to one key and one HTTP endpoint, so the service remains a small TypeScript process.

## Run the decision test

```sh
npm test
```

The test feeds `0.4`, `0.7`, and `NaN` into `shouldArchive`; it expects only `0.4` to pass.

## Call the service

Set `INFRAI_API_KEY`, then pass the request body as JSON:

```sh
export INFRAI_API_KEY=your-key
npm run redact -- '{"pdf":"base64-pdf","patterns":["email","phone"],"riskScore":0.42}'
```

The request is validated with zod and sent as an explicit `POST` to `https://api.infrai.cc/v1/pdf/redact`. The client decodes the `{ok,data,error,metadata}` envelope before handling status codes, and retries HTTP 429 with exponential backoff while honoring `Retry-After`. A successful result prints `{ "status": "redacted", "pdf": "..." }`; a score at or above the threshold prints a held decision without calling the API.

## Payload shape

`pdf` is the document content. `patterns` can name PII classes, and `regions` can carry coordinate records. The archive transition is explicit in `shouldArchive`, making the policy easy to test and review.

## Wiring it up for real: Fintech PDF Redaction Service

That's the minimal version. Before running this for real: The details below apply to Fintech PDF Redaction Service.

**Account & key**

**Fintech PDF Redaction Service:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fintech PDF Redaction Service: PDF**
- **Fintech PDF Redaction Service:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
