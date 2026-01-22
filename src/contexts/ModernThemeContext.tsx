import React, { createContext, useContext, useEffect, useState } from 'react';

interface ModernThemeContextType {
    isModernMode: boolean;
    toggleModernMode: () => void;
}

const ModernThemeContext = createContext<ModernThemeContextType | undefined>(undefined);

export const ModernThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isModernMode, setIsModernMode] = useState(() => {
        const saved = localStorage.getItem('vision2026');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('vision2026', String(isModernMode));
        if (isModernMode) {
            document.documentElement.classList.add('vision-2026');
        } else {
            document.documentElement.classList.remove('vision-2026');
        }
    }, [isModernMode]);

    const toggleModernMode = () => setIsModernMode(prev => !prev);

    return (
        <ModernThemeContext.Provider value={{ isModernMode, toggleModernMode }}>
            {children}
        </ModernThemeContext.Provider>
    );
};

export const useModernTheme = () => {
    const context = useContext(ModernThemeContext);
    if (context === undefined) {
        throw new Error('useModernTheme must be used within a ModernThemeProvider');
    }
    return context;
};
