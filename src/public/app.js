const commentInput = document.querySelector("#comment");
const commentsContainer = document.querySelector("#comments");
const addButton = document.querySelector("#add-comment");
const clearButton = document.querySelector("#clear-comments");

function selectedStoredMode() {
  return document.querySelector('input[name="stored-mode"]:checked').value;
}

async function loadComments() {
  const response = await fetch("/api/comments");
  const comments = await response.json();
  commentsContainer.replaceChildren();

  for (const item of comments) {
    const article = document.createElement("article");
    article.className = "comment";

    if (selectedStoredMode() === "unsafe") {
      // INTENTIONALLY VULNERABLE: untrusted stored input is parsed as HTML.
      article.innerHTML = `<p>${item.comment}</p><small>Gespeicherter Kommentar</small>`;
    } else {
      // SAFE FOR PLAIN TEXT: the browser treats the value as text, not markup.
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
  if (!confirm("Wirklich alle gespeicherten Kommentare löschen?")) return;
  await fetch("/api/comments", { method: "DELETE" });
  await loadComments();
});

document.querySelectorAll('input[name="stored-mode"]').forEach((radio) => {
  radio.addEventListener("change", loadComments);
});

const domOutput = document.querySelector("#dom-output");
const domMode = document.querySelector("#dom-mode");
const domPayload = "<img src=x onerror=alert('DOM XSS')>";

function renderDomDemo(mode) {
  const value = decodeURIComponent(location.hash.slice(1));

  if (mode === "unsafe") {
    // INTENTIONALLY VULNERABLE: URL-controlled data is interpreted as HTML.
    domOutput.innerHTML = value || "Kein URL-Wert vorhanden.";
    domMode.textContent = "Unsicher – innerHTML";
  } else {
    // SAFE FOR PLAIN TEXT: URL-controlled data is rendered as text.
    domOutput.textContent = value || "Kein URL-Wert vorhanden.";
    domMode.textContent = "Sicher – textContent";
  }
}

document.querySelector("#dom-unsafe").addEventListener("click", () => {
  history.replaceState(null, "", `#${encodeURIComponent(domPayload)}`);
  renderDomDemo("unsafe");
});

document.querySelector("#dom-safe").addEventListener("click", () => {
  history.replaceState(null, "", `#${encodeURIComponent(domPayload)}`);
  renderDomDemo("safe");
});

document.querySelectorAll('input[name="stored-mode"]').forEach((radio) => {
  radio.addEventListener("change", loadComments);
});

loadComments();
