// The guardrail. A malicious / out-of-scope instruction is CAUGHT here and
// routed to the human queue rather than acted on. This is the system-level
// check the Replit agent didn't have — it is code, not a polite prompt.

const PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /ignore\s+(all\s+|the\s+|your\s+|my\s+|previous\s+|prior\s+|above\s+)*(instructions|prompts|rules|guardrails)/i, reason: "Prompt-injection attempt: tries to override the agent's instructions." },
  { re: /(disregard|forget|override|bypass)\s+(your|the|all|my)?\s*(rules|instructions|guardrails|prompt)/i, reason: "Prompt-injection attempt: asks the agent to disregard its rules." },
  { re: /(delete|drop|wipe|truncate|erase)\s+(the\s+)?(database|table|production|all data|everything|users?)/i, reason: "Destructive instruction: requests deletion of data/database." },
  { re: /\bDROP\s+TABLE\b/i, reason: "Destructive SQL detected in the lead text." },
  { re: /(transfer|send|wire|pay\s?out|refund|pay)\s+(all\b|every\b|everything\b|[£$€]?\s?\d[\d,]{2,})/i, reason: "Financial-manipulation attempt: requests a large or blanket payout." },
  { re: /(send|email|leak|export)\s+(me\s+)?(all\s+)?(customer|client|user)\s+(data|details|records|emails|cards)/i, reason: "Data-exfiltration attempt: requests bulk customer data." },
  { re: /you are now|act as (an?|the)|new system prompt|developer mode/i, reason: "Role-override / jailbreak attempt." },
  { re: /reveal (your )?(system )?(prompt|instructions|api key|secret)/i, reason: "Attempts to extract secrets or the system prompt." },
];

export interface GuardrailResult {
  flagged: boolean;
  reason: string | null;
}

export function guardrail(text: string): GuardrailResult {
  for (const p of PATTERNS) {
    if (p.re.test(text)) return { flagged: true, reason: p.reason };
  }
  return { flagged: false, reason: null };
}
