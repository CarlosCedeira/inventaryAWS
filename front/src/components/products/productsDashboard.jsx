import React, { useMemo, useState } from "react";
import { VictoryPie, VictoryLabel } from "victory";
import "./productDashboard.css";

export default function InventoryDashboard({ inventory }) {
  const [hoveredSector, setHoveredSector] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const colorScale = [
    "#4f81bd",
    "#c0504d",
    "#9bbb59",
    "#8064a2",
    "#4bacc6",
    "#f79646"
  ];

  const totalStock = useMemo(
    () => inventory.reduce((sum, i) => sum + i.cantidad, 0),
    [inventory]
  );

  const stockByCategory = useMemo(() => {
    const map = {};
    inventory.forEach((item) => {
      map[item.producto_categoria] =
        (map[item.producto_categoria] || 0) + item.cantidad;
    });
    return Object.entries(map).map(([cat, value]) => ({ x: cat, y: value }));
  }, [inventory]);

  // 🟡 MODIFICADO: total de stock solo de la categoría seleccionada
  const categoryTotalStock = inventory
    .filter(p => p.producto_categoria === selectedCategory)
    .reduce((sum, p) => sum + p.cantidad, 0);

  const inventoryValue = useMemo(() => {
    const map = {};
    inventory.forEach((i) => {
      const value = i.cantidad * Number(i.precio_compra);
      map[i.producto_categoria] =
        (map[i.producto_categoria] || 0) + value;
    });
    return Object.entries(map).map(([cat, value]) => ({ x: cat, y: value }));
  }, [inventory]);

  const lowStock = useMemo(
    () => inventory.filter((i) => i.cantidad <= i.stock_minimo),
    [inventory]
  );

  const totalInventoryValue = useMemo(
    () => inventoryValue.reduce((sum, i) => sum + i.y, 0),
    [inventoryValue]
  );

  const handleSectorClick = (categoria) => {
    setSelectedCategory(categoria === selectedCategory ? null : categoria);
  };

  return (
    <div className="dashboard-grid">

      {/* ================= STOCK POR CATEGORÍA ================= */}
      <div className="chart-card chart-main">
        <h4 className="text-center">Stock por categoría</h4>

        <div className="donut-wrapper">
          <VictoryPie
            data={stockByCategory}
            width={320}
            height={320}
            innerRadius={80}
            padAngle={2}
            labelRadius={({ radius }) => radius * 1.1}
            labels={({ datum }) =>
              `${((datum.y / totalStock) * 100).toFixed(0)}%`
            }
            labelComponent={<VictoryLabel />}
            colorScale={colorScale}
            style={{
              data: {
                stroke: "#fff",
                strokeWidth: 5,
                fillOpacity: ({ datum }) =>
                  datum.x === hoveredSector ? 0.5 : 1,
                cursor: "pointer"
              },
              labels: {
                fill: "#000",
                fontSize: 14,
                fontWeight: "bold",
                pointerEvents: "none"
              }
            }}
            animate={{ duration: 500 }}
            events={[{
              target: "data",
              eventHandlers: {
                onClick: (_, props) => {
                  handleSectorClick(props.datum.x);
                  return [];
                },
                onMouseOver: (_, props) => {
                  setHoveredSector(props.datum.x);
                  return [];
                },
                onMouseOut: () => {
                  setHoveredSector(null);
                  return [];
                }
              }
            }]}
          />
<ul className="chart-legend">
  {stockByCategory.map((item, i) => (
  <li
  key={item.x}
  onMouseEnter={() => setHoveredSector(item.x)}
  onMouseLeave={() => setHoveredSector(null)}
  className={hoveredSector === item.x ? "legend-hovered" : ""}
>
      <span
        className="legend-color"
        style={{ background: colorScale[i % colorScale.length] }}
      />
      <span className="legend-label">{item.x}</span>
      <span className="legend-value">{item.y}</span>
    </li>
  ))}
</ul>

          <div className="donut-center">
            <h5>productos</h5>
            <h3>{totalStock}</h3>
          </div>
        </div>
      </div>

      {/* ================= DETALLE CENTRAL ================= */}
      <div className="chart-card chart-detail">
        {selectedCategory ? (
          <>
            <h4>Detalles de {selectedCategory}</h4>
            <ul>
              {inventory
                .filter(i => i.producto_categoria === selectedCategory)
                .map(i => {
                  const productValue = i.cantidad * i.precio_compra;
                  const stockPercent = (i.cantidad / totalStock) * 100;
                  const valuePercent =
                    (productValue / totalInventoryValue) * 100;

                  // 🔴 AÑADIDO: peso dentro de la categoría
                  const categoryWeight =
                    categoryTotalStock > 0
                      ? (i.cantidad / categoryTotalStock) * 100
                      : 0;

                  // 🔴 AÑADIDO: estado del producto
                  let estado = "OK";
                  if (i.cantidad <= i.stock_minimo) {
                    estado = "BAJO";
                  } else if (i.cantidad <= i.stock_minimo * 2) {
                    estado = "MEDIO";
                  }

                  return (
                    <li
                      key={i.producto_id}
                      className={`detail-item estado-${estado.toLowerCase()}`} // 🔴 AÑADIDO
                    >
                      <div className="detail-line-1">
                        {i.producto_nombre}
                      </div>

                      <div className="detail-line-2">
                        {i.cantidad} unidades — {productValue.toFixed(2)} €
                      </div>

                      <div className="detail-line-2">
                        Stock: {stockPercent.toFixed(1)}% · Valor:{" "}
                        {valuePercent.toFixed(1)}%
                      </div>

                      {/* 🔴 AÑADIDO */}
                      <div className="detail-line-2">
                        Estado: <strong>{estado}</strong> · Peso en categoría:{" "}
                        {categoryWeight.toFixed(0)}%
                      </div>
                    </li>
                  );
                })}
            </ul>
          </>
        ) : (
          <p style={{ marginTop: "40px" }}>
            Selecciona un sector en la gráfica para ver los detalles.
          </p>
        )}
      </div>

      {/* ================= VALOR INVENTARIO ================= */}
      <div className="chart-card chart-main">
        <h4 className="text-center">Valor inventario</h4>

        <div className="donut-wrapper">
          <VictoryPie
            data={inventoryValue}
            width={320}
            height={320}
            innerRadius={80}
            padAngle={2}
            labelRadius={({ radius }) => radius * 1.1}
            labels={({ datum }) =>
              `${((datum.y / totalInventoryValue) * 100).toFixed(0)}%`
            }
            labelComponent={<VictoryLabel />}
            colorScale={colorScale}
           style={{
    data: {
      stroke: "#fff",
      strokeWidth: 5,
      fillOpacity: ({ datum }) =>
        datum.x === hoveredSector ? 0.5 : 1,
      cursor: "pointer"
    },
    labels: {
      fill: "#000",
      fontSize: 14,
      fontWeight: "bold",
      pointerEvents: "none"
    }
  }}

  /* 🔴 AÑADIDO: eventos de hover */
  events={[{
    target: "data",
    eventHandlers: {
      onMouseOver: (_, props) => {
        setHoveredSector(props.datum.x);
        return [];
      },
      onMouseOut: () => {
        setHoveredSector(null);
        return [];
      }
    }
  }]}

  animate={{ duration: 500 }}
/>
          <ul className="chart-legend">
          {inventoryValue.map((item, i) => (
<li
  key={item.x}
  onMouseEnter={() => setHoveredSector(item.x)}
  onMouseLeave={() => setHoveredSector(null)}
  className={hoveredSector === item.x ? "legend-hovered" : ""}
>
              <span
                className="legend-color"
                style={{ background: colorScale[i % colorScale.length] }}
              />
              <span className="legend-label">{item.x}</span>
              <span className="legend-value">{item.y}€</span>
            </li>
          ))}
        </ul>

          <div className="donut-center">
            <h5>valor total</h5>
            <h3>
              {totalInventoryValue.toFixed(0)} €
            </h3>
          </div>
        </div>
      </div>

      {/* ================= STOCK BAJO ================= */}
      <div className="chart-card alert-card chart-alert">
        <h4>Stock bajo</h4>
        <div className="alert-number">{lowStock.length}</div>

        {lowStock.length === 0 ? (
          <p className="alert-ok">Todo el stock está en niveles correctos</p>
        ) : (
          <ul className="alert-list">
            {lowStock.map((item) => (
              <li key={item.producto_id}>
                <strong>{item.producto_nombre}</strong>
                <span>
                  {item.cantidad} / min {item.stock_minimo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
