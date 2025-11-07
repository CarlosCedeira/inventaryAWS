import React, { useState, useEffect } from "react";

const PointOfSale = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);

  // ✅ Cargar productos desde la API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:3000/productos");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error al cargar los productos:", error);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Agregar producto seleccionado al carrito
  const handleAddToCart = () => {
    if (selectedProductId && quantity > 0) {
      const product = products.find(
        (p) => p.id === parseInt(selectedProductId)
      );
      if (product) {
        setCart([
          ...cart,
          {
            id: product.id,
            nombre: product.nombre,
            precio_venta: parseFloat(product.precio_venta),
            cantidad: parseInt(quantity),
          },
        ]);
        setSelectedProductId("");
        setQuantity(1);
      }
    }
  };

  // ✅ Calcular total
  const total = cart.reduce(
    (acc, item) => acc + item.precio_venta * item.cantidad,
    0
  );

  // ✅ Procesar venta (enviar al backend)
  const handleSale = async () => {
    try {
      for (const item of cart) {
        const venta = {
          id_producto: item.id,
          cantidad: item.cantidad,
          precio_venta: item.precio_venta,
        };

        const res = await fetch("http://localhost:3000/ventas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(venta),
        });

        if (!res.ok) {
          throw new Error(
            `Error al registrar venta de producto ${item.nombre}`
          );
        }
      }

      alert(`✅ Venta completada. Total: €${total.toFixed(2)}`);
      setCart([]);
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      alert("❌ Ocurrió un error al registrar la venta.");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3 text-center">🧾 Punto de Venta</h2>

      {/* Selección de producto */}
      <div className="input-group mb-3">
        <select
          className="form-select"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">Selecciona un producto...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} (€{p.precio_venta})
            </option>
          ))}
        </select>

        <input
          type="number"
          className="form-control"
          placeholder="Cantidad"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <button className="btn btn-primary" onClick={handleAddToCart}>
          Agregar al carrito
        </button>
      </div>

      {/* Carrito */}
      <h3>🛒 Carrito</h3>
      {cart.length === 0 ? (
        <p>No hay productos en el carrito.</p>
      ) : (
        <ul className="list-group mb-3">
          {cart.map((item, index) => (
            <li
              key={index}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                {item.nombre} - Cantidad: {item.cantidad}
              </div>
              <span>€{(item.precio_venta * item.cantidad).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Total y acción */}
      <div className="d-flex justify-content-between align-items-center">
        <h4>Total: €{total.toFixed(2)}</h4>
        <button
          className="btn btn-success"
          onClick={handleSale}
          disabled={cart.length === 0}
        >
          Realizar Venta
        </button>
      </div>
    </div>
  );
};

export default PointOfSale;
