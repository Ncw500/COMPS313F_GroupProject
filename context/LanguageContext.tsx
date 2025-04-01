import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageMode = 'chinese' | 'english';

interface LanguageContextType {
    language: LanguageMode;
    toggleLanguage: () => void;
    setLanguageMode: (mode: LanguageMode) => void;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'english',
    toggleLanguage: () => { },
    setLanguageMode: () => { },
});

export const useLanguage = () => useContext(LanguageContext);

// 在LanguageContext中添加语言切换逻辑
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<LanguageMode>('english');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 从存储加载语言偏好
        const loadLanguage = async () => {
            try {
                const savedLang = await AsyncStorage.getItem('language');
                if (savedLang) {
                    setLanguage(savedLang as LanguageMode);
                }
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to load language preference:', error);
                setIsLoaded(true);
            }
        };
        loadLanguage();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            console.log('Language preference changed:', language);
            AsyncStorage.setItem('language', language).catch(err =>
                console.error('Failed to save language preference:', err)
            );
        }
    }, [language, isLoaded]);

    const toggleLanguage = () => {
        setLanguage(prevLanguage => {
            return prevLanguage === 'english' ? 'chinese' : 'english';
        });
    };

    const setLanguageMode = (mode: LanguageMode) => {
        setLanguage(mode);
      };
    

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, setLanguageMode }}>
            {children}
        </LanguageContext.Provider>
    );
};
