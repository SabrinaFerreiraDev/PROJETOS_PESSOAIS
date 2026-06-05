const EMPTY_RESULT = {
  raw: "",
  html: "",
  css: "",
  notes: "Aguardando geracao.",
};

const state = {
  result: { ...EMPTY_RESULT },
  activeTab: "css",
  zoom: 1,
  cache: new Map(),
};

const elements = {
  form: document.querySelector("#generatorForm"),
  prompt: document.querySelector("#promptInput"),
  generateButton: document.querySelector("#generateButton"),
  generateLabel: document.querySelector("#generateLabel"),
  clearPromptButton: document.querySelector("#clearPromptButton"),
  clearOutputButton: document.querySelector("#clearOutputButton"),
  copyButton: document.querySelector("#copyButton"),
  downloadButton: document.querySelector("#downloadButton"),
  previewFrame: document.querySelector("#previewFrame"),
  previewEmpty: document.querySelector("#previewEmpty"),
  codeLines: document.querySelector("#codeLines"),
  toast: document.querySelector("#toast"),
  status: document.querySelector("#aiStatus"),
  statusText: document.querySelector("#statusText"),
  zoomInButton: document.querySelector("#zoomInButton"),
  zoomOutButton: document.querySelector("#zoomOutButton"),
  resetPreviewButton: document.querySelector("#resetPreviewButton"),
  zoomReadout: document.querySelector("#zoomReadout"),
  tabs: document.querySelectorAll("[data-tab]"),
};

const systemPrompt = `Voce e um gerador profissional de interfaces em HTML e CSS.
Responda somente com codigo puro, sem markdown e sem explicacoes.
Formato obrigatorio:
<style>
/* CSS completo, valido, sem propriedades duplicadas no mesmo seletor */
</style>
<!-- HTML sem scripts -->
Crie componentes refinados, responsivos e acessiveis.
Use nomes de classes claros, evite CSS global agressivo, nao use bibliotecas externas e nao inclua JavaScript.`;

function stripCodeFences(value) {
  return String(value || "").replace(/```(?:html|css)?/gi, "").replace(/```/g, "").trim();
}

function sanitizeGeneratedCode(value) {
  return stripCodeFences(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

function splitGeneratedCode(rawCode) {
  const safeCode = sanitizeGeneratedCode(rawCode);
  const styleMatches = [...safeCode.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  const css = styleMatches.map((match) => match[1].trim()).filter(Boolean).join("\n\n");
  const html = safeCode.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();

  return {
    raw: safeCode,
    html: html || '<div class="generated-component">Preview indisponivel</div>',
    css: formatCss(css),
    notes: buildNotes(safeCode, css, html),
  };
}

function formatCss(css) {
  if (!css) return "/* Nenhum CSS encontrado na resposta. */";

  return css
    .replace(/\s*{\s*/g, " {\n  ")
    .replace(/;\s*/g, ";\n  ")
    .replace(/\s*}\s*/g, "\n}\n\n")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function buildNotes(raw, css, html) {
  const notes = [];
  notes.push(css ? "CSS extraido e formatado automaticamente." : "A resposta nao trouxe uma tag <style> valida.");
  notes.push(html ? "HTML de exemplo separado para preview." : "HTML nao identificado; foi aplicado um fallback visual.");
  notes.push(raw.includes("<script") ? "Scripts foram removidos por seguranca." : "Resposta sanitizada sem scripts executaveis.");
  return notes.join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlightCodeLine(line) {
  const escaped = escapeHtml(line);

  if (escaped.trim().startsWith("/*") || escaped.trim().startsWith("//")) {
    return `<code class="token-comment">${escaped}</code>`;
  }

  return `<code>${escaped
    .replace(/^([.#]?[a-zA-Z0-9_:-]+(?:\s+[.#]?[a-zA-Z0-9_:-]+)*)\s(\{)/, '<span class="token-selector">$1</span> $2')
    .replace(/([a-z-]+)(:)/gi, '<span class="token-property">$1</span>$2')
    .replace(/(:\s*)([^;{}]+)/g, '$1<span class="token-value">$2</span>')}</code>`;
}

function composePreviewDocument({ html, css }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      padding: 32px;
      color: #111827;
      background: #f7f8fa;
      font-family: "Space Grotesk", system-ui, sans-serif;
    }
    ${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function debounce(callback, delay = 180) {
  let timerId;
  return (...args) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => callback(...args), delay);
  };
}

function setBusy(button, isBusy) {
  button.disabled = isBusy;
  button.classList.toggle("is-loading", isBusy);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(elements.toast._timerId);
  elements.toast._timerId = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2500);
}

function setStatus(status, text) {
  elements.status.dataset.status = status;
  elements.statusText.textContent = text;
}

function renderCode() {
  const content = state.result[state.activeTab] || "";
  const lines = content.split("\n");

  elements.codeLines.innerHTML = lines.map((line) => `<li>${highlightCodeLine(line || " ")}</li>`).join("");

  elements.tabs.forEach((tab) => {
    const active = tab.dataset.tab === state.activeTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

function renderZoom() {
  elements.previewFrame.style.transform = `scale(${state.zoom})`;
  elements.zoomReadout.textContent = `${Math.round(state.zoom * 100)}%`;
}

const renderPreview = debounce(() => {
  const { html, css, raw } = state.result;
  elements.previewEmpty.hidden = Boolean(raw);
  elements.previewFrame.hidden = !raw;
  elements.previewFrame.srcdoc = raw ? composePreviewDocument({ html, css }) : "";
}, 120);

async function requestGeneratedCode(prompt) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.message || "Falha ao gerar codigo.");
    }

    if (!payload?.content || typeof payload.content !== "string") {
      throw new Error("Resposta invalida da IA.");
    }

    return payload.content;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Timeout da IA. Tente um prompt mais objetivo.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function handleGenerate(event) {
  event.preventDefault();

  const prompt = elements.prompt.value.trim();
  if (!prompt) {
    showToast("Descreva o componente antes de gerar.");
    return;
  }

  setBusy(elements.generateButton, true);
  elements.generateLabel.textContent = "Gerando...";
  setStatus("loading", "Gerando CSS...");

  try {
    const cacheKey = prompt.toLowerCase();
    const rawCode = state.cache.has(cacheKey) ? state.cache.get(cacheKey) : await requestGeneratedCode(prompt);
    state.cache.set(cacheKey, rawCode);
    state.result = splitGeneratedCode(rawCode);
    state.activeTab = "css";
    renderCode();
    renderPreview();
    setStatus("ready", "CSS gerado");
    showToast("CSS gerado com sucesso.");
  } catch (error) {
    setStatus("error", "Falha na IA");
    showToast(error.message || "Falha ao gerar codigo.");
  } finally {
    setBusy(elements.generateButton, false);
    elements.generateLabel.textContent = "Gerar CSS";
  }
}

async function handleCopy() {
  const content = state.result[state.activeTab] || state.result.raw;
  if (!content) {
    showToast("Nao ha codigo para copiar.");
    return;
  }

  await navigator.clipboard.writeText(content);
  showToast("Codigo copiado.");
}

function handleDownload() {
  if (!state.result.raw) {
    showToast("Nao ha codigo para baixar.");
    return;
  }

  downloadText("css-studio-ai.html", composePreviewDocument(state.result));
  showToast("Arquivo baixado.");
}

function handleClearOutput() {
  state.result = { ...EMPTY_RESULT };
  state.zoom = 1;
  renderCode();
  renderPreview();
  renderZoom();
  setStatus("ready", "IA pronta");
  showToast("Resultado limpo.");
}

function changeZoom(step) {
  state.zoom = Math.min(1.35, Math.max(0.65, Number((state.zoom + step).toFixed(2))));
  renderZoom();
}

elements.form.addEventListener("submit", handleGenerate);
elements.clearPromptButton.addEventListener("click", () => {
  elements.prompt.value = "";
  elements.prompt.focus();
});
elements.clearOutputButton.addEventListener("click", handleClearOutput);
elements.copyButton.addEventListener("click", handleCopy);
elements.downloadButton.addEventListener("click", handleDownload);
elements.zoomInButton.addEventListener("click", () => changeZoom(0.1));
elements.zoomOutButton.addEventListener("click", () => changeZoom(-0.1));
elements.resetPreviewButton.addEventListener("click", () => {
  state.zoom = 1;
  renderZoom();
});
elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.activeTab = tab.dataset.tab;
    renderCode();
  });
});

renderCode();
renderZoom();
