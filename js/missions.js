/* Missions: Kakashi's briefing at the Valley of the End. Teaches small, real Python servers
   (FastAPI + Pydantic + SQLite) that are checked inside the browser: the student's app is
   driven through ASGI directly, so uvicorn isn't needed until the final mission.
   Admin-only while the curriculum settles (menu.js gates it). window.Missions = Dojo(...). */
(function () {
  "use strict";
  var WHEELS = ["sniffio-1.3.1-py3-none-any.whl", "idna-3.20-py3-none-any.whl", "anyio-4.4.0-py3-none-any.whl", "starlette-0.38.6-py3-none-any.whl", "fastapi-0.112.4-py3-none-any.whl"];

  /* Runs before every mission, in the student's namespace. Gives the checker `expect()` and
     makes FastAPI work without threads (the browser has none). Deletes old .db files so each run starts clean. */
  var HARNESS = [
    "import json as _json, os as _os, glob as _glob",
    "for _f in _glob.glob('*.db'):",
    "    try: _os.remove(_f)",
    "    except OSError: pass",
    "import starlette.concurrency, starlette.routing, fastapi.routing, fastapi.dependencies.utils",
    "async def _inline(fn, *a, **k): return fn(*a, **k)",
    "for _m in (starlette.concurrency, starlette.routing, fastapi.routing, fastapi.dependencies.utils): _m.run_in_threadpool = _inline",
    "_log = []",
    "async def call(method, path, body=None):",
    "    app = globals().get('app')",
    "    if app is None: raise AssertionError('I cannot find your server. Create it with: app = FastAPI()')",
    "    route, _, query = path.partition('?')",
    "    scope = {'type': 'http', 'asgi': {'version': '3.0'}, 'http_version': '1.1', 'method': method, 'scheme': 'http', 'path': route, 'raw_path': route.encode(),",
    "             'query_string': query.encode(), 'root_path': '', 'headers': [(b'content-type', b'application/json'), (b'host', b'localhost')], 'client': ('127.0.0.1', 1), 'server': ('localhost', 8000)}",
    "    payload = _json.dumps(body).encode() if body is not None else b''",
    "    sent = [False]",
    "    async def receive():",
    "        if sent[0]: return {'type': 'http.disconnect'}",
    "        sent[0] = True; return {'type': 'http.request', 'body': payload, 'more_body': False}",
    "    status, chunks = [None], []",
    "    async def send(msg):",
    "        if msg['type'] == 'http.response.start': status[0] = msg['status']",
    "        elif msg['type'] == 'http.response.body': chunks.append(msg.get('body', b''))",
    "    await app(scope, receive, send)",
    "    raw = b''.join(chunks).decode()",
    "    try: data = _json.loads(raw) if raw else None",
    "    except ValueError: data = raw",
    "    return status[0], data",
    "async def expect(method, path, body=None, status=None, where=None, note=''):",
    "    try:",
    "        st, data = await call(method, path, body)",
    "    except AssertionError:",
    "        raise",
    "    except Exception as e:",
    "        _log.append({'method': method, 'path': path, 'body': body, 'status': None, 'response': 'your server raised ' + type(e).__name__ + ': ' + str(e), 'ok': False, 'note': 'the server crashed while handling this request'})",
    "        raise AssertionError(method + ' ' + path + ' crashed inside your server: ' + type(e).__name__ + ': ' + str(e))",
    "    ok, why = True, ''",
    "    if status is not None and st != status: ok, why = False, 'expected status ' + str(status) + ', got ' + str(st)",
    "    elif where is not None:",
    "        try:",
    "            if not where(data): ok, why = False, (note or 'the response is not what the mission asked for')",
    "        except Exception as e: ok, why = False, 'the response has the wrong shape (' + type(e).__name__ + ')'",
    "    _log.append({'method': method, 'path': path, 'body': body, 'status': st, 'response': data, 'ok': ok, 'note': why if not ok else note})",
    "    if not ok: raise AssertionError(method + ' ' + path + ': ' + why)",
    "    return data",
    ""
  ].join("\n");

  /* ---------- the growing server, mission by mission ---------- */
  var SOL_D1 = 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef home():\n    return {"village": "Konoha", "status": "ready"}\n';
  var SOL_D2 = SOL_D1 + '\n@app.get("/missions/{mission_id}")\ndef get_mission(mission_id: int):\n    return {"id": mission_id, "title": "Mission " + str(mission_id)}\n\n@app.get("/missions")\ndef list_missions(rank: str = "D"):\n    return {"rank": rank, "missions": []}\n';
  var SOL_D3 = 'from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass MissionIn(BaseModel):\n    title: str\n    rank: str = "D"\n    done: bool = False\n\n@app.get("/")\ndef home():\n    return {"village": "Konoha", "status": "ready"}\n\n@app.get("/missions/{mission_id}")\ndef get_mission(mission_id: int):\n    return {"id": mission_id, "title": "Mission " + str(mission_id)}\n\n@app.get("/missions")\ndef list_missions(rank: str = "D"):\n    return {"rank": rank, "missions": []}\n\n@app.post("/missions", status_code=201)\ndef create_mission(mission: MissionIn):\n    return {"received": mission.model_dump()}\n';
  var SOL_C1 = 'import sqlite3\n\ndb = sqlite3.connect("vault.db")\ndb.execute("""\n    CREATE TABLE IF NOT EXISTS scrolls (\n        id    INTEGER PRIMARY KEY,\n        title TEXT NOT NULL,\n        rank  TEXT NOT NULL\n    )\n""")\ndb.execute("INSERT INTO scrolls (title, rank) VALUES (?, ?)", ("Fireball Jutsu", "C"))\ndb.execute("INSERT INTO scrolls (title, rank) VALUES (?, ?)", ("Shadow Clone", "B"))\ndb.commit()\n\nfor row in db.execute("SELECT id, title, rank FROM scrolls ORDER BY id"):\n    print(str(row[0]) + ": " + row[1] + " (" + row[2] + ")")\n';
  var SOL_C2 = 'import sqlite3\nfrom fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\n\napp = FastAPI()\ndb = sqlite3.connect("missions.db", check_same_thread=False)\ndb.row_factory = sqlite3.Row\ndb.execute("""\n    CREATE TABLE IF NOT EXISTS missions (\n        id    INTEGER PRIMARY KEY,\n        title TEXT NOT NULL,\n        rank  TEXT NOT NULL,\n        done  INTEGER NOT NULL DEFAULT 0\n    )\n""")\n\nclass MissionIn(BaseModel):\n    title: str\n    rank: str = "D"\n    done: bool = False\n\ndef row_to_dict(row):\n    return {"id": row["id"], "title": row["title"], "rank": row["rank"], "done": bool(row["done"])}\n\n@app.get("/")\ndef home():\n    return {"village": "Konoha", "status": "ready"}\n\n@app.get("/missions")\ndef list_missions():\n    rows = db.execute("SELECT * FROM missions ORDER BY id").fetchall()\n    return [row_to_dict(r) for r in rows]\n\n@app.get("/missions/{mission_id}")\ndef get_mission(mission_id: int):\n    row = db.execute("SELECT * FROM missions WHERE id = ?", (mission_id,)).fetchone()\n    if row is None:\n        raise HTTPException(status_code=404, detail="No such mission")\n    return row_to_dict(row)\n\n@app.post("/missions", status_code=201)\ndef create_mission(mission: MissionIn):\n    cur = db.execute("INSERT INTO missions (title, rank, done) VALUES (?, ?, ?)",\n                     (mission.title, mission.rank, mission.done))\n    db.commit()\n    return get_mission(cur.lastrowid)\n';
  var SOL_C3 = SOL_C2 + '\n@app.put("/missions/{mission_id}")\ndef update_mission(mission_id: int, mission: MissionIn):\n    get_mission(mission_id)\n    db.execute("UPDATE missions SET title = ?, rank = ?, done = ? WHERE id = ?",\n               (mission.title, mission.rank, mission.done, mission_id))\n    db.commit()\n    return get_mission(mission_id)\n\n@app.delete("/missions/{mission_id}", status_code=204)\ndef delete_mission(mission_id: int):\n    get_mission(mission_id)\n    db.execute("DELETE FROM missions WHERE id = ?", (mission_id,))\n    db.commit()\n';
  var SOL_B1 = 'import sqlite3\nfrom fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\n\napp = FastAPI()\ndb = sqlite3.connect("village.db", check_same_thread=False)\ndb.row_factory = sqlite3.Row\ndb.execute("""\n    CREATE TABLE IF NOT EXISTS shinobi (\n        id   INTEGER PRIMARY KEY,\n        name TEXT NOT NULL,\n        clan TEXT NOT NULL,\n        rank TEXT NOT NULL DEFAULT \'Genin\'\n    )\n""")\n\nclass ShinobiIn(BaseModel):\n    name: str\n    clan: str\n    rank: str = "Genin"\n\ndef row_to_dict(row):\n    return {"id": row["id"], "name": row["name"], "clan": row["clan"], "rank": row["rank"]}\n\n@app.get("/shinobi")\ndef list_shinobi(clan: str | None = None):\n    if clan is None:\n        rows = db.execute("SELECT * FROM shinobi ORDER BY id").fetchall()\n    else:\n        rows = db.execute("SELECT * FROM shinobi WHERE clan = ? ORDER BY id", (clan,)).fetchall()\n    return [row_to_dict(r) for r in rows]\n\n@app.get("/shinobi/{shinobi_id}")\ndef get_shinobi(shinobi_id: int):\n    row = db.execute("SELECT * FROM shinobi WHERE id = ?", (shinobi_id,)).fetchone()\n    if row is None:\n        raise HTTPException(status_code=404, detail="No such shinobi")\n    return row_to_dict(row)\n\n@app.post("/shinobi", status_code=201)\ndef create_shinobi(s: ShinobiIn):\n    cur = db.execute("INSERT INTO shinobi (name, clan, rank) VALUES (?, ?, ?)", (s.name, s.clan, s.rank))\n    db.commit()\n    return get_shinobi(cur.lastrowid)\n\n@app.put("/shinobi/{shinobi_id}")\ndef update_shinobi(shinobi_id: int, s: ShinobiIn):\n    get_shinobi(shinobi_id)\n    db.execute("UPDATE shinobi SET name = ?, clan = ?, rank = ? WHERE id = ?", (s.name, s.clan, s.rank, shinobi_id))\n    db.commit()\n    return get_shinobi(shinobi_id)\n\n@app.delete("/shinobi/{shinobi_id}", status_code=204)\ndef delete_shinobi(shinobi_id: int):\n    get_shinobi(shinobi_id)\n    db.execute("DELETE FROM shinobi WHERE id = ?", (shinobi_id,))\n    db.commit()\n';

  window.MISSIONS = [
    { id: "D", rank: "D", title: "First Routes", short: "Routes", kanji: "路",
      intro: "D-rank. A server is a program that waits for requests and answers them. FastAPI makes each answer a plain Python function. Three missions, and you'll have routes, parameters and validated input.",
      topics: [{ id: "md", title: "FastAPI basics", kanji: "路", problems: [
        { id: "ms-d1", type: "server", title: "Hello, server",
          say: "Yo. First mission. Three lines of real server. Every FastAPI app starts the same way: import it, create `app`, and attach a function to a path.",
          task: "Create a FastAPI app called `app` with one route: a GET on `/` that returns `{\"village\": \"Konoha\", \"status\": \"ready\"}`. Press Run to send the request below to your server.",
          examples: ["GET /\n→ 200  {\"village\": \"Konoha\", \"status\": \"ready\"}"],
          hint: "from fastapi import FastAPI, then app = FastAPI(). A route is a function with @app.get(\"/\") above it; whatever it returns becomes the JSON reply.",
          check: 'await expect("GET", "/", status=200, where=lambda d: d == {"village": "Konoha", "status": "ready"}, note="the reply should be exactly the dict from the mission")',
          solution: SOL_D1 },
        { id: "ms-d2", type: "server", title: "Paths and queries",
          say: "Two ways a request carries information: in the path, like `/missions/7`, and after a question mark, like `?rank=B`. FastAPI reads both from your function's parameters.",
          task: "Keep the home route. Add GET `/missions/{mission_id}` where `mission_id` is an `int`; return `{\"id\": mission_id, \"title\": \"Mission \" + str(mission_id)}`. Add GET `/missions` with an optional query parameter `rank` that defaults to `\"D\"`; return `{\"rank\": rank, \"missions\": []}`.",
          examples: ["GET /missions/7\n→ 200  {\"id\": 7, \"title\": \"Mission 7\"}", "GET /missions/abc\n→ 422  (FastAPI refuses it for you, because mission_id is an int)", "GET /missions?rank=B\n→ 200  {\"rank\": \"B\", \"missions\": []}", "GET /missions\n→ 200  {\"rank\": \"D\", \"missions\": []}"],
          hint: "A parameter named in the path, like {mission_id}, is a path parameter. Any other parameter with a default, like rank: str = \"D\", becomes a query parameter.",
          starter: SOL_D1,
          check: 'await expect("GET", "/", status=200)\nawait expect("GET", "/missions/7", status=200, where=lambda d: d == {"id": 7, "title": "Mission 7"}, note="id should be the number 7, title \'Mission 7\'")\nawait expect("GET", "/missions/abc", status=422, note="a non-number id must be refused: type mission_id as int")\nawait expect("GET", "/missions?rank=B", status=200, where=lambda d: d == {"rank": "B", "missions": []})\nawait expect("GET", "/missions", status=200, where=lambda d: d == {"rank": "D", "missions": []}, note="with no ?rank the default D should be used")',
          solution: SOL_D2 },
        { id: "ms-d3", type: "server", title: "Request bodies",
          say: "Creating things means sending data in the request body. Describe the shape once with a Pydantic model, and FastAPI parses, validates and complains for you.",
          task: "Add a Pydantic model `MissionIn` with `title: str`, `rank: str = \"D\"` and `done: bool = False`. Add a POST on `/missions` that takes a `MissionIn` and returns `{\"received\": <the mission as a dict>}` with status code 201. Keep the earlier routes.",
          examples: ["POST /missions  {\"title\": \"Catch Tora\"}\n→ 201  {\"received\": {\"title\": \"Catch Tora\", \"rank\": \"D\", \"done\": false}}", "POST /missions  {\"rank\": \"C\"}\n→ 422  (title is required)"],
          hint: "from pydantic import BaseModel; class MissionIn(BaseModel): ... Then def create_mission(mission: MissionIn) under @app.post(\"/missions\", status_code=201). mission.model_dump() gives the dict.",
          starter: SOL_D2,
          check: 'await expect("POST", "/missions", {"title": "Catch Tora"}, status=201, where=lambda d: d == {"received": {"title": "Catch Tora", "rank": "D", "done": False}}, note="defaults should fill in rank D and done false")\nawait expect("POST", "/missions", {"title": "Escort", "rank": "C", "done": True}, status=201, where=lambda d: d["received"]["done"] is True)\nawait expect("POST", "/missions", {"rank": "C"}, status=422, note="a body without title must be refused (that is the model doing its job)")\nawait expect("GET", "/missions/3", status=200, where=lambda d: d["id"] == 3)',
          solution: SOL_D3 }
      ]}]},
    { id: "C", rank: "C", title: "The Vault", short: "Vault", kanji: "庫",
      intro: "C-rank. A server that forgets everything on restart is a toy. SQLite is a whole database in one file, built into Python. First on its own, then wired into the server.",
      topics: [{ id: "mc", title: "SQLite", kanji: "庫", problems: [
        { id: "ms-c1", title: "The scroll vault",
          say: "No server this time. Just SQL: a table, two inserts, one select. Four verbs cover most of what a real app ever does.",
          task: "Using `sqlite3`, connect to a database file `vault.db`. Create a table `scrolls` with columns `id INTEGER PRIMARY KEY`, `title TEXT NOT NULL`, `rank TEXT NOT NULL` (use `CREATE TABLE IF NOT EXISTS`). Insert two scrolls using `?` placeholders: `Fireball Jutsu` with rank `C`, then `Shadow Clone` with rank `B`. Commit. Then select all rows ordered by id and print each as `<id>: <title> (<rank>)`.",
          examples: ["It should print:\n1: Fireball Jutsu (C)\n2: Shadow Clone (B)"],
          hint: "db = sqlite3.connect(\"vault.db\"); db.execute(\"INSERT INTO scrolls (title, rank) VALUES (?, ?)\", (\"Fireball Jutsu\", \"C\")); db.commit(); for row in db.execute(\"SELECT ...\"): print(...)",
          check: "assert 'sqlite3' in _src and 'vault.db' in _src, 'Connect with sqlite3.connect(\"vault.db\").'\nassert '?' in _src, 'Use ? placeholders in the INSERT, never string formatting.'\nlines = [l.strip() for l in _out.strip().splitlines()]\nassert lines == ['1: Fireball Jutsu (C)', '2: Shadow Clone (B)'], f'It printed {lines}'\nimport sqlite3 as _s\n_c = _s.connect('vault.db')\nassert _c.execute('SELECT COUNT(*) FROM scrolls').fetchone()[0] == 2, 'The scrolls table should hold exactly the two rows (did you commit?).'\n_c.close()",
          solution: SOL_C1 },
        { id: "ms-c2", type: "server", title: "Create and read",
          say: "Now wire the vault into the server. POST inserts a row, GET reads it back. Rows come out as tuples, so a small helper turns a row into the dict the client expects.",
          task: "Store missions in SQLite. Connect to `missions.db` with `check_same_thread=False`, set `db.row_factory = sqlite3.Row`, and create table `missions` with `id INTEGER PRIMARY KEY`, `title TEXT NOT NULL`, `rank TEXT NOT NULL`, `done INTEGER NOT NULL DEFAULT 0` if it doesn't exist. Then: POST `/missions` inserts a `MissionIn` and returns the stored mission as `{\"id\", \"title\", \"rank\", \"done\"}` with status 201 (done must come back as a real true/false). GET `/missions` returns the list of all missions ordered by id. GET `/missions/{mission_id}` returns one mission, or status 404 with detail `\"No such mission\"`.",
          examples: ["GET /missions\n→ 200  []", "POST /missions  {\"title\": \"Escort Tazuna\", \"rank\": \"C\"}\n→ 201  {\"id\": 1, \"title\": \"Escort Tazuna\", \"rank\": \"C\", \"done\": false}", "POST /missions  {\"title\": \"Catch Tora\"}\n→ 201  {\"id\": 2, \"title\": \"Catch Tora\", \"rank\": \"D\", \"done\": false}", "GET /missions/2\n→ 200  {\"id\": 2, \"title\": \"Catch Tora\", \"rank\": \"D\", \"done\": false}", "GET /missions/99\n→ 404  {\"detail\": \"No such mission\"}"],
          hint: "cur = db.execute(\"INSERT ...\", (...)); db.commit(); then return get_mission(cur.lastrowid). For the 404: raise HTTPException(status_code=404, detail=\"No such mission\"). bool(row[\"done\"]) turns the stored 0/1 back into false/true.",
          starter: SOL_D3,
          check: 'await expect("GET", "/missions", status=200, where=lambda d: d == [], note="an empty vault should list as []")\nm1 = await expect("POST", "/missions", {"title": "Escort Tazuna", "rank": "C"}, status=201, where=lambda d: d == {"id": 1, "title": "Escort Tazuna", "rank": "C", "done": False}, note="return the stored row with its new id, and done as false (not 0)")\nawait expect("POST", "/missions", {"title": "Catch Tora"}, status=201, where=lambda d: d["id"] == 2 and d["rank"] == "D")\nawait expect("GET", "/missions", status=200, where=lambda d: [x["title"] for x in d] == ["Escort Tazuna", "Catch Tora"], note="list every mission, ordered by id")\nawait expect("GET", "/missions/2", status=200, where=lambda d: d["title"] == "Catch Tora" and d["done"] is False)\nawait expect("GET", "/missions/99", status=404, where=lambda d: d == {"detail": "No such mission"}, note="missing id: 404 with detail \'No such mission\'")\nawait expect("POST", "/missions", {"rank": "A"}, status=422)',
          solution: SOL_C2 },
        { id: "ms-c3", type: "server", title: "Update and delete",
          say: "The last two verbs. Both start by making sure the mission exists; reuse `get_mission` for that, so the 404 lives in one place.",
          task: "Add PUT `/missions/{mission_id}` that takes a `MissionIn`, updates that row, and returns the updated mission (404 with detail `\"No such mission\"` if it doesn't exist). Add DELETE `/missions/{mission_id}` that removes the row and returns status 204 with no body (404 if it doesn't exist).",
          examples: ["POST /missions  {\"title\": \"Escort Tazuna\", \"rank\": \"C\"}\n→ 201  {\"id\": 1, ...}", "PUT /missions/1  {\"title\": \"Escort Tazuna\", \"rank\": \"C\", \"done\": true}\n→ 200  {\"id\": 1, \"title\": \"Escort Tazuna\", \"rank\": \"C\", \"done\": true}", "PUT /missions/9  {...}\n→ 404", "DELETE /missions/1\n→ 204", "GET /missions/1\n→ 404", "DELETE /missions/1\n→ 404"],
          hint: "@app.put(\"/missions/{mission_id}\") def update_mission(mission_id: int, mission: MissionIn): get_mission(mission_id) first. For delete: @app.delete(..., status_code=204) and return nothing.",
          starter: SOL_C2,
          check: 'await expect("POST", "/missions", {"title": "Escort Tazuna", "rank": "C"}, status=201)\nawait expect("PUT", "/missions/1", {"title": "Escort Tazuna", "rank": "C", "done": True}, status=200, where=lambda d: d == {"id": 1, "title": "Escort Tazuna", "rank": "C", "done": True}, note="return the updated mission")\nawait expect("GET", "/missions/1", status=200, where=lambda d: d["done"] is True, note="the update must actually be saved (commit!)")\nawait expect("PUT", "/missions/9", {"title": "x", "rank": "D", "done": False}, status=404)\nawait expect("DELETE", "/missions/1", status=204, where=lambda d: d is None, note="204 means no body at all")\nawait expect("GET", "/missions/1", status=404, note="after deleting, it should be gone")\nawait expect("DELETE", "/missions/1", status=404)\nawait expect("GET", "/missions", status=200, where=lambda d: d == [])',
          solution: SOL_C3 }
      ]}]},
    { id: "B", rank: "B", title: "Solo Mission", short: "Solo", kanji: "独",
      intro: "B-rank. Empty editor, full spec. Everything you need you've already written once. This is the one that proves you can do it without the rails.",
      topics: [{ id: "mb", title: "From scratch", kanji: "独", problems: [
        { id: "ms-b1", type: "server", title: "A full CRUD service",
          say: "No starter code. Build the whole thing: database, model, five routes, and a filter. Take it one route at a time and run after each one.",
          task: "Build a complete service for shinobi records, from a blank file. Database `village.db`, table `shinobi` with `id INTEGER PRIMARY KEY`, `name TEXT NOT NULL`, `clan TEXT NOT NULL`, `rank TEXT NOT NULL DEFAULT 'Genin'`. Model `ShinobiIn` with `name: str`, `clan: str`, `rank: str = \"Genin\"`. Routes: GET `/shinobi` lists all ordered by id, and with `?clan=Uchiha` lists only that clan. GET `/shinobi/{shinobi_id}` returns one or 404 with detail `\"No such shinobi\"`. POST `/shinobi` creates one, status 201. PUT `/shinobi/{shinobi_id}` updates, 404 if missing. DELETE `/shinobi/{shinobi_id}` returns 204, 404 if missing. Every shinobi is returned as `{\"id\", \"name\", \"clan\", \"rank\"}`.",
          examples: ["POST /shinobi  {\"name\": \"Sasuke\", \"clan\": \"Uchiha\"}\n→ 201  {\"id\": 1, \"name\": \"Sasuke\", \"clan\": \"Uchiha\", \"rank\": \"Genin\"}", "GET /shinobi?clan=Uchiha\n→ 200  [only Uchiha]", "PUT /shinobi/1  {\"name\": \"Sasuke\", \"clan\": \"Uchiha\", \"rank\": \"Chunin\"}\n→ 200  {... \"rank\": \"Chunin\"}", "DELETE /shinobi/1\n→ 204"],
          hint: "Same shape as the missions server. For the filter: def list_shinobi(clan: str | None = None) and two different SELECTs.",
          check: 'await expect("GET", "/shinobi", status=200, where=lambda d: d == [])\nawait expect("POST", "/shinobi", {"name": "Sasuke", "clan": "Uchiha"}, status=201, where=lambda d: d == {"id": 1, "name": "Sasuke", "clan": "Uchiha", "rank": "Genin"}, note="rank should default to Genin")\nawait expect("POST", "/shinobi", {"name": "Shikamaru", "clan": "Nara", "rank": "Chunin"}, status=201, where=lambda d: d["id"] == 2)\nawait expect("POST", "/shinobi", {"name": "Itachi", "clan": "Uchiha", "rank": "Jonin"}, status=201)\nawait expect("POST", "/shinobi", {"clan": "Nara"}, status=422, note="name is required")\nawait expect("GET", "/shinobi", status=200, where=lambda d: [x["name"] for x in d] == ["Sasuke", "Shikamaru", "Itachi"])\nawait expect("GET", "/shinobi?clan=Uchiha", status=200, where=lambda d: [x["name"] for x in d] == ["Sasuke", "Itachi"], note="?clan= should filter to that clan only")\nawait expect("GET", "/shinobi/2", status=200, where=lambda d: d["name"] == "Shikamaru")\nawait expect("GET", "/shinobi/42", status=404, where=lambda d: d == {"detail": "No such shinobi"})\nawait expect("PUT", "/shinobi/1", {"name": "Sasuke", "clan": "Uchiha", "rank": "Chunin"}, status=200, where=lambda d: d["rank"] == "Chunin")\nawait expect("GET", "/shinobi/1", status=200, where=lambda d: d["rank"] == "Chunin", note="the update must be saved")\nawait expect("PUT", "/shinobi/42", {"name": "x", "clan": "y"}, status=404)\nawait expect("DELETE", "/shinobi/3", status=204, where=lambda d: d is None)\nawait expect("DELETE", "/shinobi/3", status=404)\nawait expect("GET", "/shinobi?clan=Uchiha", status=200, where=lambda d: [x["name"] for x in d] == ["Sasuke"])',
          solution: SOL_B1 }
      ]}]},
    { id: "A", rank: "A", title: "Ship It", short: "Ship", kanji: "出",
      intro: "A-rank. Everything so far ran inside this page. Time to run it for real on your own machine, with a real port and a real browser talking to it.",
      topics: [{ id: "ma", title: "On your machine", kanji: "出", problems: [
        { id: "ms-a1", type: "guide", title: "Run it with uvicorn",
          say: "Last mission. This one can't be checked from here, so it's on your honour: follow the steps on your own computer, then mark it done.",
          task: "Run the missions server on your own computer with uvicorn, and use its built-in docs page to create and read a mission.",
          steps: [
            "**Install Python** from python.org if you don't have it (3.10 or newer). Open a terminal and check:\n```bash\npython --version\n```",
            "**Install the two packages.** FastAPI is the framework; uvicorn is the server that listens on a port and hands requests to your app:\n```bash\npip install fastapi uvicorn\n```",
            "**Save the server** as `main.py`. This is the C-rank missions server you already wrote (open it with Show solution on the Update and delete mission if you want to copy it):\n```python\n" + SOL_C3 + "```",
            "**Start it:**\n```bash\nuvicorn main:app --reload\n```\n`main` is the file, `app` is the variable. `--reload` restarts the server whenever you save. You should see `Uvicorn running on http://127.0.0.1:8000`.",
            "**Open the docs page** in your browser: `http://127.0.0.1:8000/docs`. FastAPI generated it from your code. Expand POST /missions, click Try it out, send `{\"title\": \"Escort Tazuna\", \"rank\": \"C\"}`, and read the 201 response. Then GET /missions to see it listed.",
            "**Look in the folder.** A file `missions.db` has appeared: that's your SQLite database. Stop the server with Ctrl+C, start it again, and GET /missions still returns your mission. That persistence is the difference between a toy and a service.",
            "**Try it from the command line** too, the way another program would:\n```bash\ncurl http://127.0.0.1:8000/missions\ncurl -X DELETE http://127.0.0.1:8000/missions/1\n```\nWhen all of that works, mark the mission done."
          ],
          solution: SOL_C3 }
      ]}]}
  ];

  window.Missions = window.Dojo({
    id: "missions", title: "Missions", kicker: "任務",
    bg: "assets/images/locations/missions.jpg", sprite: "assets/images/characters/kakashi.png",
    teacher: "Kakashi Hatake", lessons: window.MISSIONS, field: "missions",
    praise: "Mission complete. Not bad… for a genin.",
    harness: HARNESS,
    prepareLabel: "Unpacking the mission gear (FastAPI)…",
    prepare: function (py) {
      return py.loadPackage(["pydantic", "sqlite3", "ssl"]).then(function () {
        return py.loadPackage(WHEELS.map(function (w) { return new URL("vendor/wheels/" + w, location.href).href; }));
      });
    },
    welcome: function (name) {
      return ["Yo, " + name + ". Sorry I'm late — a black cat crossed my path.",
              "Missions are where you build real things: small Python servers that store and serve data, the kind that run behind actual apps.",
              "D-rank is routes, C-rank is the database, B-rank you build the whole service alone, and A-rank you run it on your own machine. Pick one."];
    }
  });
})();
