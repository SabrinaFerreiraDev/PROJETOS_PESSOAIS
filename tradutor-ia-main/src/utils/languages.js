export const DEFAULT_SOURCE_LANGUAGE = "auto";
export const DEFAULT_TARGET_LANGUAGE = "en";

export const languages = [
  { code: "auto", name: "Detectar automaticamente", speechCode: "pt-BR" },
  { code: "pt-BR", name: "Português (Brasil)", speechCode: "pt-BR" },
  { code: "en", name: "Inglês", speechCode: "en-US" },
  { code: "es", name: "Espanhol", speechCode: "es-ES" },
  { code: "fr", name: "Francês", speechCode: "fr-FR" },
  { code: "de", name: "Alemão", speechCode: "de-DE" },
  { code: "it", name: "Italiano", speechCode: "it-IT" },
  { code: "ja", name: "Japonês", speechCode: "ja-JP" },
  { code: "ko", name: "Coreano", speechCode: "ko-KR" },
  { code: "ru", name: "Russo", speechCode: "ru-RU" },
  { code: "sv", name: "Sueco", speechCode: "sv-SE" },
  { code: "tr", name: "Turco", speechCode: "tr-TR" },
];

const languageByCode = new Map(languages.map((language) => [language.code, language]));
const aliases = new Map([
  ["pt", "pt-BR"],
  ["pt-PT", "pt-BR"],
  ["en-US", "en"],
  ["en-GB", "en"],
  ["es-ES", "es"],
  ["fr-FR", "fr"],
  ["de-DE", "de"],
  ["it-IT", "it"],
  ["ja-JP", "ja"],
  ["ko-KR", "ko"],
  ["ru-RU", "ru"],
  ["sv-SE", "sv"],
  ["tr-TR", "tr"],
]);

export function normalizeLanguageCode(code) {
  return aliases.get(code) ?? code;
}

export function getLanguageName(code) {
  const normalizedCode = normalizeLanguageCode(code);
  return languageByCode.get(normalizedCode)?.name ?? normalizedCode;
}

export function getSpeechLanguage(code) {
  return languageByCode.get(normalizeLanguageCode(code))?.speechCode ?? "pt-BR";
}

export function renderLanguageOptions(select, { includeAuto = true } = {}) {
  select.innerHTML = languages
    .filter((language) => includeAuto || language.code !== "auto")
    .map(
      (language) =>
        `<option value="${language.code}">${language.name}</option>`,
    )
    .join("");
}

export function normalizeLanguageForApi(code) {
  if (code === "auto") {
    return "Autodetect";
  }

  if (code === "pt-BR") {
    return "pt";
  }

  return code;
}

export function detectLikelyLanguage(text) {
  const normalizedText = text.toLowerCase();

  if (/[ぁ-んァ-ン一-龯]/.test(text)) return "ja";
  if (/[가-힣]/.test(text)) return "ko";
  if (/[а-яё]/i.test(text)) return "ru";

  const patterns = [
    {
      code: "pt-BR",
      words: ["ção", "ões", "você", "não", "para", "com", "obrigado"],
    },
    {
      code: "es",
      words: ["que", "para", "usted", "gracias", "hola", "ción", "está"],
    },
    {
      code: "fr",
      words: ["bonjour", "merci", "vous", "avec", "être", "tion", "pour"],
    },
    {
      code: "de",
      words: ["und", "ich", "nicht", "danke", "hallo", "sch", "für"],
    },
    {
      code: "it",
      words: ["ciao", "grazie", "per", "che", "sono", "zione", "con"],
    },
    {
      code: "tr",
      words: ["merhaba", "teşekkür", "için", "ğ", "ş", "ı", "ç"],
    },
    {
      code: "sv",
      words: ["hej", "tack", "och", "för", "är", "å", "ä", "ö"],
    },
  ];

  const bestMatch = patterns
    .map((language) => ({
      code: language.code,
      score: language.words.filter((word) => normalizedText.includes(word))
        .length,
    }))
    .sort((a, b) => b.score - a.score)[0];

  return bestMatch?.score ? bestMatch.code : "en";
}
