import MapComponent from '@/components/MapComponent';
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
    noResults: {
      english: 'No results',
      chinese: '沒有結果',
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
    index: {
      english: 'Home',
      chinese: '首頁',
    }
  },
  search: {
    index: {
      english: 'Search',
      chinese: '搜尋',
    },
    title: {
      english: 'Search Routes',
      chinese: '搜尋路線',
    },
    subTitle: {
      english: 'Find the route you want to take',
      chinese: '尋找你想搭乘的路線',
    },
    placeholder: {
      english: 'Search for routes number',
      chinese: '搜尋路線號碼',
    },
    noResults: {
      english: 'No routes found',
      chinese: '未找到路線',
    },
    searchHits: {
      english: 'Enter route number to search',
      chinese: '輸入路線號碼進行搜尋',
    },
    originRouteName: {
      english: '{route}.orig_en',
      chinese: '{route}.orig_tc',
    },
    destinationRouteName: {
      english: '{route}.dest_en',
      chinese: '{route}.dest_tc',
    },
    outbound: {
      english: 'Outbound',
      chinese: '往外',  
    },
    inbound: {
      english: 'Inbound',
      chinese: '往內',
    },

  },
  settings: {
    index: {
      english: 'Settings',
      chinese: '設定',
    },
    title: {
      english: 'Settings',
      chinese: '設定',
    },
    subTitle: {
      english: 'Customize your app settings',
      chinese: '自訂應用程式設定',
    },
    language: {
      english: 'Language',
      chinese: '語言',
    },
    theme: {
      english: 'Theme',
      chinese: '主題',
    },
    themeMode: {
      dark: {
        english: 'Dark',
        chinese: '深色',
      },
      light: {
        english: 'Light',
        chinese: '淺色',
      },
      system: {
        english: 'System',
        chinese: '系統',
      },
    },
    about: {
      english: 'About',
      chinese: '關於',
    },
  },
  errors: {
    tryAgain: {
      english: 'Try again',
      chinese: '再試一次',
    },
    errorOccurred: {
      english: 'An error occurred while loading data',
      chinese: '載入資料時發生錯誤',
    },
  },
  routes: {
    index: {
      english: 'Routes',
      chinese: '路線',
    },
    title: {
      english: 'All Bus Routes',
      chinese: '所有巴士路線',
    },
    subtitle: {
      english: 'There are "{routes}" routes available',
      chinese: '共有 "{routes}" 條路線可用',
    },
    noRoutes: {
      english: 'No routes available',
      chinese: '沒有可用路線',
    },
    findRoutes: {
      english: 'Find routes',
      chinese: '尋找路線',
    },
    routeLoading: {
      english: 'Loading route information',
      chinese: '正在載入路線資訊',
    },
    emptyRoutes: {
      english: 'No routes found',
      chinese: '未找到路線',
    },
    emptyRoutesSubtext: {
      english: 'Try searching for a different route or location',
      chinese: '嘗試搜尋其他路線或位置',
    },
    nearbyStopsFound: {
      english: 'Found {count} stops within {distance} km',
      chinese: '在 {distance} 公里內找到 {count} 個站點',
    },
    loadingRoutes: {
      english: 'Loading routes...',
      chinese: '正在載入路線...',
    }
  },
  routeItem: {
    to: {
      english: 'To ',
      chinese: '往 ',
    },
    routeDestination: {
      english: '{routeItem}.dest_en',
      chinese: '{routeItem}.dest_tc',
    }
  },
  nearbyStops: {
    loadingInfo: {
      english: 'Loading nearby stops...',
      chinese: '正在載入附近的站點...',
    },
    routePassingStops: {
      english: 'Stops on this route :',
      chinese: '此路線上的站點 ：',
    },
    routeLoadingError: {
      english: 'Route information unavailable due to API limits.',
      chinese: '由於API限制，路線資訊不可用。',
    },
    noNearbyStops: {
      english: 'No routes available for this stop.',
      chinese: '此站點沒有可用的路線。',
    },
    locationPermissionDenied: {
      english: 'Location permission denied. Please enable location services.',
      chinese: '位置權限被拒絕。請啟用位置服務。',
    },
    locationPermissionRetry: {
      english: 'Retry',
      chinese: '重試',
    },
    setApiError: {
      english: 'Error setting API key. Please try again later.',
      chinese: '設置API密鑰時出錯。請稍後再試。',
    },
    selectRoute: {
      english: "Select a route",
      chinese: "選擇路線"
    },
    multipleStops: {
      english: "Multiple stops",
      chinese: "多個站點"
    },
  },
  nearbyStopsChips: {
    stopNameMain: {
      english: '{stopName}.name_en',
      chinese: '{stopName}.name_tc',
    },
    stopNameSub: {
      english: '{stopName}.name_tc',
      chinese: '{stopName}.name_en',
    },
    loadingText: {
      english: 'Finding nearby bus stops...',
      chinese: '正在尋找附近的巴士站...',
    },
    setRouteLoadingError: {
      english: 'API rate limit reached. Retrying in 10 seconds... (Attempt {loadingAttempts}/2)',
      chinese: '達到API速率限制。10秒後重試...（嘗試 {loadingAttempts}/2）',
    },
    setRouteLoadingErrorRetry: {
      english: 'Retrying to load routes... (Attempt {loadingAttempts}/2)',
      chinese: '重試載入路線...（嘗試 {loadingAttempts}/2）',
    },
    setRouteLoadingErrorAPILimit: {
      english: 'Couldn\'t load route information due to API rate limits. You can still view the stops.',
      chinese: '無法載入路線資訊，因為API速率限制。您仍然可以查看站點。',
    },
    setRouteLoadingErrorFetchError: {
      english: 'Couldn\'t fetch route information. Stops are still available.',
      chinese: '無法獲取路線資訊。仍然可以使用站點。',
    },
    noBusStopsFound: {
      english: 'No bus stops found nearby.',
      chinese: '附近沒有找到巴士站。',
    },
    tryIncreasingSearchRadius: {
      english: 'Try increasing the search radius or moving to a different location.',
      chinese: '請嘗試增加搜索半徑或移動到不同的位置。',
    },
    
  },
  routeETA: {
    itemStopName: {
        english: '{stopName}',
        chinese: '{stopName}',
    },
    loadingRoutesETA: {
      english: 'Loading route ETA...',
      chinese: '正在載入路線預計到達時間...',
    },
    expired: {
      english: 'Expired',
      chinese: '已開出',
    },
    arriving: {
      english: 'Arriving',
      chinese: '即將到達',
    },
    invalidTime: {
      english: 'Invalid time',
      chinese: '無效時間',
    },
    min: {
      english: 'min',
      chinese: '分鐘',
    },
    hrs: {
      english: 'hrs',
      chinese: '小時',
    },
    itemRemark: {
      english: '{remark}.rmk_en',
      chinese: '{remark}.rmk_tc',
    },
    noETA: {
      english: 'No arrival information',
      chinese: '沒有到達資訊'
    },
    noRoutesWithETA: {
      english: 'No routes with arrival information',
      chinese: '沒有帶有到達時間的路線'
    },
  },
  mapComponent: {
    loadingMap: {
      english: 'Loading map...',
      chinese: '正在載入地圖...',
    },
    loadingRouteLine: {
      english: 'Loading route line...',
      chinese: '正在載入路線線條...',
    },
  },
  operationBar: {
    currentRouteInfo: {
      english: 'Route Info',
      chinese: '當前路線信息',
    },
    stop: {
      english: 'Stops',
      chinese: '站',
    },
    oppisiteLine: {
      english: 'Opp Line',
      chinese: '對面線',
    },
    to: {
      english: 'To',
      chinese: '往',
    },
    routesDest: {
      english: '{route}.dest_en',
      chinese: '{route}.dest_tc',
    
  
    }
  }
  // 可以根據需要添加更多類別
};

// Hook 版本的翻譯函數，自動獲取當前語言
export function useTranslation() {
    const { language } = useLanguage();
    
    const t = useCallback((key: string, params?: any) => {
  
        return getTranslation(key, language, params);
    }, [language]);
    
    return { t, currentLanguage: language };
}

// 直接獲取翻譯的函數，需要提供當前語言和可選的參數替換
export const getTranslation = (
  key: string, 
  language: LanguageMode,
  params?: Record<string, any>
): string => {
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
    let text = result[language];
    
    // 修改参数替换逻辑处理对象属性访问
    const propertyRegex = /\{(\w+(?:\.\w+)*)\}\.(\w+)/g;
    let match;
    
    while ((match = propertyRegex.exec(text)) !== null) {
      const [fullMatch, objectPath, propName] = match;
      let obj = params;
      objectPath.split('.').forEach(keyPart => {
        obj = obj?.[keyPart];
      });
      if (obj && typeof obj === 'object' && propName in obj) {
        text = text.replace(fullMatch, String(obj[propName]));
      }
    }
    
    // 如果有參數，進行替換
    if (params) {
      // 處理簡單變量替換，例如 {count} -> 5
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        if (typeof paramValue !== 'object') {
          text = text.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
        }
      });
    }
    
    return text;
  }
  
  console.warn(`Translation for ${key} in ${language} not found`);
  return key;
};

