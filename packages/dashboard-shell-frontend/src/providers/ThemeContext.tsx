import * as React from 'react';
import {
  ThemeContext,
  useThemeContext,
} from '@odh-dashboard/dashboard-foundation-frontend/app/ThemeContext';
import { useBrowserStorage } from './BrowserStorageContext';

export { ThemeContext, useThemeContext };

const MLFLOW_DARK_MODE_KEY = '_mlflow_dark_mode_toggle_enabled';

type ThemeProviderProps = {
  children: React.ReactNode;
};
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [odhTheme, setOdhTheme] = useBrowserStorage<string>('odh.dashboard.ui.theme', 'light');
  const [, setMlflowTheme] = useBrowserStorage<boolean>(MLFLOW_DARK_MODE_KEY, odhTheme === 'dark');

  const setAllThemes = React.useCallback(
    (theme: string) => {
      setMlflowTheme(theme === 'dark');
      setOdhTheme(theme);
      window.dispatchEvent(new CustomEvent('odh-theme-change', { detail: { theme } }));
    },
    [setMlflowTheme, setOdhTheme],
  );

  const contextValue = React.useMemo(
    () => ({ theme: odhTheme, setAllThemes }),
    [odhTheme, setAllThemes],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};
