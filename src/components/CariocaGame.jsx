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

    if (parseInt(numero) < 1) {
      return
    }

    const nueva = {
      id: crypto.randomUUID(),
      numero: parseInt(numero),
      pinta
    };

    setCartas([...cartas, nueva]);
    setNumero("");
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
  const esEscaleraValida = () => {
    if (cartas.length !== 3) return false;

    // Todas misma pinta?
    const mismaPinta = cartas.every(c => c.pinta === cartas[0].pinta);
    if (!mismaPinta) return false;

    // Ordenar
    const ordenadas = [...cartas].sort((a,b) => a.numero - b.numero);

    return (
      ordenadas[1].numero === ordenadas[0].numero + 1 &&
      ordenadas[2].numero === ordenadas[1].numero + 1
    );
  };

  // -------------------------------
  // Evitar jugada repetida
  // -------------------------------
  const jugadaYaExiste = async (jugadaKey) => {
    const querySnapshot = await getDocs(collection(db, "jugadascarioca"));

    for (let doc of querySnapshot.docs) {
      if (doc.data().key === jugadaKey) return true;
    }
    return false;
  };

  // -------------------------------
  // Validar y guardar
  // -------------------------------
  const validarJuego = async () => {
    if (!esEscaleraValida()) {
      setResultado("NO FORMA JUEGO :C");
      return;
    }

    // Creamos una clave única para evitar duplicados
    const jugadaKey = cartas
      .map(c => `${c.numero}-${c.pinta}`)
      .sort()
      .join("|");

    if (await jugadaYaExiste(jugadaKey)) {
      setResultado("JUGADA YA REGISTRADA");
      return;
    }

    await addDoc(collection(db, "jugadascarioca"), {
      cartas,
      key: jugadaKey,
      timestamp: new Date()
    });

    setResultado("¡JUEGO VÁLIDO! ✔");
  };

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
              <div>{carta.numero}</div>
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
