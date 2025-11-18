import React, { Fragment } from "react";
import ReactDOM from "react-dom/client";
import {CariocaGame} from "./components/CariocaGame";

import "./css/bootstrap.min.css";

export function App() {
  return (
    <Fragment>
      <CariocaGame />
    </Fragment>
  );
}