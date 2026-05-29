# Lexora Tradutor

Tradutor moderno com reconhecimento de voz, tradução em tempo real, histórico local e interface premium em HTML, CSS e JavaScript puro.

## Recursos

- Interface dark premium com glassmorphism, glow, partículas e responsividade fluida.
- Tradução com debounce, cache em memória, loading state e fallback de API.
- Reconhecimento de voz com transcrição em tempo real e tratamento de erros.
- Detecção automática de idioma, inversão de idiomas, copiar tradução e limpar texto.
- Histórico recente salvo no `localStorage`.
- Atalhos: `Ctrl + Enter` para traduzir, `Ctrl + K` para limpar e `Ctrl + Shift + S` para inverter idiomas.

## Como rodar

Use um servidor local, porque ES Modules e permissões de microfone funcionam melhor em `localhost` ou HTTPS.

```bash
python -m http.server 5500
```

Depois acesse:

```text
http://localhost:5500
```

Para reconhecimento de voz, use um navegador com suporte a captura de fala.
