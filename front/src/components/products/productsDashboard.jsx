import React, { useMemo, useState } from "react";
import { VictoryPie, VictoryTooltip } from "victory";
import "./productDashboard.css";

export default function InventoryDashboard({ inventory }) {
  const [hoveredSector, setHoveredSector] = useState(null);

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

  // Función para calcular innerRadius dinámico
  const getInnerRadius = (datum) => (datum.x === hoveredSector ? 70 : 80);

  return (
    <div className="dashboard-grid">
      {/* STOCK POR CATEGORÍA */}
      <div className="chart-card chart-main">
        <h4>Stock por categoría</h4>

        <div className="donut-wrapper">
          <VictoryPie
            data={stockByCategory}
            width={320}
            height={320}
            innerRadius={getInnerRadius}
            padAngle={2}
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            labelComponent={<VictoryTooltip />}
            colorScale={colorScale}
            style={{
              data: {
                stroke: "#fff",
                strokeWidth: 1,
                fillOpacity: ({ datum }) =>
                  datum.x === hoveredSector ? 0.7 : 1,
                cursor: "pointer"
              },
              labels: { fontSize: 10 }
            }}
            animate={{ duration: 200 }}
            events={[
              {
                target: "data",
                eventHandlers: {
                  onMouseOver: (e, props) => {
                    setHoveredSector(props.datum.x);
                    return [];
                  },
                  onMouseOut: () => {
                    setHoveredSector(null);
                    return [];
                  }
                }
              }
            ]}
          />

          <div className="donut-center">
            <div className="donut-total">{totalStock}</div>
            <div className="donut-label">productos</div>
          </div>
        </div>

        <ul className="chart-legend">
          {stockByCategory.map((item, i) => (
            <li
              key={item.x}
              className={hoveredSector === item.x ? "legend-hovered" : ""}
              onMouseEnter={() => setHoveredSector(item.x)}
              onMouseLeave={() => setHoveredSector(null)}
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
      </div>

      {/* VALOR INVENTARIO */}
      <div className="chart-card chart-main">
        <h4>Valor inventario</h4>

        <div className="donut-wrapper">
          <VictoryPie
            data={inventoryValue}
            width={320}
            height={320}
            innerRadius={getInnerRadius}
            padAngle={2}
            labels={({ datum }) => `${datum.x}: €${datum.y.toFixed(0)}`}
            labelComponent={<VictoryTooltip />}
            colorScale={colorScale}
            style={{
              data: {
                stroke: "#fff",
                strokeWidth: 1,
                fillOpacity: ({ datum }) =>
                  datum.x === hoveredSector ? 0.7 : 1,
                cursor: "pointer"
              },
              labels: { fontSize: 10 }
            }}
            animate={{ duration: 200 }}
            events={[
              {
                target: "data",
                eventHandlers: {
                  onMouseOver: (e, props) => {
                    setHoveredSector(props.datum.x);
                    return [];
                  },
                  onMouseOut: () => {
                    setHoveredSector(null);
                    return [];
                  }
                }
              }
            ]}
          />

          <div className="donut-center">
            <div className="donut-total">
              €{totalInventoryValue.toFixed(0)}
            </div>
            <div className="donut-label">valor total</div>
          </div>
        </div>

        <ul className="chart-legend">
          {inventoryValue.map((item, i) => (
            <li
              key={item.x}
              className={hoveredSector === item.x ? "legend-hovered" : ""}
              onMouseEnter={() => setHoveredSector(item.x)}
              onMouseLeave={() => setHoveredSector(null)}
            >
              <span
                className="legend-color"
                style={{ background: colorScale[i % colorScale.length] }}
              />
              <span className="legend-label">{item.x}</span>
              <span className="legend-value">€{item.y.toFixed(0)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* STOCK BAJO */}
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

