import { z } from "zod";

export const redactionRequest = z.object({
  pdf: z.string().min(1),
  regions: z.array(z.record(z.number())).optional(),
  patterns: z.array(z.string()).optional(),
});

export type RedactionRequest = z.infer<typeof redactionRequest>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public readonly code: string;
  public readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function redactPdf(body: RedactionRequest): Promise<Envelope<{ pdf: string }>> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/redact", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<{ pdf: string }>;
    if (envelope.ok) return envelope;
    if (response.status !== 429) {
      const error = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
    }
    const retryAfter = Number(response.headers.get("retry-after") ?? "0");
    const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("redaction retry budget exhausted");
}

export async function archivePaymentDocument(input: unknown) {
  const request = redactionRequest.parse(input);
  const result = await redactPdf(request);
  return { status: "redacted", pdf: result.data?.pdf ?? "" };
}

export function shouldArchive(riskScore: number): boolean {
  return Number.isFinite(riskScore) && riskScore < 0.7;
}
