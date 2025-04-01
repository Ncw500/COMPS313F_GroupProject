import { useLanguage } from '@/context/LanguageContext';
import type { LanguageMode } from '@/context/LanguageContext';
import { useCallback, useEffect, useState } from 'react';

// 定義所有文本信息，分類組織
const translations = {
  common: {
    appName: {
      english: 'Hong Kong Transit',
      chinese: '香港交通',
    },
    loading: {
      english: 'Loading...',
      chinese: '載入中...',
    },
    error: {
      english: 'An error occurred',
      chinese: '發生錯誤',
    },
    retry: {
      english: 'Retry',
      chinese: '重試',
    },
  },
  home: {
    title: {
      english: 'Welcome to Hong Kong Transit',
      chinese: '歡迎使用香港交通',
    },
    subtitle: {
        english: 'Find your way around the city',
        chinese: '在城市中找到你的路',
    },
    nearbyRoutes: {
      english: 'Nearby Routes',
      chinese: '附近路線',
    },
    recentSearches: {
      english: 'Recent Searches',
      chinese: '最近搜尋',
    },
  },
  search: {
    placeholder: {
      english: 'Search for routes or stops',
      chinese: '搜尋路線或站點',
    },
    noResults: {
      english: 'No results found',
      chinese: '沒有找到結果',
    },
  },
  settings: {
    title: {
      english: 'Settings',
      chinese: '設定',
    },
    language: {
      english: 'Language',
      chinese: '語言',
    },
    theme: {
      english: 'Theme',
      chinese: '主題',
    },
    darkMode: {
      english: 'Dark Mode',
      chinese: '深色模式',
    },
    about: {
      english: 'About',
      chinese: '關於',
    },
  },
  // 可以根據需要添加更多類別
};

// 直接獲取翻譯的函數，需要提供當前語言
export const getTranslation = (key: string, language: LanguageMode): string => {
  const keys = key.split('.');
  let result: any = translations;
  
  for (const k of keys) {
    if (result[k] === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    result = result[k];
  }
  
  if (typeof result === 'object' && result[language]) {
    return result[language];
  }
  
  console.warn(`Translation for ${key} in ${language} not found`);
  return key;
};

// Hook 版本的翻譯函數，自動獲取當前語言
export const useTranslation = () => {
  const { language } = useLanguage();
  const [, forceRender] = useState({});
  
  // 監聽語言變化並強制更新
  useEffect(() => {
    forceRender({});
  }, [language]);
  
  const t = useCallback((key: string): string => {
    return getTranslation(key, language);
  }, [language]);
  
  return { t, language };
};