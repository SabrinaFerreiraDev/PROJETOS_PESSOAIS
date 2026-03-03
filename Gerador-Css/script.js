/* 
    Variável - Pedacinho de memória
    que eu posso guardar o que eu quiser

    Função - Pedacinho de código QUE só EXECUTA
    Quando é chamado

    Algoritmo - Receita do Bolo
    Lógica de Programação -  Fazer o bolo

    // Algoritmo do nosso sistema
    // Lógica de programação

    [x] Saber quem é o botão
    [x] Saber quando o botão foi clicado
    [x] Saber quem é o textarea  
    [x] Pegar o que tem dentro dele
    [x] Enviar para a IA
    [x] Pegar a resposta da IA e colocar na tela 
    [ ] Estilizar a resposta     

    // Ir no HTML e pegar o botão
    // HTML = document (documento)
    // Selecionar (querySelector)
    // Quem ? Botão
    // Apelido para o botão - classes(class) = .
    fetch - ferramenta do JS para se comunicar com o servidor
*/
let botao = document.querySelector(".botao-gerar")
let endereco = "https://api.groq.com/openai/v1/chat/completions"

const ChaveApi =config.VITE_GROQ_API_KEY;
// Criei a funcao que será chamada quando clicar 
// no botao
const botaoApagar = document.querySelector(".botao-Apagar")
const botaoCopiar = document.querySelector(".botao-Copiar")
botaoApagar.addEventListener("click",function(){
    document.querySelector(".caixa-texto").value = ""
    document.querySelector(".bloco-codigo").innerHTML = ""
    document.querySelector(".resultado-codigo").srcdoc = ""
})

async function gerarCodigo() {

    let textoUsuario = document.querySelector(".caixa-texto").value
    let blocoCodigo = document.querySelector(".bloco-codigo")
    let resultadoCodigo = document.querySelector(".resultado-codigo")

    let resposta = await fetch(endereco, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + ChaveApi,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "Você é um gerador de código HTML e CSS. Responda SOMENTE com código puro. NUNCA use crases, markdown ou explicações. Formato: primeiro <style> com o CSS, depois o HTML. Siga EXATAMENTE o que o usuário pedir. Se pedir algo quicando, use translateY no @keyframes. Se pedir algo girando, use rotate.",
          },
          {
            role: "user",
            content: textoUsuario,
          },
        ],
      }),
    });

    let dados = await resposta.json()
    let resultado = dados.choices[0].message.content
    botaoCopiar.addEventListener("click",function(){
        navigator.clipboard.writeText(resultado)
    })
    blocoCodigo.textContent = resultado
    resultadoCodigo.srcdoc = resultado
    
}

// ficar de olho no botao, quando clicado chamar o gerarCodigo
botao.addEventListener("click", gerarCodigo)


// vizinho curioso (addEventListener)
// adicionar ouvinte de eventos
// Evento = clique, digitei...


