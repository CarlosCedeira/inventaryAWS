export interface CommercialClientInput {
  nombre: string;
  email: string | null;
  telefono: string | null;
  identificacion_fiscal: string | null;
  direccion: string | null;
  activo: boolean;
}

type Input = Record<string, unknown>;
type Validation = { client: CommercialClientInput; error?: never } | { error: string };

function text(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function optionalText(value: unknown, maxLength: number, label: string): string | null | { error: string } {
  const normalized = text(value);
  if (!normalized) return null;
  if (normalized.length > maxLength) return { error: `${label} no puede superar los ${maxLength} caracteres` };
  return normalized;
}

function buildCommercialClientPayload(body: Input): Validation {
  const nombre = text(body.nombre);
  if (nombre.length < 2 || nombre.length > 150) {
    return { error: "El nombre debe tener entre 2 y 150 caracteres" };
  }

  const email = optionalText(body.email, 150, "El email");
  if (email !== null && typeof email === "object") return email;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El email no es valido" };
  }

  const telefono = optionalText(body.telefono, 30, "El telefono");
  if (telefono !== null && typeof telefono === "object") return telefono;
  const identificacionFiscal = optionalText(body.identificacion_fiscal, 30, "La identificacion fiscal");
  if (identificacionFiscal !== null && typeof identificacionFiscal === "object") return identificacionFiscal;
  const direccion = optionalText(body.direccion, 255, "La direccion");
  if (direccion !== null && typeof direccion === "object") return direccion;

  if (body.activo !== undefined && typeof body.activo !== "boolean") {
    return { error: "El estado del cliente no es valido" };
  }

  return {
    client: {
      nombre,
      email,
      telefono,
      identificacion_fiscal: identificacionFiscal,
      direccion,
      activo: body.activo ?? true,
    },
  };
}

export { buildCommercialClientPayload };
