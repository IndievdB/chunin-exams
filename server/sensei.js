/* Ask Sensei: a tiny proxy that holds the Anthropic API key and answers the dojo's chat.
   POST /sensei  { idToken, teacher, problem: {title, task, examples, prelude, solution, hint},
                   code, output, messages: [{role: "user"|"assistant", content}] }
   -> { reply }
   Env: ANTHROPIC_API_KEY (required), FIREBASE_WEB_API_KEY (verifies the caller's Firebase sign-in;
        leave unset to allow unauthenticated calls, e.g. local development), ALLOWED_ORIGIN
        (CORS; default "*"), PORT (default 8787), MODEL (default claude-opus-5-5). */
"use strict";
const http = require("http");
const Anthropic = require("@anthropic-ai/sdk");
const { TEACHERS, RULES } = require("./teachers");

const client = new Anthropic();
const MODEL = process.env.MODEL || "claude-opus-5-5";
const ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const PORT = +(process.env.PORT || 8787);
const FIREBASE_KEY = process.env.FIREBASE_WEB_API_KEY || "";
const LIMIT = { calls: 40, perMs: 10 * 60 * 1000 };
const buckets = new Map();

function limited(uid) {
  const now = Date.now();
  const b = buckets.get(uid) || [];
  const recent = b.filter((t) => now - t < LIMIT.perMs);
  recent.push(now); buckets.set(uid, recent);
  return recent.length > LIMIT.calls;
}

async function verify(idToken) {
  if (!FIREBASE_KEY) return "anonymous";
  if (!idToken) return null;
  const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_KEY, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken })
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data.users && data.users[0] ? data.users[0].localId : null;
}

function clip(s, n) { s = String(s == null ? "" : s); return s.length > n ? s.slice(0, n) + "\n…(truncated)" : s; }

function buildSystem(teacher, problem, code, output) {
  const t = TEACHERS[teacher] || TEACHERS.kakashi;
  const p = problem || {};
  return [
    t.voice,
    RULES,
    "## The problem the student is working on",
    "Title: " + clip(p.title, 200),
    "Task: " + clip(p.task, 2000),
    p.examples && p.examples.length ? "Examples:\n" + clip(p.examples.join("\n---\n"), 2000) : "",
    p.prelude ? "Code provided to the student (already defined, they must not rewrite it):\n```python\n" + clip(p.prelude, 3000) + "\n```" : "",
    p.hint ? "Official hint: " + clip(p.hint, 600) : "",
    "Reference solution (for your eyes; follow the rules above about revealing it):\n```python\n" + clip(p.solution, 4000) + "\n```",
    "## The student's current code\n```python\n" + (clip(code, 6000) || "(empty)") + "\n```",
    output ? "## What their last run printed (including any error or verdict)\n```\n" + clip(output, 3000) + "\n```" : ""
  ].filter(Boolean).join("\n\n");
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": ORIGIN, "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" });
  res.end(JSON.stringify(body));
}

http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET") return send(res, 200, { ok: true, teachers: Object.keys(TEACHERS) });
  if (req.method !== "POST" || req.url.replace(/\/+$/, "") !== "/sensei") return send(res, 404, { error: "not found" });
  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > 200000) req.destroy(); });
  req.on("end", async () => {
    let body;
    try { body = JSON.parse(raw); } catch (e) { return send(res, 400, { error: "bad json" }); }
    const uid = await verify(body.idToken).catch(() => null);
    if (!uid) return send(res, 401, { error: "Sign in to talk to a sensei." });
    if (limited(uid)) return send(res, 429, { error: "Even a sensei needs a break. Try again in a few minutes." });
    const history = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-24)
      .map((m) => ({ role: m.role, content: clip(m.content, 4000) }));
    if (!history.length || history[history.length - 1].role !== "user") return send(res, 400, { error: "Ask something first." });
    // the API needs alternating turns; merge any accidental doubles
    const messages = [];
    for (const m of history) {
      if (messages.length && messages[messages.length - 1].role === m.role) messages[messages.length - 1].content += "\n\n" + m.content;
      else messages.push(m);
    }
    if (messages[0].role !== "user") messages.shift();
    try {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 1500,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium" },
        system: buildSystem(body.teacher, body.problem, body.code, body.output),
        messages
      });
      if (response.stop_reason === "refusal") return send(res, 200, { reply: "…Let's keep this to the training. Ask me about the problem." });
      const reply = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      send(res, 200, { reply: reply || "…" });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return send(res, 503, { error: "The sensei is swamped with students. Try again shortly." });
      if (e instanceof Anthropic.AuthenticationError) return send(res, 500, { error: "The server's API key is missing or invalid." });
      if (e instanceof Anthropic.APIError) return send(res, 502, { error: "The sensei couldn't answer (" + e.status + ")." });
      send(res, 500, { error: "The sensei couldn't answer." });
    }
  });
}).listen(PORT, () => console.log("Ask Sensei listening on :" + PORT + " (model " + MODEL + (FIREBASE_KEY ? ", Firebase auth on" : ", no auth") + ")"));
