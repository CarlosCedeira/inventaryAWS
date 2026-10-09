import { useEffect, useMemo, useState } from "react";
import { productService } from "../products/productService";
import NewSaleModal from "./NewSaleModal";
import { salesService } from "./salesService";
import { useToast } from "../feedback/ToastProvider";

const amounts = (line) => { const subtotal = Number(line.precio_venta || 0) * Number(line.cantidad || 0); const tax = subtotal * Number(line.impuesto_porcentaje || 0) / 100; return { subtotal, tax, total: subtotal + tax }; };

export default function ClientSaleModal({ client, onClose, onCreated }) {
  const { success } = useToast();
  const [products, setProducts] = useState([]); const [lines, setLines] = useState([]); const [productId, setProductId] = useState(""); const [reference, setReference] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { void productService.getAll().then(setProducts).catch((failure) => setError(failure instanceof Error ? failure.message : "No se pudieron cargar los productos")); }, []);
  const availableProducts = products.filter((product) => !lines.some((line) => line.producto_id === product.producto_id) && Number(product.stock_disponible) > 0);
  const totals = useMemo(() => lines.reduce((result, line) => { const value = amounts(line); return { subtotal: result.subtotal + value.subtotal, tax: result.tax + value.tax, total: result.total + value.total }; }, { subtotal: 0, tax: 0, total: 0 }), [lines]);
  const addLine = () => { const product = availableProducts.find((item) => String(item.producto_id) === productId); if (!product) return setError("Selecciona un producto disponible"); setLines((current) => [...current, { ...product, cantidad: 1 }]); setProductId(""); setError(""); };
  const confirm = async (event) => { event.preventDefault(); if (!lines.length) return setError("Añade al menos un producto"); setSaving(true); try { await salesService.create({ cliente_id: client.id, referencia: reference || null, lineas: lines.map((line) => ({ producto_id: line.producto_id, cantidad: Number(line.cantidad) })) }); success("Venta registrada correctamente"); onCreated(); } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo confirmar la venta"); } finally { setSaving(false); } };
  return <NewSaleModal activeClients={[client]} availableProducts={availableProducts} clientId={String(client.id)} error={error} lines={lines} lockedClient onAddLine={addLine} onClose={onClose} onConfirm={confirm} onLineQuantityChange={(id, quantity) => setLines((current) => current.map((line) => line.producto_id === id ? { ...line, cantidad: quantity } : line))} onProductChange={setProductId} onReferenceChange={setReference} onRemoveLine={(id) => setLines((current) => current.filter((line) => line.producto_id !== id))} onSelectClient={() => {}} productIdToAdd={productId} reference={reference} saving={saving} totals={totals} />;
}
