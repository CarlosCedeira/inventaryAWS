const clientsModel = require("./clients.model");

async function listClients(tenantId, search, daysWithoutPurchase, activeStatus) {
  return clientsModel.listCommercialClients(tenantId, search, daysWithoutPurchase, activeStatus);
}

async function createClient(tenantId, client) {
  return clientsModel.createCommercialClient(tenantId, client);
}

async function updateClient(tenantId, clientId, client) {
  return clientsModel.updateCommercialClient(tenantId, clientId, client);
}

module.exports = { listClients, createClient, updateClient };
