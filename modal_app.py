"""
Handoff unattended runner (Checkpoint 5).

Runs on Modal on a fixed schedule with no human present. Every cycle it asks the
deployed Handoff app to take one inbound lead through intake, qualify, invoice.
The app enforces the kill switch, so if a human has paused the system this loop
produces 'halted' events instead of acting. That is the proof it ran on its own
while no one was touching it, and that the off switch holds even unattended.

Deploy:
    pip install modal
    modal token set --token-id $MODAL_TOKEN_ID --token-secret $MODAL_TOKEN_SECRET
    modal deploy modal_app.py

Set HANDOFF_URL to your public deployment (Vercel), e.g. https://handoff.vercel.app
"""
import os
import urllib.request
import json

import modal

app = modal.App("handoff-unattended")

image = modal.Image.debian_slim().pip_install([])

HANDOFF_URL = os.environ.get("HANDOFF_URL", "https://handoff.vercel.app")


def _post(path: str, body: dict) -> dict:
    req = urllib.request.Request(
        f"{HANDOFF_URL}{path}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


@app.function(schedule=modal.Period(minutes=3), image=image)
def tick():
    """One unattended cycle: inject a lead, let the agents decide."""
    res = _post("/api/simulate", {"count": 1})
    print(f"[handoff] unattended tick -> {res}")
    return res


@app.local_entrypoint()
def main():
    """Run one cycle locally to verify wiring before deploying the schedule."""
    print(tick.local())
