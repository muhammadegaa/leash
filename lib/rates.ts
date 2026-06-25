// DrainFlow's published deposit rate card. Every amount the agent charges maps to
// one of these named rates, so nothing is a made-up number.
export const RATE_CARD: Record<string, { amount: number; label: string }> = {
  emergency: { amount: 180, label: "Emergency call-out deposit" },
  install: { amount: 450, label: "Installation deposit" },
  repair: { amount: 110, label: "Standard repair deposit" },
  small_repair: { amount: 80, label: "Minor repair deposit" },
  inquiry: { amount: 60, label: "Assessment visit deposit" },
};

export function rate(category: string) {
  return RATE_CARD[category] ?? RATE_CARD.inquiry;
}
