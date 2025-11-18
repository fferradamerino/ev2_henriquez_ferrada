import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const pintas = ["diamante", "corazon", "trebol", "pica"];

export function CariocaGame() {
  const [numero, setNumero] = useState("");
  const [pinta, setPinta] = useState("pica");
  const [cartas, setCartas] = useState([]);
  const [resultado, setResultado] = useState("");

  // -------------------------------
  // 1) Agregar Carta
  // -------------------------------
  const agregarCarta = () => {
  if (!numero.trim()) return;
    if (!numero.trim()) return;

    if (numero === "K") {
      numero = 13
    } else if (numero === "Q") {
      numero = 12
    } else if (numero === "J") {
      numero = 11
    } else if (numero === "A") {
      numero = 1
    }

    console.log(numero)

  const convertido = convertirNumero(numero);
  if (isNaN(convertido) || convertido < 1 || convertido > 13) return; // valida rango 1-13

  const nueva = {
    id: crypto.randomUUID(),
    numero: convertido,
    pinta
  };

  setCartas([...cartas, nueva]);
  setNumero("");
};

  const convertirNumero = (valor) => {
  const v = valor.toUpperCase();
  if (v === "A") return 1;
  if (v === "J") return 11;
  if (v === "Q") return 12;
  if (v === "K") return 13;
  return parseInt(v); // números 2–10
};

  const mostrarNumero = (numero) => {
  if (numero === 1) return "A";
  if (numero === 11) return "J";
  if (numero === 12) return "Q";
  if (numero === 13) return "K";
  return numero;
};


  // -------------------------------
  // 2) Eliminar carta con animación
  // -------------------------------
  const eliminarCarta = (id) => {
    setCartas(cartas.filter(c => c.id !== id));
  };

  // -------------------------------
  // 3) Validación: SOLO escaleras
  // aceptamos **3 cartas consecutivas**
  // -------------------------------
  const esEscalera = (grupo) => {
  if (grupo.length !== 3) return false;

  const mismaPinta = grupo.every(c => c.pinta === grupo[0].pinta);
  if (!mismaPinta) return false;

  const orden = [...grupo].sort((a, b) => a.numero - b.numero);

  return (
    orden[1].numero === orden[0].numero + 1 &&
    orden[2].numero === orden[1].numero + 1
  );
};

const detectarTresEscalas = () => {
  if (cartas.length < 9) return false;

  // Agrupar cartas por pinta
  const porPinta = {};
  cartas.forEach(c => {
    if (!porPinta[c.pinta]) porPinta[c.pinta] = [];
    porPinta[c.pinta].push(c);
  });

  let totalEscalas = 0;

  // Por cada pinta buscamos todas las escalas posibles
  for (const pinta in porPinta) {
    const lista = porPinta[pinta].sort((a, b) => a.numero - b.numero);

    // Buscar secuencias de 3 consecutivos
    for (let i = 0; i < lista.length - 2; i++) {
      const grupo = [lista[i], lista[i + 1], lista[i + 2]];
      if (esEscalera(grupo)) {
        totalEscalas++;
      }
    }
  }

  return totalEscalas === 3;
};


  // -------------------------------
  // Validar y guardar
  // -------------------------------
const validarJuego = async () => {
  if (!detectarTresEscalas()) {
    setResultado("NO FORMA JUEGO :C");
    return;
  }

  // Guardar jugada válida
  await addDoc(collection(db, "jugadascarioca"), {
    cartas,
    timestamp: new Date()
  });

  setResultado("¡3 ESCALAS CORRECTAS! ✔");
};


  const obtenerNumero = (numero) => {
    switch(numero) {
      case 1:
        return "A"
      case 11:
        return "J"
      case 12:
        return "Q"
      case 13:
        return "K"
      default:
        return numero
    }
  }

  return (
    <div className="container mt-4">

      <h2 className="mb-3">Juego de Carioca</h2>

      {/* Inputs */}
      <div className="d-flex gap-3">
        <input
          className="form-control"
          type="number"
          placeholder="Número"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />

        <select
          className="form-select"
          value={pinta}
          onChange={(e) => setPinta(e.target.value)}
        >
          {pintas.map(p => <option key={p}>{p}</option>)}
        </select>

        <button className="btn btn-primary" onClick={agregarCarta}>
          Agregar
        </button>
      </div>

      {/* Cartas */}
      <div className="d-flex gap-3 mt-4">
        <AnimatePresence>
          {cartas.map(carta => (
            <motion.div
              key={carta.id}
              initial={{ opacity: 0, y: -20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.3, rotate: 90 }}
              transition={{ duration: 0.3 }}
              className="position-relative p-3 border rounded shadow-sm"
              style={{
                width: "80px",
                height: "110px",
                background: "white"
              }}
            >
              <div>{mostrarNumero(carta.numero)}</div>
              <div>{carta.pinta}</div>

              <button
                className="btn btn-sm btn-danger position-absolute top-0 end-0"
                onClick={() => eliminarCarta(carta.id)}
              >
                X
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Botón validar */}
      <button
        className="btn btn-success mt-4"
        onClick={validarJuego}
      >
        Validar Juego
      </button>

      {/* Resultado animado */}
      {resultado && (
        <motion.h1
          className="mt-4"
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
