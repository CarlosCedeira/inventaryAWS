import type { ApiResponse, AuthenticatedRequest } from "../../types/http";
import { isHttpError } from "../../types/http";
import { buildCommercialClientPayload } from "./clients.validators";

const clientsService = require("./clients.service") as {
  listClients: (tenantId: number, search: string, daysWithoutPurchase: number | null, activeStatus: boolean | null) => Promise<unknown[]>;
  createClient: (tenantId: number, client: unknown) => Promise<number>;
  updateClient: (tenantId: number, clientId: number, client: unknown) => Promise<number>;
};
const { log, logUnexpectedError } = require("../../utils/logger");

async function getClients(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const query = (req as AuthenticatedRequest & { query?: Record<string, unknown> }).query;
    const search = typeof query?.buscar === "string" ? query.buscar.trim().slice(0, 100) : "";
    const requestedDays = query?.sin_compras_dias;
    const requestedStatus = query?.estado;
    const daysWithoutPurchase = requestedDays === undefined ? null : Number(requestedDays);
    if (daysWithoutPurchase !== null && (!Number.isInteger(daysWithoutPurchase) || daysWithoutPurchase < 1 || daysWithoutPurchase > 365)) {
      return res.status(400).json({ error: "El periodo sin compras no es valido" });
    }
    if (requestedStatus !== undefined && requestedStatus !== "activo" && requestedStatus !== "inactivo") {
      return res.status(400).json({ error: "El estado no es valido" });
    }
    const activeStatus = requestedStatus === undefined ? null : requestedStatus === "activo";
    const clients = await clientsService.listClients(req.tenantId, search, daysWithoutPurchase, activeStatus);
    res.json(clients);
  } catch (error) {
    logUnexpectedError(req, "clients_list_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createClient(req: AuthenticatedRequest, res: ApiResponse) {
  try {
    const validation = buildCommercialClientPayload(req.body);
    if (validation.error !== undefined) return res.status(400).json({ error: validation.error });

    const clientId = await clientsService.createClient(req.tenantId, validation.client);
    log("info", "client_created", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, clientId });
    res.status(201).json({ id: clientId, ...validation.client });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ya existe un cliente con esa identificacion fiscal" });
    }
    logUnexpectedError(req, "client_create_failed", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function updateClient(req: AuthenticatedRequest, res: ApiResponse) {
  const clientId = Number(req.params.id);
  if (!Number.isInteger(clientId) || clientId <= 0) return res.status(400).json({ error: "Cliente invalido" });

  try {
    const validation = buildCommercialClientPayload(req.body);
    if (validation.error !== undefined) return res.status(400).json({ error: validation.error });

    const affectedRows = await clientsService.updateClient(req.tenantId, clientId, validation.client);
    if (!affectedRows) return res.status(404).json({ error: "Cliente no encontrado" });
    log("info", "client_updated", { requestId: req.requestId, tenantId: req.tenantId, userId: req.user.id, clientId });
    res.json({ id: clientId, ...validation.client });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Ya existe un cliente con esa identificacion fiscal" });
    }
    if (isHttpError(error) && error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    logUnexpectedError(req, "client_update_failed", error, { clientId });
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export { getClients, createClient, updateClient };
