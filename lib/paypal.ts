// Invoicer backend. Creates a real PayPal SANDBOX invoice via the Invoicing API
// so it shows up in the merchant's Invoicing tab, then sends it. Falls back to a
// clearly-labelled mock if credentials are missing so the loop still closes.

const BASE = "https://api-m.sandbox.paypal.com";
const RECIPIENT = "sb-zukhn51323400@personal.example.com"; // sandbox buyer

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

  // 1. Create a draft invoice (this is what appears in the Invoicing tab).
  const create = await fetch(`${BASE}/v2/invoicing/invoices`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      detail: { currency_code: "GBP", note: "DrainFlow emergency plumbing deposit", reference: ref },
      invoicer: { name: { business_name: "DrainFlow Plumbing" } },
      primary_recipients: [{ billing_info: { email_address: RECIPIENT } }],
      items: [
        { name: "Plumbing job deposit", quantity: "1", unit_amount: { currency_code: "GBP", value: amount.toFixed(2) } },
      ],
    }),
  });
  const cj = await create.json().catch(() => ({}));
  if (!create.ok) {
    return { id: `MOCK-${ref.slice(0, 8)}`, status: `paypal_error_${create.status}`, amount, mock: true, link: null };
  }
  const id: string = cj.id || String(cj.href || "").split("/").pop() || `INV-${ref.slice(0, 8)}`;

  // 2. Send it so it leaves Draft and shows as a real sent invoice.
  let status = "DRAFT";
  try {
    const send = await fetch(`${BASE}/v2/invoicing/invoices/${id}/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ send_to_recipient: true }),
    });
    status = send.ok ? "SENT" : "DRAFT";
  } catch {
    // keep as draft; it still exists in the Invoicing tab and is fetchable by id.
  }

  return { id, status, amount, mock: false, link: `${BASE}/v2/invoicing/invoices/${id}` };
}
