// ==========================================
// DEMO 02 – STORED XSS
// ==========================================

const commentInput = document.querySelector("#comment");
const commentsContainer = document.querySelector("#comments");
const addButton = document.querySelector("#add-comment");
const clearButton = document.querySelector("#clear-comments");

function selectedStoredMode() {
  return document.querySelector(
      'input[name="stored-mode"]:checked'
  ).value;
}

async function loadComments() {
  const response = await fetch("/api/comments");
  const comments = await response.json();

  commentsContainer.replaceChildren();

  for (const item of comments) {
    const article = document.createElement("article");
    article.className = "comment";

    if (selectedStoredMode() === "unsafe") {
      // INTENTIONALLY VULNERABLE
      article.innerHTML =
          `<p>${item.comment}</p><small>Gespeicherter Kommentar</small>`;
    } else {
      // SAFE FOR PLAIN TEXT
      const paragraph = document.createElement("p");
      paragraph.textContent = item.comment;

      const small = document.createElement("small");
      small.textContent = "Gespeicherter Kommentar";

      article.append(paragraph, small);
    }

    commentsContainer.append(article);
  }

  if (comments.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Noch keine Kommentare vorhanden.";

    commentsContainer.append(empty);
  }
}

// Nur auf der Stored-XSS-Seite ausführen
if (commentsContainer) {
  addButton.addEventListener("click", async () => {
    const comment = commentInput.value;

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment })
    });

    if (!response.ok) {
      alert("Bitte gib einen Kommentar ein.");
      return;
    }

    commentInput.value = "";
    await loadComments();
  });

  clearButton.addEventListener("click", async () => {
    if (!confirm("Wirklich alle gespeicherten Kommentare löschen?")) {
      return;
    }

    await fetch("/api/comments", { method: "DELETE" });
    await loadComments();
  });

  document.querySelectorAll(
      'input[name="stored-mode"]'
  ).forEach((radio) => {
    radio.addEventListener("change", loadComments);
  });

  loadComments();
}

// ==========================================
// DEMO 03 – DOM-BASED XSS
// ==========================================

const domPayload = "\n" +
    "<div style=\"\n" +
    "    position: relative;\n" +
    "    background: #450a0a;\n" +
    "    color: white;\n" +
    "    border: 3px solid #dc2626;\n" +
    "    border-radius: 14px;\n" +
    "    padding: 30px;\n" +
    "    margin: 20px 0;\n" +
    "    text-align: center;\n" +
    "    box-shadow: 0 0 30px rgba(220, 38, 38, 0.5);\n" +
    "\">\n" +
    "    <h2 style=\"color: #fecaca; font-size: 28px;\">\n" +
    "        ⚠️ SICHERHEITSWARNUNG\n" +
    "    </h2>\n" +
    "\n" +
    "    <p style=\"font-size: 18px;\">\n" +
    "        Deine Sitzung ist abgelaufen!\n" +
    "    </p>\n" +
    "\n" +
    "    <p>\n" +
    "        Bitte bestätige deine Identität, um fortzufahren.\n" +
    "    </p>\n" +
    "\n" +
    "    <button\n" +
    "        onclick=\"alert('Simulierte DOM-XSS-Attacke!')\"\n" +
    "        style=\"\n" +
    "            background: #dc2626;\n" +
    "            color: white;\n" +
    "            border: none;\n" +
    "            border-radius: 8px;\n" +
    "            padding: 14px 24px;\n" +
    "            font-size: 16px;\n" +
    "            font-weight: bold;\n" +
    "            cursor: pointer;\n" +
    "        \"\n" +
    "    >\n" +
    "        Sitzung wiederherstellen\n" +
    "    </button>\n" +
    "\n" +
    "</div>\n";

const domOutput = document.querySelector("#dom-output");
const domMode = document.querySelector("#dom-mode");

function renderDomDemo(mode) {
  const value = decodeURIComponent(location.hash.slice(1));

  if (mode === "unsafe") {
    domOutput.innerHTML = value || "Keine Meldung vorhanden.";
    domMode.textContent = "Unsicher – innerHTML";
  } else {
    domOutput.textContent = value || "Keine Meldung vorhanden.";
    domMode.textContent = "Sicher – textContent";
  }
}

if (domOutput && domMode) {
  document.querySelector("#dom-unsafe")?.addEventListener("click", () => {
    renderDomDemo("unsafe");
  });

  document.querySelector("#dom-safe")?.addEventListener("click", () => {
    renderDomDemo("safe");
  });

  renderDomDemo("unsafe");
}

// Nur auf der DOM-XSS-Seite ausführen
if (domOutput && domMode) {
  document.querySelector("#dom-unsafe").addEventListener("click", () => {
    history.replaceState(
        null,
        "",
        `#${encodeURIComponent(domPayload)}`
    );

    renderDomDemo("unsafe");
  });

  document.querySelector("#dom-safe").addEventListener("click", () => {
    history.replaceState(
        null,
        "",
        `#${encodeURIComponent(domPayload)}`
    );

    renderDomDemo("safe");
  });
}

// Alle gespeicherten Inhalte zurücksetzen
const resetAllButton = document.querySelector("#reset-all");

if (resetAllButton) {
  resetAllButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
        "Möchtest du wirklich alle gespeicherten Kommentare löschen? Diese Aktion kann nicht rückgängig gemacht werden."
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/comments", {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Die gespeicherten Inhalte konnten nicht gelöscht werden.");
      }

      alert("Alle gespeicherten Kommentare wurden zurückgesetzt.");
      window.location.reload();

    } catch (error) {
      alert(error.message);
    }
  });
}