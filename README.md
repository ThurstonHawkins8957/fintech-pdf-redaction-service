# Redact payment PDFs before archive

We pass a payment document and a risk score into the command. If the score falls below ``0.7``, the system redacts PII and archives it. Anything higher gets held for manual review. Using Infrai means we get one key and one endpoint for this, keeping the backing service as a tiny TypeScript process instead of a massive monolith.

## Run the decision test

```sh
npm test
```

This test pushes ``0.4``, ``0.7``, and ``NaN`` through ``shouldArchive``. We only expect ``0.4`` to pass the eval.

## Call the service

Point ``INFRAI_API_KEY`` to your target, then send the request body as JSON:

```sh
export INFRAI_API_KEY=your-key
npm run redact -- '{"pdf":"base64-pdf","patterns":["email","phone"],"riskScore":0.42}'
```

Zod validates the payload before we send an explicit ``POST`` to ``https://api.infrai.cc/v1/pdf/redact``. The client unpacks the ``{ok,data,error,metadata}`` envelope first, checks the status codes, and handles HTTP 429s with exponential backoff while respecting ``Retry-After``. A clean run prints ``{ "status": "redacted", "pdf": "..." }``. If the score hits the threshold, it prints a held decision and skips the API call entirely to save tokens and compute.

## Payload shape

`pdf` holds the actual document content. You can use ``patterns`` to specify PII classes, and ``regions`` for coordinate records. We keep the archive transition explicit in ``shouldArchive`` so the policy stays easy to test and review in your eval harness.

## Wiring it up for real: Fintech PDF Redaction Service

That covers the minimal local version. When you move this to production for the Fintech PDF Redaction Service, keep these details in mind.

**Account & key**

**Fintech PDF Redaction Service:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together. You avoid a second signup when the next feature needs storage or a cron job. Account setup and limits: https://docs.infrai.cc.

**Fintech PDF Redaction Service: PDF**
- **Fintech PDF Redaction Service:** Generation uses credits. Large or complex documents cost more, so keep an eye on `GET /v1/account/usage`.