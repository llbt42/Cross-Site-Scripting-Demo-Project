const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { readComments, writeComments } = require("./storage");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");

function send(res, status, body, type = "text/html; charset=utf-8") {
    res.writeHead(status, {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store"
    });
    res.end(body);
}

// Encoding für Zeichen mit Bedeutung im HTML-Kontext
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function readBody(req) {
    let body = "";
    for await (const chunk of req) {
        body += chunk;
        if (body.length > 10_000) throw new Error("Request body too large");
    }
    return body;
}

async function serveStatic(pathname, res) {
    const routes = {
        "/": "index.html",
        "/index.html": "index.html",
        "/style.css": "style.css",
        "/app.js": "app.js",
        "/pages/reflected.html": "pages/reflected.html",
        "/pages/stored.html": "pages/stored.html",
        "/pages/dom.html": "pages/dom.html",
    };
    const filename = routes[pathname];
    if (!filename) return false;

    const fullPath = path.join(PUBLIC_DIR, filename);
    const content = await fs.readFile(fullPath);
    const type = filename.endsWith(".css")
        ? "text/css; charset=utf-8"
        : filename.endsWith(".js")
            ? "text/javascript; charset=utf-8"
            : "text/html; charset=utf-8";
    send(res, 200, content, type);
    return true;
}

async function serveReflected(url, res) {
    const name = url.searchParams.get("name") || "Besucher";
    const mode = url.searchParams.get("mode") === "safe"
        ? "safe"
        : "unsafe";

    const template = await fs.readFile(
        path.join(PUBLIC_DIR, "pages", "reflected.html"),
        "utf8"
    );

    const output = mode === "safe"
        ? escapeHtml(name)
        : name;

    const warning = mode === "safe"
        ? "Sichere Variante: Der Parameter wird für den HTML-Textkontext kodiert."
        : "Unsichere Variante: Der Parameter wird ungeprüft in HTML eingesetzt.";

    const result = `
        <h2>Hallo, ${output}!</h2>
        <p class="notice ${mode === "safe" ? "good" : "bad"}">
            ${warning}
        </p>
    `;

    const html = template.replace("{{RESULT}}", result);

    send(res, 200, html);
}

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

        if (req.method === "GET" && await serveStatic(url.pathname, res)) return;

        if (req.method === "GET" && url.pathname === "/pages/reflected.html") {
            await serveReflected(url, res);
            return;
        }

        if (req.method === "GET" && url.pathname === "/api/comments") {
            const comments = await readComments();
            send(res, 200, JSON.stringify(comments), "application/json; charset=utf-8");
            return;
        }

        if (req.method === "POST" && url.pathname === "/api/comments") {
            const body = JSON.parse(await readBody(req));
            const comment = String(body.comment || "").slice(0, 500);
            if (!comment.trim()) {
                send(res, 400, JSON.stringify({ error: "Bitte einen Kommentar eingeben." }), "application/json; charset=utf-8");
                return;
            }
            const comments = await readComments();
            comments.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), comment, createdAt: new Date().toISOString() });
            await writeComments(comments.slice(-100));
            send(res, 201, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
            return;
        }

        if (req.method === "DELETE" && url.pathname === "/api/comments") {
            await writeComments([]);
            send(res, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
            return;
        }

        send(res, 404, "Nicht gefunden", "text/plain; charset=utf-8");
    } catch (error) {
        const status = error.message === "Request body too large" ? 413 : 400;
        send(res, status, JSON.stringify({ error: "Anfrage konnte nicht verarbeitet werden." }), "application/json; charset=utf-8");
    }
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`XSS Demo-Projekt läuft auf Port ${PORT}`);
});
