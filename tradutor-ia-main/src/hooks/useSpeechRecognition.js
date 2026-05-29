import { getSpeechLanguage } from "../utils/languages.js";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const errorMessages = {
  "not-allowed": "Permissão negada. Libere o microfone no navegador.",
  "service-not-allowed": "Serviço de voz bloqueado pelo navegador.",
  "no-speech": "Nenhuma fala detectada. Tente falar mais perto do microfone.",
  "audio-capture": "Microfone indisponível ou não encontrado.",
  network: "Falha de rede no reconhecimento de voz.",
  aborted: "Reconhecimento de voz interrompido.",
};

export function createSpeechRecognition({
  getLanguage,
  onStart,
  onResult,
  onInterim,
  onEnd,
  onError,
}) {
  let recognition;
  let isListening = false;
  let shouldRestart = false;

  function isSupported() {
    return Boolean(SpeechRecognition);
  }

  async function ensurePermission() {
    if (!navigator.permissions?.query) {
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: "microphone" });

      if (permission.state === "denied") {
        throw new Error(errorMessages["not-allowed"]);
      }
    } catch (error) {
      if (error.message === errorMessages["not-allowed"]) {
        throw error;
      }
    }
  }

  function createInstance() {
    const instance = new SpeechRecognition();
    instance.continuous = false;
    instance.interimResults = true;
    instance.maxAlternatives = 1;
    instance.lang = getSpeechLanguage(getLanguage());

    instance.onstart = () => {
      isListening = true;
      onStart?.();
    };

    instance.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;

        if (event.results[index].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        onInterim?.(interimTranscript.trim());
      }

      if (finalTranscript) {
        onResult?.(finalTranscript.trim());
      }
    };

    instance.onerror = (event) => {
      const message =
        errorMessages[event.error] ??
        "Não foi possível iniciar o reconhecimento de voz.";

      shouldRestart = false;
      onError?.(message, event.error);
    };

    instance.onend = () => {
      isListening = false;
      onEnd?.();

      if (shouldRestart) {
        window.setTimeout(() => start(), 180);
      }
    };

    return instance;
  }

  async function start() {
    if (!isSupported()) {
      onError?.("Reconhecimento de voz indisponível neste navegador.");
      return false;
    }

    if (isListening) {
      return true;
    }

    try {
      await ensurePermission();
      shouldRestart = false;
      recognition = createInstance();
      recognition.start();
      return true;
    } catch (error) {
      onError?.(
        error.message || "Permissão negada ou microfone indisponível.",
      );
      return false;
    }
  }

  function stop() {
    shouldRestart = false;

    if (recognition && isListening) {
      recognition.stop();
    }
  }

  function toggle() {
    if (isListening) {
      stop();
      return false;
    }

    start();
    return true;
  }

  return {
    isSupported,
    start,
    stop,
    toggle,
    get listening() {
      return isListening;
    },
  };
}
