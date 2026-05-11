import React from "react";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Nav from "./components/nav/Nav.jsx";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import "./App.css";


function App() {
  return (
    <BrowserRouter>
        <Nav />
    </BrowserRouter>
  );
}

export default App;
