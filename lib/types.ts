export type Agent = "intake" | "qualifier" | "invoicer" | "system" | string;

export type Decision =
  | "auto_proceed"
  | "escalate"
  | "blocked"
  | "approved"
  | "rejected"
  | null;

export type Status =
  | "processing"
  | "done"
  | "awaiting_approval"
  | "blocked"
  | "killed";

export interface AgentEvent {
  id: string;
  created_at: string;
  lead_id: string | null;
  agent: Agent;
  action: string;
  input: Record<string, unknown> | null;
  confidence: number | null;
  decision: Decision;
  status: Status;
  reason: string | null;
}

export interface Lead {
  id: string;
  created_at: string;
  source: string;
  contact: string;
  raw_message: string;
  amount: number | null;
  stage: "intake" | "qualified" | "escalated" | "invoiced" | "blocked";
}

export interface Control {
  paused: boolean;
  updated_at: string;
}

export interface Stats {
  handled_autonomously: number; // auto_proceed decisions
  needed_human: number; // escalate + blocked awaiting approval
  blocked: number; // guardrail catches
  total_events: number;
}
