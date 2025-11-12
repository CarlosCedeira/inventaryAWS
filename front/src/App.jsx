import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ProductProvider } from "./context/ProductContext";
import Nav from "./Nav";

function App() {
  return (
    <BrowserRouter>
      <ProductProvider>
        <Nav />
      </ProductProvider>
    </BrowserRouter>
  );
}

export default App;
