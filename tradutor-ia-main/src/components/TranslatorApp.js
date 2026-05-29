import { createSpeechRecognition } from "../hooks/useSpeechRecognition.js";
import {
  getDetectionLabel,
  translateText,
} from "../services/translationService.js";
import { debounce } from "../utils/debounce.js";
import {
  DEFAULT_SOURCE_LANGUAGE,
  DEFAULT_TARGET_LANGUAGE,
  detectLikelyLanguage,
  getLanguageName,
  normalizeLanguageCode,
  renderLanguageOptions,
} from "../utils/languages.js";
import { createStorage } from "../utils/storage.js";
import { showToast } from "./toast.js";

const HISTORY_LIMIT = 6;
const historyStorage = createStorage("lexora:translation-history", []);
const preferencesStorage = createStorage("lexora:preferences", {
  sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
  targetLanguage: DEFAULT_TARGET_LANGUAGE,
});

function getElements(root) {
  return {
    root,
    sourceLanguage: root.querySelector("[data-source-language]"),
    targetLanguage: root.querySelector("[data-target-language]"),
    swapLanguages: root.querySelector("[data-swap-languages]"),
    inputText: root.querySelector("[data-input-text]"),
    outputText: root.querySelector("[data-output-text]"),
    outputMeta: root.querySelector("[data-output-meta]"),
    detectedLanguage: root.querySelector("[data-detected-language]"),
    translateNow: root.querySelector("[data-translate-now]"),
    clearText: root.querySelector("[data-clear-text]"),
    copyText: root.querySelector("[data-copy-text]"),
    useOutput: root.querySelector("[data-use-output]"),
    microphone: root.querySelector("[data-microphone]"),
    voiceDock: root.querySelector("[data-voice-dock]"),
    voiceTitle: root.querySelector("[data-voice-title]"),
    voiceMessage: root.querySelector("[data-voice-message]"),
    status: root.querySelector("[data-status]"),
    statusLabel: root.querySelector("[data-status-label]"),
    skeleton: root.querySelector("[data-skeleton]"),
    historyList: root.querySelector("[data-history-list]"),
    clearHistory: root.querySelector("[data-clear-history]"),
  };
}

function setStatus(elements, message, state = "idle") {
  if (!elements.statusLabel || !elements.status) {
    return;
  }

  elements.statusLabel.textContent = message;
  elements.status.dataset.state = state;
}

function setLoading(elements, isLoading) {
  elements.root.classList.toggle("is-loading", isLoading);
  elements.skeleton.classList.toggle("is-visible", isLoading);
  elements.translateNow.disabled = isLoading;

  if (isLoading) {
    setStatus(elements, "Traduzindo...", "loading");
    elements.outputMeta.textContent = "Processando";
  }
}

function setVoiceState(elements, { active, title, message }) {
  elements.voiceDock.classList.toggle("is-listening", active);
  elements.voiceDock.classList.toggle("has-feedback", Boolean(title || message));
  elements.microphone.setAttribute(
    "aria-label",
    active ? "Parar reconhecimento de voz" : "Iniciar reconhecimento de voz",
  );
  elements.voiceTitle.textContent = title;
  elements.voiceMessage.textContent = message;
}

function setOutput(elements, text, { placeholder = false } = {}) {
  elements.outputText.textContent = text;
  elements.outputText.classList.toggle("is-placeholder", placeholder);
}

function renderHistory(elements, history) {
  if (!history.length) {
    elements.historyList.innerHTML =
      '<li class="history-empty">Nenhuma tradução recente ainda.</li>';
    return;
  }

  elements.historyList.innerHTML = history
    .map(
      (item, index) => `
        <li>
          <button class="history-item" type="button" data-history-index="${index}">
            <span>${escapeHTML(item.sourceText)}</span>
            <strong>${escapeHTML(item.translatedText)}</strong>
            <small>${getLanguageName(item.sourceLanguage)} → ${getLanguageName(
              item.targetLanguage,
            )}</small>
          </button>
        </li>
      `,
    )
    .join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

function saveHistoryItem(elements, history, item) {
  const nextHistory = [
    item,
    ...history.filter(
      (entry) =>
        entry.sourceText !== item.sourceText ||
        entry.targetLanguage !== item.targetLanguage,
    ),
  ].slice(0, HISTORY_LIMIT);

  historyStorage.set(nextHistory);
  renderHistory(elements, nextHistory);
  return nextHistory;
}

function savePreferences(elements) {
  preferencesStorage.set({
    sourceLanguage: elements.sourceLanguage.value,
    targetLanguage: elements.targetLanguage.value,
  });
}

async function copyToClipboard(text) {
  if (!text.trim()) {
    return false;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const temporaryTextarea = document.createElement("textarea");
  temporaryTextarea.value = text;
  temporaryTextarea.setAttribute("readonly", "");
  temporaryTextarea.style.position = "fixed";
  temporaryTextarea.style.opacity = "0";
  document.body.appendChild(temporaryTextarea);
  temporaryTextarea.select();
  const copied = document.execCommand("copy");
  temporaryTextarea.remove();

  return copied;
}

export function createTranslatorApp(root) {
  if (!root) {
    return;
  }

  const elements = getElements(root);
  let history = historyStorage.get();
  let lastRequestId = 0;
  let lastTranslatedText = "";
  let voiceHadError = false;

  if (!Array.isArray(history)) {
    history = [];
  }

  renderLanguageOptions(elements.sourceLanguage, { includeAuto: true });
  renderLanguageOptions(elements.targetLanguage, { includeAuto: false });

  const preferences = preferencesStorage.get();
  elements.sourceLanguage.value =
    preferences.sourceLanguage ?? DEFAULT_SOURCE_LANGUAGE;
  elements.targetLanguage.value =
    preferences.targetLanguage ?? DEFAULT_TARGET_LANGUAGE;

  if (!elements.sourceLanguage.value) {
    elements.sourceLanguage.value = DEFAULT_SOURCE_LANGUAGE;
  }

  if (!elements.targetLanguage.value) {
    elements.targetLanguage.value = DEFAULT_TARGET_LANGUAGE;
  }

  renderHistory(elements, history);

  const translate = async ({ silent = false } = {}) => {
    const text = elements.inputText.value.trim();

    if (!text) {
      setOutput(elements, "A tradução aparecerá aqui...", {
        placeholder: true,
      });
      elements.outputMeta.textContent = "Esperando entrada";
      elements.detectedLanguage.textContent = "Idioma automático";
      lastTranslatedText = "";
      setStatus(elements, "Pronto", "idle");
      return;
    }

    const requestId = (lastRequestId += 1);
    setLoading(elements, true);

    try {
      const result = await translateText({
        text,
        sourceLanguage: elements.sourceLanguage.value,
        targetLanguage: elements.targetLanguage.value,
      });

      if (requestId !== lastRequestId) {
        return;
      }

      const detectedLanguage = normalizeLanguageCode(
        elements.sourceLanguage.value === "auto"
          ? result.detectedLanguage === "Autodetect"
            ? detectLikelyLanguage(text)
            : result.detectedLanguage
          : elements.sourceLanguage.value,
      );

      setOutput(elements, result.translatedText);
      lastTranslatedText = result.translatedText;
      elements.outputMeta.textContent = result.fromCache
        ? "Resposta em cache"
        : `Via ${result.provider}`;
      elements.detectedLanguage.textContent =
        getDetectionLabel(detectedLanguage);
      setStatus(elements, "Tradução concluída", "success");

      history = saveHistoryItem(elements, history, {
        sourceText: text,
        translatedText: result.translatedText,
        sourceLanguage: detectedLanguage,
        targetLanguage: elements.targetLanguage.value,
      });

      if (!silent) {
        showToast("Tradução concluída com sucesso.", "success");
      }
    } catch (error) {
      if (requestId !== lastRequestId) {
        return;
      }

      setOutput(
        elements,
        "Não foi possível traduzir agora. Verifique a conexão ou tente novamente.",
      );
      elements.outputMeta.textContent = "Falha na tradução";
      lastTranslatedText = "";
      setStatus(elements, "Erro na tradução", "error");
      showToast(error.message, "error");
    } finally {
      if (requestId === lastRequestId) {
        setLoading(elements, false);
      }
    }
  };

  const translateDebounced = debounce(() => translate({ silent: true }), 650);

  const speech = createSpeechRecognition({
    getLanguage: () => elements.sourceLanguage.value,
    onStart: () => {
      voiceHadError = false;
      setVoiceState(elements, {
        active: true,
        title: "Ouvindo...",
        message: "Fale naturalmente. A transcrição aparece em tempo real.",
      });
      setStatus(elements, "Ouvindo...", "listening");
    },
    onInterim: (transcript) => {
      elements.inputText.value = transcript;
      elements.outputMeta.textContent = "Capturando voz";
    },
    onResult: (transcript) => {
      elements.inputText.value = transcript;
      setVoiceState(elements, {
        active: false,
        title: "Fala capturada",
        message: "Texto preenchido automaticamente. Traduzindo agora.",
      });
      translate();
    },
    onEnd: () => {
      if (voiceHadError) {
        return;
      }

      setVoiceState(elements, {
        active: false,
        title: "",
        message: "",
      });
    },
    onError: (message) => {
      voiceHadError = true;
      setVoiceState(elements, {
        active: false,
        title: "Microfone indisponível",
        message,
      });
      setStatus(elements, "Falha no microfone", "error");
      showToast(message, "error");
    },
  });

  if (!speech.isSupported()) {
    setVoiceState(elements, {
      active: false,
      title: "Reconhecimento indisponível",
      message: "Este navegador não permite captura de voz.",
    });
    elements.microphone.disabled = true;
  }

  elements.inputText.addEventListener("input", () => {
    elements.outputMeta.textContent = "Aguardando pausa na digitação";
    translateDebounced();
  });

  elements.translateNow.addEventListener("click", () => translate());

  elements.clearText.addEventListener("click", () => {
    elements.inputText.value = "";
    elements.inputText.focus();
    translate({ silent: true });
    showToast("Texto limpo.", "info");
  });

  elements.copyText.addEventListener("click", async () => {
    const copied = await copyToClipboard(lastTranslatedText);

    showToast(
      copied ? "Tradução copiada." : "Nada para copiar.",
      copied ? "success" : "info",
    );
  });

  elements.useOutput.addEventListener("click", () => {
    const outputText = lastTranslatedText.trim();

    if (!outputText) {
      showToast("Ainda não há tradução para reutilizar.", "info");
      return;
    }

    elements.inputText.value = outputText;
    elements.inputText.focus();
    translateDebounced();
  });

  elements.microphone.addEventListener("click", () => {
    speech.toggle();
  });

  elements.swapLanguages.addEventListener("click", () => {
    const previousSource = elements.sourceLanguage.value;
    const previousTarget = elements.targetLanguage.value;

    elements.sourceLanguage.value = previousTarget;
    elements.targetLanguage.value =
      previousSource === "auto" ? "pt-BR" : previousSource;

    savePreferences(elements);
    translate({ silent: true });
    showToast("Idiomas invertidos.", "success");
  });

  elements.sourceLanguage.addEventListener("change", () => {
    savePreferences(elements);
    translateDebounced();
  });

  elements.targetLanguage.addEventListener("change", () => {
    savePreferences(elements);
    translateDebounced();
  });

  elements.historyList.addEventListener("click", (event) => {
    const itemButton = event.target.closest("[data-history-index]");

    if (!itemButton) {
      return;
    }

    const item = history[Number(itemButton.dataset.historyIndex)];
    elements.inputText.value = item.sourceText;
    elements.sourceLanguage.value = normalizeLanguageCode(item.sourceLanguage);
    elements.targetLanguage.value = item.targetLanguage;
    setOutput(elements, item.translatedText);
    lastTranslatedText = item.translatedText;
    elements.outputMeta.textContent = "Restaurado do histórico";
    elements.detectedLanguage.textContent = getDetectionLabel(
      item.sourceLanguage,
    );
    savePreferences(elements);
  });

  elements.clearHistory.addEventListener("click", () => {
    history = [];
    historyStorage.clear();
    renderHistory(elements, history);
    showToast("Histórico apagado.", "info");
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      translate();
    }

    if (event.ctrlKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      elements.clearText.click();
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      elements.swapLanguages.click();
    }
  });
}
