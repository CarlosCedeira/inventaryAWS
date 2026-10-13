const INVENTORY_MANAGEMENT_ROLES = new Set(["owner", "admin"]);
const COMMERCIAL_ACCESS_ROLES = new Set(["owner", "admin"]);
const INVENTORY_ACCESS_ROLES = new Set(["owner", "admin", "almacen"]);

export const canManageInventory = (user) => INVENTORY_MANAGEMENT_ROLES.has(user?.rol);
export const canAccessCommercial = (user) => COMMERCIAL_ACCESS_ROLES.has(user?.rol) || user?.rol === "vendedor";
export const canAccessInventory = (user) => INVENTORY_ACCESS_ROLES.has(user?.rol);
export const canManageCommercial = (user) => COMMERCIAL_ACCESS_ROLES.has(user?.rol);
