import React from "react";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Nav from "./components/nav/Nav.jsx";

function App() {
  return (
    <BrowserRouter>
        <Nav />
    </BrowserRouter>
  );
}

export default App;
