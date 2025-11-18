import React, { Fragment } from "react";
import ReactDOM from "react-dom/client";

import "./css/bootstrap.min.css";

export function App() {
  return (
    <>
      <form>
        <div class="form-group">
          <label for="card">Número de carta</label>
          <input type="text" class="form-control" id="card" placeholder="Ingrese su carta" />
        </div>
        <button type="submit" class="btn btn-primary">Añadir carta</button>
      </form>
    </>
  );
}