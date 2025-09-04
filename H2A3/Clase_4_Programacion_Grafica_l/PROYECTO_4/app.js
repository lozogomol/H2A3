const inputLimite = document.getElementById("limite");
const botonGenerarTodo = document.getElementById("generarTodo");
const salidaPrimos = document.getElementById("salidaPrimos");
const salidaParesImpares = document.getElementById("salidaParesImpares");
const botonBuscar = document.getElementById("buscar");
const inputPalabra = document.getElementById("palabra");
const resultadoBusqueda = document.getElementById("resultadoBusqueda");
const inputParrafo = document.getElementById("parrafo");

function procesarParrafo(texto) {
  return texto
    .toLowerCase()
    .replace(/[^\w\sáéíóúñ]/g, "")
    .split(/\s+/)
    .filter(p => p.length > 0)
    .sort();
}

function busquedaBinaria(arr, palabra) {
  let inicio = 0, fin = arr.length - 1;
  while (inicio <= fin) {
    const medio = Math.floor((inicio + fin) / 2);
    if (arr[medio] === palabra) return true;
    if (arr[medio] < palabra) inicio = medio + 1;
    else fin = medio - 1;
  }
  return false;
}

function crearWorker(fn) {
  const blob = new Blob(["onmessage = " + fn.toString()], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

function workerSegmento(e) {
  const { inicio, fin, primosBase } = e.data;
  let esPrimo = new Array(fin - inicio + 1).fill(true);
  for (let p of primosBase) {
    let start = Math.max(p * p, Math.ceil(inicio / p) * p);
    for (let j = start; j <= fin; j += p) esPrimo[j - inicio] = false;
  }
  const primos = [];
  for (let i = inicio; i <= fin; i++) if (i > 1 && esPrimo[i - inicio]) primos.push(i);
  postMessage(primos);
}

function workerParesImpares(e) {
  const limite = e.data;
  let pares = [], impares = [];
  for (let i = 1; i <= limite; i++) {
    pares.push(i * 2);
    impares.push(i * 2 - 1);
  }
  postMessage({ pares, impares });
}

botonGenerarTodo.addEventListener("click", () => {
  const limite = parseInt(inputLimite.value);
  salidaPrimos.textContent = "Calculando primos...\n";
  salidaParesImpares.textContent = "Calculando pares e impares...\n";

  const raiz = Math.floor(Math.sqrt(limite));
  let esPrimoBase = new Array(raiz + 1).fill(true);
  esPrimoBase[0] = esPrimoBase[1] = false;
  for (let i = 2; i * i <= raiz; i++) if (esPrimoBase[i]) for (let j = i * i; j <= raiz; j += i) esPrimoBase[j] = false;
  const primosBase = [];
  for (let i = 2; i <= raiz; i++) if (esPrimoBase[i]) primosBase.push(i);

  const numWorkers = 4;
  const tamSegmento = Math.floor((limite - raiz) / numWorkers);
  let resultados = [], terminados = 0;
  for (let k = 0; k < numWorkers; k++) {
    const inicio = raiz + 1 + k * tamSegmento;
    const fin = (k === numWorkers - 1) ? limite : inicio + tamSegmento - 1;
    const w = crearWorker(workerSegmento);
    w.onmessage = (e) => {
      resultados = resultados.concat(e.data);
      terminados++;
      if (terminados === numWorkers) {
        const todosPrimos = primosBase.concat(resultados).sort((a, b) => a - b);
        salidaPrimos.textContent = `Cantidad total de primos hasta ${limite}: ${todosPrimos.length}\n\n${todosPrimos.join(", ")}`;
      }
    };
    w.postMessage({ inicio, fin, primosBase });
  }

  const wParesImpares = crearWorker(workerParesImpares);
  wParesImpares.onmessage = (e) => {
    salidaParesImpares.textContent = `Pares (${e.data.pares.length}):\n${e.data.pares.join(", ")}\n\nImpares (${e.data.impares.length}):\n${e.data.impares.join(", ")}`;
  };
  wParesImpares.postMessage(limite);
});

botonBuscar.addEventListener("click", () => {
  const textoParrafo = inputParrafo.value.trim();
  const palabra = inputPalabra.value.trim().toLowerCase();
  if (!textoParrafo) {
    resultadoBusqueda.textContent = "Por favor escribe un párrafo.";
    return;
  }
  if (!palabra) {
    resultadoBusqueda.textContent = "Escribe una palabra para buscar.";
    return;
  }
  const palabrasOrdenadas = procesarParrafo(textoParrafo);
  if (busquedaBinaria(palabrasOrdenadas, palabra)) {
    resultadoBusqueda.textContent = `"${palabra}" sí existe en el párrafo.`;
  } else {
    resultadoBusqueda.textContent = `"${palabra}" no existe en el párrafo.`;
  }
});
