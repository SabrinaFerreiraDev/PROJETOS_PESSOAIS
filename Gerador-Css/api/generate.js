const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
const model = "llama-3.3-70b-versatile";
const requestTimeoutMs = 30000;
const maxPromptLength = 20000;

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { message: "Metodo nao permitido." }, { Allow: "POST" });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return sendJson(response, 500, {
        message: "A chave da IA nao esta configurada. Defina GROQ_API_KEY na Vercel.",
      });
    }

    const body = await readRequestBody(request);
    const prompt = String(body.prompt || "").trim();
    const systemPrompt = String(body.systemPrompt || "").trim();

    if (!prompt) {
      return sendJson(response, 400, { message: "Descreva o componente antes de gerar." });
    }

    if (prompt.length > maxPromptLength) {
      return sendJson(response, 413, { message: "Prompt muito longo. Envie uma descricao mais objetiva." });
    }

    const groqPayload = await requestGroqCompletion({ apiKey, prompt, systemPrompt });
    const content = groqPayload?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return sendJson(response, 502, { message: "A IA retornou uma resposta invalida. Tente novamente." });
    }

    return sendJson(response, 200, { content });
  } catch (error) {
    const { status, message } = normalizeError(error);
    return sendJson(response, status, { message });
  }
};

async function requestGroqCompletion({ apiKey, prompt, systemPrompt }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const groqResponse = await fetch(groqApiUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "Voce e um gerador profissional de interfaces em HTML e CSS. Responda somente com codigo puro, sem markdown e sem explicacoes.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const payload = await groqResponse.json().catch(() => null);

    if (!groqResponse.ok) {
      throw createGroqError(groqResponse.status, payload);
    }

    if (!payload || typeof payload !== "object") {
      const error = new Error("Resposta invalida da IA.");
      error.status = 502;
      error.publicMessage = "A IA retornou uma resposta invalida. Tente novamente.";
      throw error;
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      error.status = 504;
      error.publicMessage = "A IA demorou para responder. Tente um prompt mais objetivo.";
    } else if (!error.publicMessage && isNetworkError(error)) {
      error.status = 503;
      error.publicMessage = "Nao foi possivel conectar com a IA. Tente novamente em instantes.";
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readRequestBody(request) {
  if (request.body !== undefined) {
    return parseRequestBody(request.body);
  }

  return parseRequestStream(request);
}

function parseRequestBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  if (Buffer.isBuffer(body)) return parseRequestBody(body.toString("utf8"));

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      const error = new Error("Payload invalido.");
      error.status = 400;
      error.publicMessage = "Nao foi possivel ler sua solicitacao. Recarregue a pagina e tente novamente.";
      throw error;
    }
  }

  const error = new Error("Payload invalido.");
  error.status = 400;
  error.publicMessage = "Nao foi possivel ler sua solicitacao. Recarregue a pagina e tente novamente.";
  throw error;
}

function parseRequestStream(request) {
  return new Promise((resolve, reject) => {
    let data = "";

    request.on("data", (chunk) => {
      data += chunk;

      if (data.length > maxPromptLength) {
        const error = new Error("Payload muito longo.");
        error.status = 413;
        error.publicMessage = "Prompt muito longo. Envie uma descricao mais objetiva.";
        reject(error);
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(parseRequestBody(data));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", () => {
      const error = new Error("Falha ao ler payload.");
      error.status = 400;
      error.publicMessage = "Nao foi possivel ler sua solicitacao. Recarregue a pagina e tente novamente.";
      reject(error);
    });
  });
}

function createGroqError(status, payload) {
  const error = new Error(payload?.error?.message || "Falha ao gerar codigo.");
  error.status = status;

  if (status === 401 || status === 403) {
    error.publicMessage = "A chave da IA esta invalida ou sem permissao.";
  } else if (status === 429) {
    error.publicMessage = "Limite de requisicoes atingido. Tente novamente em instantes.";
  } else if (status >= 500) {
    error.publicMessage = "A IA esta temporariamente indisponivel. Tente novamente em instantes.";
  } else if (status === 400) {
    error.publicMessage = "A IA nao conseguiu processar esse pedido. Ajuste o prompt e tente novamente.";
  } else {
    error.publicMessage = "Falha ao gerar codigo. Tente novamente.";
  }

  return error;
}

function normalizeError(error) {
  return {
    status: Number(error.status || 500),
    message: error.publicMessage || "Conexao indisponivel. Tente novamente em instantes.",
  };
}

function isNetworkError(error) {
  return error instanceof TypeError || ["ECONNRESET", "ENOTFOUND", "ETIMEDOUT"].includes(error.code);
}

function sendJson(response, status, payload, headers = {}) {
  response.statusCode = status;

  Object.entries({
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  }).forEach(([key, value]) => response.setHeader(key, value));

  response.end(JSON.stringify(payload));
}
