import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

export interface ThemeSettings {
  primaryHue: number;
  primarySaturation: number;
  primaryLightness: number;
}

interface ThemeContextType {
  theme: ThemeSettings;
  setTheme: (theme: ThemeSettings, isPersisting?: boolean) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME: ThemeSettings = {
  primaryHue: 217,
  primarySaturation: 91,
  primaryLightness: 60,
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSettings>(DEFAULT_THEME);
  const hasHydratedRef = useRef(false);
  const isPreviewingRef = useRef(false);

  const { data: savedTheme, isLoading } = useQuery<{ key: string; value: ThemeSettings }>({
    queryKey: ["/api/config/theme"],
  });

  useEffect(() => {
    if (savedTheme?.value && !isPreviewingRef.current) {
      setThemeState(savedTheme.value);
      if (!hasHydratedRef.current) {
        hasHydratedRef.current = true;
      }
    }
  }, [savedTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-hue', theme.primaryHue.toString());
    root.style.setProperty('--primary-saturation', `${theme.primarySaturation}%`);
    root.style.setProperty('--primary-lightness', `${theme.primaryLightness}%`);
  }, [theme]);

  const setTheme = (newTheme: ThemeSettings, isPersisting = false) => {
    if (isPersisting) {
      isPreviewingRef.current = false;
    } else {
      isPreviewingRef.current = true;
    }
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
