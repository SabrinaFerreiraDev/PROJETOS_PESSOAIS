
const botaoFiltra = document.querySelector('.btn-filtra');
botaoFiltra.addEventListener("click", function () {
    const categoriaSelecionada = document.querySelector('#categoria').value;
    const precoMaximoSelecionado = document.querySelector('#preco').value;
    const cartas = document.querySelectorAll('.carta');

        cartas.forEach(function(carta){
            const categoriaCarta=carta.dataset.categoria;
            const precoCarta=carta.dataset.preco;

            let mostrarCarta=true;

            const temFiltroDeCategoria=categoriaSelecionada !== '';

            const cartaNaoBate=categoriaSelecionada.toLowerCase() !== categoriaCarta.toLowerCase();

            if(temFiltroDeCategoria && cartaNaoBate){
                mostrarCarta=false;
            }
            if(precoMaximoSelecionado !== '' && parseFloat(precoCarta) > parseFloat(precoMaximoSelecionado)){
                mostrarCarta=false;
            }
            if(mostrarCarta){
                carta.classList.add('mostrar');
                carta.classList.remove('esconder');
            }else{
                carta.classList.remove('mostrar');
                carta.classList.add('esconder');
                
            }


    });

});