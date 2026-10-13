const clientsModel = require("./clients.model");

async function listClients(tenantId, search, daysWithoutPurchase, activeStatus, scopeUserId) {
  return clientsModel.listCommercialClients(tenantId, search, daysWithoutPurchase, activeStatus, scopeUserId);
}

async function createClient(tenantId, userId, client) {
  return clientsModel.createCommercialClient(tenantId, userId, client);
}

async function updateClient(tenantId, clientId, client, scopeUserId) {
  return clientsModel.updateCommercialClient(tenantId, clientId, client, scopeUserId);
}

module.exports = { listClients, createClient, updateClient };
