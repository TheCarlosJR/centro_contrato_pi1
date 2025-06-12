
// Obtem letra da planilha pelo indice (comeca em 0)
function index2Letra(indice)
{
    let letra = '';
    indice++; // Ajusta para começar em A=1, B=2, ..., AA=27, etc.
    while (indice > 0)
    {
        const resto = (indice - 1) % 26;
        letra = String.fromCharCode(65 + resto) + letra;
        indice = Math.floor((indice - resto) / 26);
    }
    return letra;
}

// Obtem indice (comeca em 0) pela letra da planilha
function letra2Index(colunaLetra)
{
    let indice = 0;
    colunaLetra = colunaLetra.toUpperCase(); // Garante que esteja em maiúsculas
    for (let i = 0; i < colunaLetra.length; i++)
    {
        const codigo = colunaLetra.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
        indice = indice * 26 + codigo;
    }
    return indice - 1; // Ajusta para começar em 0 (A=0, B=1, ..., AA=26, etc.)
}

module.exports = {
    index2Letra,
    letra2Index
};
  