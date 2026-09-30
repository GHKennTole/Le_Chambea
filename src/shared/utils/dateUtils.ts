/**
 * Utilidades de formateo y comparación de fechas para chats (estilo WhatsApp).
 */

/**
 * Comprueba si dos fechas corresponden al mismo día del calendario local.
 */
export function isSameDay(
  d1: Date | string | null | undefined,
  d2: Date | string | null | undefined
): boolean {
  if (!d1 || !d2) return false;
  const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
  const date2 = typeof d2 === 'string' ? new Date(d2) : d2;
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const SPANISH_DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

/**
 * Formatea la fecha para los separadores/píldoras de fecha dentro del chat (tipo WhatsApp).
 * - Mismo día: "Hoy"
 * - Día anterior: "Ayer"
 * - Mismo año: "4 de agosto"
 * - Año distinto: "4 de agosto de 2025"
 */
export function formatChatDividerDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';

  const day = date.getDate();
  const monthName = SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  if (year === now.getFullYear()) {
    return `${day} de ${monthName}`;
  }
  return `${day} de ${monthName} de ${year}`;
}

/**
 * Formatea la fecha para la lista de conversaciones (ChatListScreen tipo WhatsApp).
 * - Hoy: "14:30" o "02:30 p.m."
 * - Ayer: "Ayer"
 * - Últimos 6 días: "Lunes", "Martes", etc.
 * - Anterior: "12/08/2026"
 */
export function formatChatListDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Ayer';
  }
  if (diffDays > 1 && diffDays < 7) {
    return SPANISH_DAYS[date.getDay()];
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
