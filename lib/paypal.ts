// Invoicer backend. Creates a PayPal SANDBOX order when credentials are present,
// otherwise returns a clearly-labelled mock so the loop still closes.

const BASE = "https://api-m.sandbox.paypal.com";

export interface InvoiceResult {
  id: string;
  status: string;
  amount: number;
  mock: boolean;
  link: string | null;
}

async function token(): Promise<string | null> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) return null;
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.access_token as string;
}

export async function createInvoice(amount: number, ref: string): Promise<InvoiceResult> {
  const t = await token();
  if (!t) {
    return { id: `MOCK-${ref.slice(0, 8)}`, status: "CREATED (mock)", amount, mock: true, link: null };
  }
  const r = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        { reference_id: ref, amount: { currency_code: "GBP", value: amount.toFixed(2) }, description: "DrainFlow plumbing deposit" },
      ],
    }),
  });
  const j = await r.json();
  if (!r.ok) {
    return { id: `MOCK-${ref.slice(0, 8)}`, status: `paypal_error_${r.status}`, amount, mock: true, link: null };
  }
  const link = (j.links?.find((l: { rel: string; href: string }) => l.rel === "approve")?.href as string) ?? null;
  return { id: j.id, status: j.status, amount, mock: false, link };
}
