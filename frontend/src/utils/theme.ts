export type ThemeName = "light" | "dark";

const THEME_STORAGE_KEY = "vaibhav-code-theme";

const isThemeName = (value: string | null): value is ThemeName =>
  value === "light" || value === "dark";

export const resolvePreferredTheme = (): ThemeName => {
  if (typeof window === "undefined") return "dark";

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeName(storedTheme)) return storedTheme;

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export const applyTheme = (theme: ThemeName): void => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
};

export const persistTheme = (theme: ThemeName): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const bootstrapTheme = (): ThemeName => {
  const theme = resolvePreferredTheme();
  applyTheme(theme);
  return theme;
};

export const toggleThemeName = (theme: ThemeName): ThemeName =>
  theme === "dark" ? "light" : "dark";
