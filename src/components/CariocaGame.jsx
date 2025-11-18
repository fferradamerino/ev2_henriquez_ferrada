import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const pintas = ["diamante", "corazon", "trebol", "pica"];

export function CariocaGame() {
  const [numero, setNumero] = useState("");
  const [pinta, setPinta] = useState("pica");
  const [cartas, setCartas] = useState([]);
  const [resultado, setResultado] = useState("");

  // --- Helpers num <-> display ---
  const convertirNumero = (valor) => {
    if (!valor) return NaN;
    const v = String(valor).trim().toUpperCase();
    if (v === "A") return 1;
    if (v === "J") return 11;
    if (v === "Q") return 12;
    if (v === "K") return 13;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : NaN;
  };

  const mostrarNumero = (n) => {
    if (n === 1) return "A";
    if (n === 11) return "J";
    if (n === 12) return "Q";
    if (n === 13) return "K";
    return n;
  };

  // --- Agregar carta ---
  const agregarCarta = () => {
    if (!String(numero).trim()) return;

    const convertido = convertirNumero(numero);
    if (isNaN(convertido) || convertido < 1 || convertido > 13) {
      setResultado("Número inválido (1-13, A, J, Q, K)");
      return;
    }

    const nueva = {
      id: crypto.randomUUID(),
      numero: convertido,
      pinta
    };

    setCartas(prev => [...prev, nueva]);
    setNumero("");
    setResultado("");
  };

  // --- Eliminar carta ---
  const eliminarCarta = (id) => {
    setCartas(prev => prev.filter(c => c.id !== id));
  };

  // --- Escalera (3 cartas) ---
  const esEscalera = (grupo) => {
    if (!grupo || grupo.length !== 3) return false;
    const mismaPinta = grupo.every(c => c.pinta === grupo[0].pinta);
    if (!mismaPinta) return false;
    const orden = [...grupo].sort((a, b) => a.numero - b.numero);
    return orden[1].numero === orden[0].numero + 1 &&
           orden[2].numero === orden[1].numero + 1;
  };

  // --- Encontrar todas las posibles escalas por pinta ---
  const encontrarEscalasPorPinta = (listaCartas) => {
    const porPinta = {};
    listaCartas.forEach(c => {
      if (!porPinta[c.pinta]) porPinta[c.pinta] = [];
      porPinta[c.pinta].push(c);
    });

    const todas = [];
    for (const p in porPinta) {
      const arr = porPinta[p].slice().sort((a, b) => a.numero - b.numero);
      for (let i = 0; i <= arr.length - 3; i++) {
        const grupo = [arr[i], arr[i+1], arr[i+2]];
        if (esEscalera(grupo)) {
          todas.push(grupo);
        }
      }
    }
    return todas; // array de grupos (cada grupo = 3 cartas)
  };

  // --- Buscar combinación de 3 escalas disjuntas ---
  const encontrarTresEscalasDisjuntas = (listaCartas) => {
    const posibles = encontrarEscalasPorPinta(listaCartas);
    // convertir cada grupo a set de ids para chequear intersección
    const gruposIds = posibles.map(g => g.map(c => c.id));

    // backtracking para elegir 3 grupos sin solapamiento
    const n = gruposIds.length;
    const result = [];

    const backtrack = (start, chosen) => {
      if (chosen.length === 3) {
        result.push(chosen.map(idx => posibles[idx]));
        return true; // podemos parar si solo necesitamos una combinación
      }
      for (let i = start; i < n; i++) {
        const idsI = gruposIds[i];
        const clash = chosen.some(ci => gruposIds[ci].some(id => idsI.includes(id)));
        if (clash) continue;
        if (backtrack(i + 1, [...chosen, i])) return true;
      }
      return false;
    };

    backtrack(0, []);
    // result[0] si existe, else undefined
    return result.length ? result[0] : null;
  };

  // --- Ordenar por Escalera: agrupa las 3 escalas encontradas al inicio (si existen) ---
  const ordenarPorEscalera = () => {
    const encontrado = encontrarTresEscalasDisjuntas(cartas);
    if (!encontrado) {
      setResultado("No se encontraron 3 escalas completas para agrupar.");
      // opcional: breve clear del mensaje en unos segundos
      setTimeout(() => setResultado(""), 2000);
      return;
    }

    // Flatten grupos (cada grupo ya es 3 cartas). Queremos suprimir duplicados y mantener
    // el resto de cartas al final en su orden actual.
    const idsEnGrupos = new Set(encontrado.flat().map(c => c.id));
    const resto = cartas.filter(c => !idsEnGrupos.has(c.id));

    // Ordeno cada grupo internamente por número asc para presentación limpia
    const gruposOrdenados = encontrado.map(g => g.slice().sort((a,b)=>a.numero-b.numero));

    // Construyo nuevo array: grupos concatenados + resto
    const nuevoOrden = [].concat(...gruposOrdenados, ...resto);
    setCartas(nuevoOrden);
    setResultado("Se agruparon 3 escalas correctamente.");
    setTimeout(() => setResultado(""), 2200);
  };

  // --- Ordenar por número ---
  const ordenarPorNumero = () => {
    setCartas(prev => [...prev].sort((a,b) => a.numero - b.numero));
  };

  // --- Ordenar por pinta ---
  const ordenarPorPinta = () => {
    setCartas(prev => [...prev].sort((a,b) => a.pinta.localeCompare(b.pinta) || a.numero - b.numero));
  };

  // --- (Opcional) Validar juego y guardar en Firebase (si quieres usarlo) ---
  const validarJuego = async () => {
    // Reutilizamos la detección: para considerar válido hay que tener 3 escalas disjuntas
    const encontrado = encontrarTresEscalasDisjuntas(cartas);
    if (!encontrado) {
      setResultado("NO FORMA JUEGO :C");
      return;
    }

    // Guardar
    await addDoc(collection(db, "jugadascarioca"), {
      cartas,
      timestamp: new Date()
    });

    setResultado("¡3 ESCALAS CORRECTAS! ✔");
    // limpiar tablero
    setCartas([]);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Juego de Carioca</h2>

      {/* Inputs */}
      <div className="d-flex gap-2 align-items-center">
        <input
          className="form-control"
          type="text"
          placeholder="Número (A,2..10,J,Q,K)"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />

        <select
          className="form-select"
          value={pinta}
          onChange={(e) => setPinta(e.target.value)}
        >
          {pintas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <motion.button
          className="btn btn-primary"
          onClick={agregarCarta}
          whileTap={{ scale: 0.9 }}
          // pequeño "bump" rápido al agregar (se activará siempre, si quieres solo cuando hay agregado, se puede ajustar)
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 0.18 }}
        >
          Agregar
        </motion.button>

        <button className="btn btn-secondary" onClick={ordenarPorNumero}>
          Ordenar por Número
        </button>

        <button className="btn btn-secondary" onClick={ordenarPorPinta}>
          Ordenar por Pinta
        </button>

        <button className="btn btn-warning" onClick={ordenarPorEscalera}>
          Ordenar por Escalera
        </button>
      </div>

      {/* Cartas */}
      <div className="d-flex gap-3 mt-4 flex-wrap">
        <AnimatePresence>
          {cartas.map(carta => (
            <motion.div
              layout
              key={carta.id}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3, rotate: 90 }}
              transition={{ duration: 0.28 }}
              className="position-relative p-2 border rounded shadow-sm d-flex flex-column justify-content-between"
              style={{
                width: "78px",
                height: "110px",
                background: "white",
                minWidth: "78px"
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <small>{mostrarNumero(carta.numero)}</small>
                <small className="text-muted" style={{ fontSize: 12 }}>{carta.pinta[0].toUpperCase()}</small>
              </div>

              <div className="d-flex align-items-center justify-content-center" style={{ fontSize: 20 }}>
                {mostrarNumero(carta.numero)}
              </div>

              <div className="d-flex justify-content-between align-items-end">
                <small style={{ fontSize: 12 }}>{carta.pinta}</small>

                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => eliminarCarta(carta.id)}
                >
                  X
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controles inferiores */}
      <div className="mt-3 d-flex gap-2">
        <button className="btn btn-success" onClick={validarJuego}>Validar Juego</button>
      </div>

      {/* Resultado animado */}
      {resultado && (
        <motion.h1
          className="mt-3"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {resultado}
        </motion.h1>
      )}
    </div>
  );
}
