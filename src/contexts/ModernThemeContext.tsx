import React, { createContext, useContext, useEffect, useState } from 'react';

// Vision 2026 v2 — echtes Light/Dark-Theme-System.
// Setzt die `.dark`-Klasse auf <html> (Tailwind darkMode: 'class').

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'pitbulls-theme';

export const ModernThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        // Default: dunkel (Editorial Court wirkt im Dark-Mode am stärksten)
        return 'dark';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const setTheme = (next: Theme) => setThemeState(next);
    const toggleTheme = () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useModernTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useModernTheme must be used within a ModernThemeProvider');
    }
    return context;
};
