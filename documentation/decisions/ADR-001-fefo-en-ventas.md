# ADR-001: consumo FEFO en ventas

## Contexto

Los lotes pueden tener fecha de caducidad. El requisito RF-16 de
`documentation/ERS_Bretema.md` exige priorizar la caducidad más próxima,
dejar los lotes sin fecha para el final y desempatar por ID; también prohíbe
vender lotes caducados.

## Decisión

Las ventas consumen stock mediante FEFO: fecha de caducidad ascendente, lotes
sin caducidad al final e ID ascendente como desempate. El consumo se ejecuta
dentro de la transacción de venta y deja una salida por cada lote utilizado.

## Consecuencias

- Una línea puede generar varias salidas de inventario.
- Las anulaciones y devoluciones reponen el lote original, no vuelven a elegir
  lotes por FEFO.
- Las referencias históricas a FIFO no describen el comportamiento vigente.

## Fuentes

- `documentation/ERS_Bretema.md`, RF-16 y RN-09.
- `back/modules/movements/movements.model.ts`, `consumeStockByFEFO`.
- `back/tests/sales.integration.test.ts`, prueba de venta que consume dos lotes.

