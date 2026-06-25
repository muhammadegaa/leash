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

export interface InvoiceInput {
  amount: number;
  ref: string; // lead id
  business?: string; // the agency name the user configured
  itemLabel?: string; // named rate line, e.g. "Emergency call-out deposit"
  request?: string; // the customer's actual inbound message
  customer?: string; // the customer's contact (phone / name)
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

export async function createInvoice(input: InvoiceInput): Promise<InvoiceResult> {
  const { amount, ref } = input;
  const business = (input.business || "DrainFlow Plumbing").slice(0, 120);
  const itemLabel = (input.itemLabel || "Plumbing job deposit").slice(0, 200);
  const request = (input.request || "Inbound plumbing job").slice(0, 400);
  const customer = (input.customer || "WhatsApp customer").slice(0, 80);

  const t = await token();
  if (!t) {
    return { id: `MOCK-${ref.slice(0, 8)}`, status: "CREATED (mock)", amount, mock: true, link: null };
  }

  // 1. Create a draft invoice, built from the actual lead (this shows in the Invoicing tab).
  const create = await fetch(`${BASE}/v2/invoicing/invoices`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      detail: {
        currency_code: "GBP",
        reference: ref,
        note: `${business} — ${itemLabel}. Job: "${request}". Customer: ${customer}.`,
        memo: `Lead ${ref}`,
      },
      invoicer: { name: { business_name: business } },
      primary_recipients: [
        { billing_info: { email_address: RECIPIENT, business_name: customer, additional_info_value: `Lead via WhatsApp` } },
      ],
      items: [
        {
          name: itemLabel,
          description: request,
          quantity: "1",
          unit_amount: { currency_code: "GBP", value: amount.toFixed(2) },
        },
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

  // The real, human-viewable, payable invoice page (what the customer would open).
  const viewId = id.replace(/-/g, "").replace(/^INV2/, "");
  const link = `https://www.sandbox.paypal.com/invoice/p/#${viewId}`;
  return { id, status, amount, mock: false, link };
}
