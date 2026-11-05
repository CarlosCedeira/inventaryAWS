# ADR-002: venta no equivale a factura

## Contexto

La ERS excluye facturas, cobros, contabilidad y pasarelas de pago del alcance
actual. El flujo existente descuenta stock al crear la venta, la deja
`pendiente_pago`, permite marcarla `completa` y expone un CSV solo para ventas
completas. La interfaz llama a esta transición «Finalizar para exportación».

## Decisión implementada

Una venta es una operación de inventario y comercial, no una factura ni un
cobro. La finalización no mueve stock y únicamente determina su inclusión en
la exportación CSV actual.

## Consecuencias

- No hay factura, estado de cobro, numeración fiscal ni integración externa.
- La exportación es un fichero CSV, no una garantía de que un tercero haya
  facturado o cobrado la operación.
- Las devoluciones cambian el estado fuera de `completa`; la política de su
  representación en exportación necesita ratificación.

## Fuentes y estado

- `documentation/ERS_Bretema.md`, secciones 3.2 y 10.
- `README.md`, «Ciclo de ventas».
- `back/modules/sales/sales.model.ts` y `front/src/components/sales/`.

La finalidad de negocio de usar la finalización como puerta de exportación se
deduce de estas fuentes, pero no consta una aprobación de producto: permanece
**pendiente de ratificar**.

