/**
 * Calcula la edad a partir de una fecha de nacimiento.
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @returns {number}
 */
export const calcularEdad = (dateStr) => {
  if (!dateStr) return 0;
  const hoy = new Date();
  const nacimiento = new Date(dateStr);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesDiff = hoy.getMonth() - nacimiento.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

/**
 * Clasifica el IMC.
 * @param {number} bmi
 * @returns {{ label: string, color: string }}
 */
export const clasificarIMC = (bmi) => {
  if (!bmi || bmi <= 0) return { label: "N/A", color: "#6b7280" };
  if (bmi < 18.5) return { label: "Bajo peso", color: "#f59e0b" };
  if (bmi < 25) return { label: "Normal", color: "#22c55e" };
  if (bmi < 30) return { label: "Sobrepeso", color: "#f59e0b" };
  return { label: "Obesidad", color: "#ef4444" };
};

/**
 * Formatea una fecha ISO a formato legible.
 * @param {string} dateStr
 * @param {object} opts - Opciones de Intl.DateTimeFormat
 * @returns {string}
 */
export const formatDate = (dateStr, opts = {}) => {
  if (!dateStr) return "N/A";
  const defaults = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateStr).toLocaleDateString("es-SV", { ...defaults, ...opts });
};

/**
 * Formatea fecha y hora.
 * @param {string} dateStr
 * @returns {string}
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("es-SV", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/**
 * Convierte string vacio o undefined a null (para campos opcionales del backend).
 * @param {*} val
 * @returns {*|null}
 */
export const toNull = (val) => (val === "" || val === undefined ? null : val);

/**
 * Chequea si un valor es vacio/nulo/undefined.
 * @param {*} val
 * @returns {boolean}
 */
export const isVoid = (val) => val === null || val === undefined || val === "";

/**
 * Formatea DUI: 12345678-9
 * @param {string} val
 * @returns {string}
 */
export const formatDUI = (val) => {
  const digits = val.replace(/\D/g, "").slice(0, 9);
  if (digits.length > 8) return `${digits.slice(0, 8)}-${digits.slice(8)}`;
  return digits;
};

/**
 * Formatea telefono: 0000-0000
 * @param {string} val
 * @returns {string}
 */
export const formatPhone = (val) => {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return digits;
};

/**
 * Obtiene la etiqueta de estado para un paciente.
 * @param {string} status
 * @returns {{ label: string, bg: string, color: string }}
 */
export const getStatusBadge = (status) => {
  const map = {
    active: { label: "Activo", bg: "#dcfce7", color: "#166534" },
    inactive: { label: "Inactivo", bg: "#fee2e2", color: "#991b1b" },
    waiting: { label: "En espera", bg: "#dbeafe", color: "#1e40af" },
    in_consultation: { label: "En consulta", bg: "#fef3c7", color: "#92400e" },
    done: { label: "Finalizado", bg: "#dcfce7", color: "#166534" },
    cancelled: { label: "Cancelado", bg: "#fee2e2", color: "#991b1b" },
    scheduled: { label: "Programada", bg: "#dbeafe", color: "#1e40af" },
    present: { label: "Presente", bg: "#dcfce7", color: "#166534" },
  };
  return map[status] || { label: status || "Desconocido", bg: "#f3f4f6", color: "#6b7280" };
};
