import {
  createCommercialClient,
  listCommercialClients,
  updateCommercialClient,
  type CommercialClientInput,
} from "./clients.model";

async function listClients(
  tenantId: number,
  search: string,
  daysWithoutPurchase: number | null,
  activeStatus: boolean | null,
  scopeUserId: number | null,
) {
  return listCommercialClients(tenantId, search, daysWithoutPurchase, activeStatus, scopeUserId);
}

async function createClient(tenantId: number, userId: number, client: CommercialClientInput): Promise<number> {
  return createCommercialClient(tenantId, userId, client);
}

async function updateClient(
  tenantId: number,
  clientId: number,
  client: CommercialClientInput,
  scopeUserId: number | null,
): Promise<number> {
  return updateCommercialClient(tenantId, clientId, client, scopeUserId);
}

export { createClient, listClients, updateClient };
