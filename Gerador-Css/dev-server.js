const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const basePort = Number(process.env.PORT || 5173);
const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
const model = "llama-3.3-70b-versatile";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const env = loadEnv();
const apiKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || "";

createServer(basePort);

function createServer(port) {
  const server = http.createServer(async (request, response) => {
    if (request.url === "/api/generate" && request.method === "POST") {
      await handleGenerate(request, response);
      return;
    }

    const requestedPath = decodeURIComponent(request.url.split("?")[0]);
    const pathname = requestedPath === "/" ? "/index.html" : requestedPath;
    const filePath = path.normalize(path.join(root, pathname));

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      });
      response.end(data);
    });
  });

  server.on("error", () => createServer(port + 1));
  server.listen(port, "127.0.0.1", () => {
    console.log(`http://127.0.0.1:${port}`);
  });
}

async function handleGenerate(request, response) {
  try {
    if (!apiKey) {
      sendJson(response, 500, { message: "Defina GROQ_API_KEY no arquivo .env." });
      return;
    }

    const body = await readJsonBody(request);
    const prompt = String(body.prompt || "").trim();
    const systemPrompt = String(body.systemPrompt || "").trim();

    if (!prompt) {
      sendJson(response, 400, { message: "Descreva o componente antes de gerar." });
      return;
    }

    const groqResponse = await fetch(groqApiUrl, {
      method: "POST",
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
      sendJson(response, groqResponse.status, { message: getGroqErrorMessage(groqResponse.status, payload) });
      return;
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      sendJson(response, 502, { message: "Resposta invalida da IA." });
      return;
    }

    sendJson(response, 200, { content });
  } catch (error) {
    sendJson(response, 500, { message: error.message || "Conexao indisponivel." });
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";

    request.on("data", (chunk) => {
      data += chunk;

      if (data.length > 20000) {
        reject(new Error("Prompt muito longo."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Payload invalido."));
      }
    });
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function getGroqErrorMessage(status, payload) {
  if (status === 401 || status === 403) return "Chave da API invalida ou sem permissao.";
  if (status === 429) return "Limite de requisicoes atingido. Tente novamente em instantes.";
  if (status >= 500) return "Conexao indisponivel com a IA.";
  return payload?.error?.message || "Falha ao gerar codigo.";
}

function loadEnv() {
  const envPath = path.join(root, ".env");

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return acc;
      }

      const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!match) {
        return acc;
      }

      const key = match[1];
      const value = match[2].replace(/^["']|["']$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}
