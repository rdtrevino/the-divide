#!/usr/bin/env python3
"""Spend ledger and budget gate for the routing kit. Standard library only.

Modes:
  ledger.py hook              Read a Claude Code hook event on stdin.
                                PreToolUse (Agent, Task, Workflow): spend notices and the Fable gate;
                                spend notices. It never blocks on spend. Reads spend in memory; writes nothing in the repo.
                                Other events are ignored.
                              There is deliberately no Stop hook: rewriting the ledger at the end
                              of every turn leaves the working tree dirty after each commit.
  ledger.py scan [DIR]        Rebuild ledger lines from transcripts (default: ~/.claude/projects).
  ledger.py report [--all]    Summarise spend by tier and outcome (default: latest session).
  ledger.py session-start     Read a SessionStart event: warn if the lead is on Fable or kit agents are missing.
  ledger.py start-run NAME [--session SID]
                              Mark the start of a run for one session (default: the latest).
                              Spend before the mark is excluded; other sessions ignore the mark.
                              There is no spend ceiling: for headless runs use claude -p --max-budget-usd N.

The ledger is one JSON line per task in <ledger dir>/<session id>.jsonl. Each file is rewritten
from the transcripts on every scan, so runs are idempotent. Costs are estimates from list prices.
"""
import glob, json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(HERE)                      # the .claude directory
ROOT = os.path.dirname(KIT)                      # the repository
LEDGER_DIR = os.environ.get("KIT_LEDGER_DIR") or os.path.join(ROOT, "ledger")
FAMILIES = ("fable", "opus", "sonnet", "haiku")
JUSTIFY = re.compile(r"^FABLE-JUSTIFICATION:\s*(synthesis|novel-design|failed-twice|irreversible)\b", re.M)
TASK = re.compile(r"TASK:\s*([^|\n]+)\|\s*ROUTE:\s*([^|\n]+)\|\s*ESCALATED-FROM:\s*([^\n|]+)")
JUSTIFY_ANY = re.compile(JUSTIFY.pattern.lstrip("^"))   # in a script or JSON args the line may sit behind a comment or quote
FABLE_SCRIPT = re.compile(r"model\s*:\s*['\"][^'\"]*fable", re.I)
STATUS = re.compile(r"STATUS:\s*(done|blocked|failed)\b")


def budget():
    with open(os.path.join(KIT, "budget.json")) as f:
        return json.load(f)


def family(model):
    model = (model or "").lower()
    return next((f for f in FAMILIES if f in model), "unknown")


def text_of(content):
    """Text of a message, including the inputs of tool calls (a subagent's final report is one)."""
    if isinstance(content, str):
        return content
    out = []
    for b in content if isinstance(content, list) else []:
        if not isinstance(b, dict):
            continue
        if b.get("type") == "text":
            out.append(b.get("text", ""))
        elif b.get("type") == "tool_use" and "STATUS:" in json.dumps(b.get("input", "")):
            out.append(json.dumps(b.get("input")))
    return "\n".join(out)


def resume_text(content):
    """The typed text of a user message, or "" for a tool-result-only message."""
    if isinstance(content, str):
        return content
    return "\n".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text") \
        if isinstance(content, list) else ""


def read_transcript(path, prices=None):
    """Return usage totals for one transcript file. The last line seen for a message id wins."""
    per_msg, first_user, users, last_assistant, first_ts, last_ts, session = {}, "", 0, "", None, None, None
    resumes, last_ctx = 0, 0
    try:
        lines = open(path, errors="replace")
    except OSError:
        return None
    with lines:
        for line in lines:
            try:
                d = json.loads(line)
            except ValueError:
                continue
            msg = d.get("message")
            if not isinstance(msg, dict):
                continue
            session = session or d.get("sessionId")
            ts = d.get("timestamp")
            first_ts, last_ts = first_ts or ts, ts or last_ts
            role = msg.get("role")
            if role == "user" and users < 3 and not d.get("isMeta"):
                users += 1                                # a workflow agent's brief is its second message
                first_user += "\n" + text_of(msg.get("content"))
            if role == "user" and per_msg:
                t = resume_text(msg.get("content")).strip()   # a SendMessage resume arrives as isMeta
                if t and (not d.get("isMeta") or t.startswith("The coordinator sent a message")) \
                        and not t.startswith(("<system-reminder>", "[Request interrupted")):
                    resumes += 1
            if role == "assistant":
                t = text_of(msg.get("content"))
                last_assistant = t or last_assistant
                if msg.get("usage") and msg.get("id"):
                    per_msg[msg["id"]] = (msg.get("model"), msg["usage"])
                    u = msg["usage"]
                    last_ctx = sum(u.get(k, 0) or 0 for k in ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"))
    tok = collections.Counter()
    models = collections.Counter()
    prices = prices or budget()["prices_per_mtok"]
    usd = 0.0
    for model, u in per_msg.values():
        models[model] += 1
        total_cw = u.get("cache_creation_input_tokens", 0) or 0
        split = u.get("cache_creation") if isinstance(u.get("cache_creation"), dict) else {}
        if "ephemeral_1h_input_tokens" in split or "ephemeral_5m_input_tokens" in split:
            cw1h = split.get("ephemeral_1h_input_tokens", 0) or 0
            cw5m = split.get("ephemeral_5m_input_tokens", 0) or 0
        else:
            cw1h, cw5m = 0, total_cw                   # no split: price everything at the 5-minute rate
        usd += cost({"input": u.get("input_tokens", 0) or 0, "output": u.get("output_tokens", 0) or 0,
                     "cache_read": u.get("cache_read_input_tokens", 0) or 0,
                     "cache_write": cw5m, "cache_write_1h": cw1h}, model, prices)
        tok["input"] += u.get("input_tokens", 0) or 0
        tok["output"] += u.get("output_tokens", 0) or 0
        tok["cache_read"] += u.get("cache_read_input_tokens", 0) or 0
        tok["cache_write"] += u.get("cache_creation_input_tokens", 0) or 0
    model = models.most_common(1)[0][0] if models else None
    return {"session": session, "model": model, "turns": len(per_msg), "tokens": dict(tok),
            "usd": round(usd, 4), "resumes": resumes, "last_context": last_ctx, "first_user": first_user, "last_assistant": last_assistant, "start": first_ts, "end": last_ts}


def cost(tokens, model, prices):
    p = prices.get(family(model))
    if not p:
        return 0.0
    return round(sum(tokens.get(k, 0) * p[k] for k in p) / 1e6, 4)


def session_lines(main_path, prices):
    """Ledger lines for one session: the lead plus every subagent and workflow agent under it."""
    out = []
    main = read_transcript(main_path, prices)
    if not main or not main["turns"]:
        return None, out
    sid = main["session"] or os.path.basename(main_path)[:-6]
    out.append({"session": sid, "task": "lead", "agent": "lead", "model": main["model"], "route": "", "escalated_from": "",
                "status": "", "turns": main["turns"], "tokens": main["tokens"],
                "usd": main["usd"], "resumes": main["resumes"], "last_context": main["last_context"], "start": main["start"], "end": main["end"]})
    side = os.path.join(os.path.dirname(main_path), os.path.basename(main_path)[:-6])
    for path in sorted(glob.glob(os.path.join(side, "**", "*.jsonl"), recursive=True)):
        if os.path.basename(path) == "journal.jsonl":
            continue
        t = read_transcript(path, prices)
        if not t or not t["turns"]:
            continue
        meta = {}
        try:
            with open(path[:-6] + ".meta.json") as f:
                meta = json.load(f)
        except (OSError, ValueError):
            pass
        m = TASK.search(t["first_user"] or "")
        s = STATUS.search(t["last_assistant"] or "")
        out.append({"session": sid, "task": (m.group(1).strip() if m else meta.get("description") or os.path.basename(path)[:-6]),
                    "agent": meta.get("agentType") or "workflow-agent", "model": t["model"],
                    "route": m.group(2).strip() if m else "", "escalated_from": m.group(3).strip() if m else "",
                    "status": s.group(1) if s else "", "turns": t["turns"], "tokens": t["tokens"],
                    "usd": t["usd"], "resumes": t["resumes"], "start": t["start"], "end": t["end"]})
    return sid, out


def scan(base=None, only_session=None):
    prices = budget()["prices_per_mtok"]
    base = base or os.path.expanduser("~/.claude/projects")
    os.makedirs(LEDGER_DIR, exist_ok=True)
    written = []
    for main_path in glob.glob(os.path.join(base, "*", "*.jsonl")):
        if only_session and only_session not in main_path:
            continue
        sid, lines = session_lines(main_path, prices)
        if not sid:
            continue
        with open(os.path.join(LEDGER_DIR, sid + ".jsonl"), "w") as f:
            for line in lines:
                f.write(json.dumps(line, sort_keys=True) + "\n")
        written.append((sid, len(lines)))
    return written


def load(session=None):
    files = glob.glob(os.path.join(LEDGER_DIR, "*.jsonl"))
    if session:
        files = [f for f in files if session in f]
    per_file = []
    for f in files:
        with open(f) as fh:
            per_file.append([json.loads(l) for l in fh if l.strip()])
    if not session and per_file:                  # the latest session is the one that ended last, not the last touched file
        per_file = [max(per_file, key=lambda rs: max((r.get("end") or "" for r in rs), default=""))]
    return [r for rs in per_file for r in rs]


def run_mark():
    try:
        with open(os.path.join(LEDGER_DIR, "run.json")) as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"name": "", "before": {}}


def save_mark(mark):
    with open(os.path.join(LEDGER_DIR, "run.json"), "w") as f:
        json.dump(mark, f, indent=1, sort_keys=True)


def start_run(name, session=None):
    scan()
    rows = load(session)
    mark = {"name": name, "session": rows[0]["session"] if rows else (session or ""),
            "before": {f"{r['agent']}|{r['task']}": r["usd"] for r in rows}}
    save_mark(mark)
    print(f"run '{name}' started; ${sum(mark['before'].values()):.2f} of earlier spend excluded")


def totals(rows, session=None):
    """Spend in the current run: lead and subagents separately, net of spend before the run mark.
    A mark belongs to one session; for any other session it is ignored."""
    mark = run_mark()
    before = mark.get("before", {}) if session and mark.get("session") == session else {}
    sub, lead = collections.defaultdict(float), 0.0
    for r in rows:
        net = max(0.0, r["usd"] - before.get(f"{r['agent']}|{r['task']}", 0.0))
        if r["agent"] == "lead":
            lead += net
        else:
            sub[family(r["model"])] += net
    return sub, lead


def report(all_sessions=False):
    try:
        scan()                                    # refresh from transcripts so the figures are current
    except Exception as e:
        sys.stderr.write(f"[kit ledger] scan failed: {e}\n")
    rows = []
    if all_sessions:
        for f in glob.glob(os.path.join(LEDGER_DIR, "*.jsonl")):
            with open(f) as fh:
                rows += [json.loads(l) for l in fh if l.strip()]
    else:
        rows = load()
    if not rows:
        print("ledger is empty; run: ledger.py scan")
        return
    groups = collections.defaultdict(lambda: collections.Counter())
    for r in rows:
        g = groups[(r["agent"], family(r["model"]))]
        g["tasks"] += 1
        g["usd"] += r["usd"]
        g["out"] += r["tokens"].get("output", 0)
        g["in"] += sum(r["tokens"].get(k, 0) for k in ("input", "cache_read", "cache_write"))
        g[r["status"] or "no-status"] += 1
    print(f"{'agent':<22}{'tier':<8}{'tasks':>6}{'input tok':>13}{'output tok':>12}{'est usd':>9}  outcomes")
    total = 0.0
    for (agent, fam), g in sorted(groups.items(), key=lambda kv: -kv[1]["usd"]):
        total += g["usd"]
        outcomes = ", ".join(f"{k} {int(g[k])}" for k in ("done", "blocked", "failed", "no-status") if g[k])
        print(f"{agent:<22}{fam:<8}{int(g['tasks']):>6}{int(g['in']):>13,}{int(g['out']):>12,}{g['usd']:>9.2f}  {outcomes}")
    b = budget()
    rsid = rows[0]["session"] if not all_sessions else None
    sub, lead = totals(rows, rsid)
    print(f"{'session total':<49}{'':>12}{total:>9.2f}")
    leads = [r for r in rows if r["agent"] == "lead"]
    if leads:
        ctx = sum(sum(r["tokens"].get(k, 0) for k in ("input", "cache_read", "cache_write")) for r in leads)
        lusd = sum(r["usd"] for r in leads)
        print(f"lead: ${lusd:.2f} of ${total:.2f} ({100 * lusd / total if total else 0:.0f}%), "
              f"average context {ctx / max(1, sum(r['turns'] for r in leads)) / 1000:.0f}k tokens per call")
    if not all_sessions:
        mark = run_mark() if run_mark().get("session") == rsid else {}
        run_total = sum(sub.values()) + lead
        share = f"{100 * lead / run_total:.0f}%" if run_total else "n/a"
        print(f"current run '{mark.get('name', '')}': ${run_total:.2f}; lead ${lead:.2f} ({share} of the run); "
              + "; ".join(f"{k} ${v:.2f}" for k, v in sorted(sub.items())))
    subs = [r for r in rows if r["agent"] != "lead"]
    esc = [r for r in subs if r.get("escalated_from") not in ("", "none", None)]
    first = [r for r in subs if r["status"] == "done" and not r.get("resumes") and r not in esc]
    late = [r for r in subs if r["status"] == "done" and r.get("resumes")]
    print(f"first-pass done: {len(first)} of {len(subs)} subagent tasks; done after resume: {len(late)}; "
          f"escalated: {len(esc)} of {len(subs)}")


def deny(reason):
    sys.stderr.write("[kit budget gate] " + reason + "\n")
    sys.exit(2)                                   # exit code 2 blocks the tool call


def hook():
    try:
        ev = json.load(sys.stdin)
    except ValueError:
        return
    name = ev.get("hook_event_name")
    sid = ev.get("session_id") or ""
    if os.environ.get("KIT_HOOK_DEBUG"):
        os.makedirs(LEDGER_DIR, exist_ok=True)
        with open(os.path.join(LEDGER_DIR, "hook-events.log"), "a") as f:
            f.write(f"{name} {ev.get('tool_name', '')} {ev.get('agent_type', '')}\n")
    tpath = ev.get("transcript_path")
    # Hooks never write inside the repository: the ledger files change only when someone runs
    # `scan` or `report` (typically just before a commit), so the working tree stays clean.
    if name != "PreToolUse" or ev.get("tool_name") not in ("Agent", "Task", "Workflow"):
        return
    rows = []
    if tpath and os.path.exists(tpath):
        try:
            rows = session_lines(tpath, budget()["prices_per_mtok"])[1]
        except Exception as e:                    # spend tracking must never break a session
            sys.stderr.write(f"[kit ledger] could not read spend: {e}\n")
    b = budget()
    mark = run_mark()
    state_path = os.path.join(os.path.expanduser("~"), ".claude", "kit-state", (sid or "unknown") + ".json")
    try:
        state = json.load(open(state_path))
    except (OSError, ValueError):
        state = {}
    spent, lead = totals(rows, sid)
    mark = mark if mark.get("session") == sid else {}
    total = sum(spent.values()) + lead
    ti = ev.get("tool_input") or {}
    # 1. The Fable gate is always on: a consult must say why it is justified.
    script = ti.get("script") or ""
    if not script and ti.get("scriptPath"):
        try:
            script = open(ti["scriptPath"], errors="replace").read()
        except OSError:
            pass
    if ev.get("tool_name") == "Workflow":
        wants_fable = bool(FABLE_SCRIPT.search(script))
        pitch = script + "\n" + json.dumps(ti.get("args") or "")
    else:
        wants_fable = "fable" in (ti.get("model") or "").lower() or ti.get("subagent_type") == "sage"
        pitch = ti.get("prompt") or ""
    if wants_fable and not (JUSTIFY_ANY if ev.get("tool_name") == "Workflow" else JUSTIFY).search(pitch):
        deny("Fable call without a 'FABLE-JUSTIFICATION: synthesis | novel-design | failed-twice | irreversible' line.")
    # 2. Spend is never blocked. Post a notice to the lead at each step, once.
    step = b.get("notice_every_usd") or 25
    notes = []
    if int(total // step) * step > (state.get("notified_usd") or 0):
        state["notified_usd"] = int(total // step) * step
        fam = ", ".join(f"{k} ${v:.2f}" for k, v in sorted(spent.items()))
        notes.append(f"Spend notice: this run has used ${total:.2f} (lead ${lead:.2f}; {fam}). Nothing is blocked. "
                     "Check that the tier mix still fits the work, and mention the figure in your next update to the owner.")
    if rows and family(rows[0]["model"]) == "fable" and not state.get("lead_fable_noted"):
        state["lead_fable_noted"] = True
        notes.append("The lead is running on Fable. The kit expects Opus at medium effort for the lead; "
                     "switch with /model opus unless this session is design-only.")
    steps = b.get("lead_context_notice_k") or [150, 100]
    ctx_k = (rows[0].get("last_context") or 0) / 1000 if rows else 0
    level = 0 if ctx_k < steps[0] else steps[0] + int((ctx_k - steps[0]) // steps[1]) * steps[1]
    if level > (state.get("context_noted_k") or 0):
        state["context_noted_k"] = level
        fam = family(rows[0]["model"])
        price = (b["prices_per_mtok"].get(fam) or {}).get("cache_read", 0)
        notes.append(f"Lead context is {ctx_k:.0f}k tokens; each call re-reads it (about ${ctx_k * 1000 * price / 1e6:.2f} per call at "
                     f"{fam} cache-read price). Finish the current step, then hand off: write docs/HANDOFF.md per the route skill's references/handoff.md and continue in a fresh session.")
    consults = sum(1 for r in rows if r["agent"] != "lead" and family(r["model"]) == "fable")
    soft = b.get("fable_consults_notice")
    if wants_fable and soft and consults >= soft:
        notes.append(f"This would be Fable consult {consults + 1} in this session. Confirm a cheaper tier with a better brief would not do.")
    if notes:
        try:                                      # notice state lives outside the repository
            os.makedirs(os.path.dirname(state_path), exist_ok=True)
            json.dump(state, open(state_path, "w"))
        except OSError:
            pass
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": "[kit ledger] " + " ".join(notes)}}))


AGENTS = ("extractor", "builder", "engineer", "reviewer", "sage")


def session_start():
    """SessionStart: say nothing when all is well; never fail a session."""
    try:
        ev = json.load(sys.stdin)
        notes = []
        if "fable" in (ev.get("model") or "").lower():
            notes.append("The lead is on Fable. The kit expects Opus at medium for the lead; use /model opus unless this is a design-only session.")
        project = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
        if os.path.exists(os.path.join(project, "docs", "HANDOFF.md")):
            notes.append(f"{os.path.basename(project)} has an open handoff at docs/HANDOFF.md. It applies to this repository only; "
                         "never follow another repository's handoff, and never choose between handoffs by date.")
        dirs = [os.path.join(project, ".claude", "agents"),
                os.path.join(os.path.expanduser("~"), ".claude", "agents")]
        missing = [a for a in AGENTS if not any(os.path.exists(os.path.join(d, a + ".md")) for d in dirs)]
        if missing:
            notes.append(f"Jumpstart kit incomplete: missing agents {', '.join(missing)}. Run scripts/install.sh.")
        if notes:
            print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": " ".join(notes)}}))
    except Exception:
        pass


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "report"
    if mode == "hook":
        hook()
    elif mode == "session-start":
        session_start()
    elif mode == "start-run":
        rest = sys.argv[2:]
        if "--ceiling" in rest or "--stop" in rest:
            print("The hard spend ceiling was removed; spend is reported, never blocked. "
                  "For a headless run use: claude -p --max-budget-usd N")
            sys.exit(2)
        sess = rest[rest.index("--session") + 1] if "--session" in rest else None
        names = [a for i, a in enumerate(rest) if not a.startswith("--") and (i == 0 or rest[i - 1] != "--session")]
        start_run(names[0] if names else "run", sess)
    elif mode == "scan":
        for sid, n in scan(sys.argv[2] if len(sys.argv) > 2 else None):
            print(f"{sid}: {n} lines")
    else:
        report("--all" in sys.argv)
