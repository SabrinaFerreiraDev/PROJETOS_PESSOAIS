import {
  detectLikelyLanguage,
  getLanguageName,
  normalizeLanguageForApi,
} from "../utils/languages.js";

const MY_MEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const LINGVA_ENDPOINTS = [
  "https://lingva.ml/api/v1",
  "https://translate.plausibility.cloud/api/v1",
];

const cache = new Map();

function createCacheKey({ text, sourceLanguage, targetLanguage }) {
  return [text.trim().toLowerCase(), sourceLanguage, targetLanguage].join("::");
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function decodeHTMLEntities(text) {
  if (!text || typeof DOMParser === "undefined") {
    return text;
  }

  return new DOMParser().parseFromString(text, "text/html").documentElement
    .textContent;
}

async function translateWithMyMemory({ text, sourceLanguage, targetLanguage }) {
  const from = normalizeLanguageForApi(sourceLanguage);
  const to = normalizeLanguageForApi(targetLanguage);
  const url = new URL(MY_MEMORY_ENDPOINT);

  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${from}|${to}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("A API principal não respondeu corretamente.");
  }

  const data = await response.json();
  const translatedText = data?.responseData?.translatedText;

  if (
    data?.responseStatus >= 400 ||
    !translatedText ||
    translatedText.includes("MYMEMORY WARNING")
  ) {
    throw new Error("A API principal não retornou tradução.");
  }

  return {
    translatedText: decodeHTMLEntities(translatedText),
    provider: "MyMemory",
    detectedLanguage:
      data?.responseData?.detectedLanguage ??
      data?.matches?.[0]?.segmentLanguage ??
      sourceLanguage,
  };
}

async function translateWithLingva({ text, sourceLanguage, targetLanguage }) {
  const source = sourceLanguage === "auto" ? detectLikelyLanguage(text) : sourceLanguage;
  const from = normalizeLanguageForApi(source).replace("Autodetect", "auto");
  const to = normalizeLanguageForApi(targetLanguage);
  const encodedText = encodeURIComponent(text);
  let lastError;

  for (const endpoint of LINGVA_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}/${from}/${to}/${encodedText}`);

      if (!response.ok) {
        throw new Error("Fallback indisponível.");
      }

      const data = await response.json();
      const translatedText = data?.translation;

      if (!translatedText) {
        throw new Error("Fallback não retornou tradução.");
      }

      return {
        translatedText: decodeHTMLEntities(translatedText),
        provider: "Lingva",
        detectedLanguage: source,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Nenhum fallback de tradução respondeu.");
}

export async function translateText({ text, sourceLanguage, targetLanguage }) {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return {
      translatedText: "",
      detectedLanguage: sourceLanguage,
      provider: null,
    };
  }

  const resolvedSource =
    sourceLanguage === "auto" ? "Autodetect" : sourceLanguage;
  const cacheKey = createCacheKey({
    text: normalizedText,
    sourceLanguage: resolvedSource,
    targetLanguage,
  });

  if (cache.has(cacheKey)) {
    return {
      ...cache.get(cacheKey),
      fromCache: true,
    };
  }

  try {
    const result = await translateWithMyMemory({
      text: normalizedText,
      sourceLanguage: resolvedSource,
      targetLanguage,
    });

    cache.set(cacheKey, result);
    return result;
  } catch (primaryError) {
    try {
      const fallbackResult = await translateWithLingva({
        text: normalizedText,
        sourceLanguage,
        targetLanguage,
      });

      cache.set(cacheKey, fallbackResult);
      return fallbackResult;
    } catch {
      throw new Error(
        `${primaryError.message} Tente novamente em alguns segundos.`,
      );
    }
  }
}

export function getDetectionLabel(detectedLanguage) {
  if (!detectedLanguage || detectedLanguage === "Autodetect") {
    return "Idioma detectado automaticamente";
  }

  return `Idioma detectado: ${getLanguageName(detectedLanguage)}`;
}
