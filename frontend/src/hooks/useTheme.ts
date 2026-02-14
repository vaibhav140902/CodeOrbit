import { useCallback, useEffect, useState } from "react";
import {
  ThemeName,
  applyTheme,
  persistTheme,
  resolvePreferredTheme,
  toggleThemeName,
} from "../utils/theme";

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeName>(() => resolvePreferredTheme());

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((previousTheme) => toggleThemeName(previousTheme));
  }, []);

  return { theme, toggleTheme };
};
