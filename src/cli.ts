import { archivePaymentDocument, shouldArchive } from "./redact_document.ts";

const raw = process.argv[2];
if (!raw) {
  console.error("usage: npm run redact -- '{\"pdf\":\"...\",\"patterns\":[\"email\"]}'");
  process.exit(2);
}

const input = JSON.parse(raw) as { pdf: string; patterns?: string[]; riskScore?: number };
if (!shouldArchive(input.riskScore ?? 1)) {
  console.log(JSON.stringify({ status: "held", reason: "risk review" }));
  process.exit(0);
}
const result = await archivePaymentDocument(input);
console.log(JSON.stringify(result));
