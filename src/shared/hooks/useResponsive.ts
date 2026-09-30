import { useWindowDimensions } from "react-native";

export const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
};

export interface ResponsiveInfo {
  width: number;
  height: number;
  isMobile: boolean;       // Ancho < 768px (teléfonos móviles tanto en app nativa como navegador)
  isTablet: boolean;       // 768px <= Ancho < 1024px (tablets / iPads)
  isDesktop: boolean;      // Ancho >= 1024px (computadoras / laptops)
  isLargeScreen: boolean;  // Ancho >= 768px (tablets, laptops y monitores grandes)
  isLandscape: boolean;    // Orientación horizontal
}

/**
 * Hook universal para diseño responsivo basado en el tamaño de pantalla.
 * Permite adaptar la interfaz (UI) según el tamaño del dispositivo o ventana,
 * desacoplando el diseño del sistema operativo o entorno de ejecución.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isMobile = width < BREAKPOINTS.TABLET;
  const isTablet = width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.DESKTOP;
  const isDesktop = width >= BREAKPOINTS.DESKTOP;
  const isLargeScreen = width >= BREAKPOINTS.TABLET;
  const isLandscape = width > height;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isLandscape,
  };
}

export default useResponsive;
