/**
 * Gestor de historial de navegación entre pantallas principales y pestañas.
 * Permite que al presionar el botón de "Atrás" del sistema (en Android y web móvil)
 * se regrese a la pantalla o pestaña previa visitada, en lugar de reiniciar todo
 * a Home o mandar por error al Login.
 */

const MAX_HISTORY = 25;
let tabHistory: string[] = ["Home"];

export const MAIN_TABS = [
  "Home",
  "ChatList",
  "AI",
  "Favorites",
  "Menu",
  "HomeAdmin",
  "AdminAiAudit",
  "AdminUserDirectory",
];

export function isMainTab(name: string): boolean {
  return MAIN_TABS.includes(name);
}

export function recordTabVisit(tabName: string) {
  if (!isMainTab(tabName)) return;

  const currentTop = tabHistory[tabHistory.length - 1];
  if (currentTop === tabName) return;

  tabHistory.push(tabName);
  if (tabHistory.length > MAX_HISTORY) {
    tabHistory.shift();
  }
}

export function popPreviousTab(): string | null {
  if (tabHistory.length <= 1) {
    return null;
  }
  // Elimina la pantalla actual del tope
  tabHistory.pop();
  // Devuelve la pantalla previa
  const prev = tabHistory[tabHistory.length - 1];
  return prev || null;
}

export function resetTabHistory(initialTab = "Home") {
  tabHistory = [initialTab];
}

export function getTabHistory(): string[] {
  return [...tabHistory];
}
