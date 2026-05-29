import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function cleanTranscript(transcript) {
  return transcript
    .replace(/[.!?]+$/g, "")
    .replace(/\b(previsão|tempo|clima)\b/gi, "")
    .replace(/\b(em|para|na|no)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function useSpeechRecognition({ onResult, onError }) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => Boolean(getSpeechRecognition()));

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      onError?.("Reconhecimento de voz indisponível neste navegador.");
      return;
    }

    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Permissão do microfone negada."
          : "Não consegui ouvir com clareza. Tente novamente.";

      setIsListening(false);
      onError?.(message);
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const city = cleanTranscript(transcript);

      if (!city) {
        onError?.("Não identifiquei a cidade. Tente falar novamente.");
        return;
      }

      onResult?.(city);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onError, onResult]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
}
