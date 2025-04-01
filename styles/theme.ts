import { StyleSheet } from 'react-native';

export const Colors = {
  light: {
    primary: '#007AFF',
    secondary: '#FF3B30',
    background: '#FFFFFF',
    card: '#FFFFFF',
    cardButton: '#F5F5F5',
    surface: '#F5F5F5',
    text: '#333333',
    subText: '#666666',
    border: '#E1E1E1',
    notification: '#FF3B30',
    icon: '#333333',
    tabBar: '#FFFFFF',
    tabBarInactive: '#8E8E93',
    statusBar: 'dark',
    mapMarker: '#FF3B30',
    mapMarkerActive: '#007AFF',
    loadingBackground: '#f5f5f5',
    banner: {
      info: {
        background: 'rgba(0, 122, 255, 0.8)',
        text: '#FFFFFF',
      },
      warning: {
        background: '#FFF3CD',
        text: '#856404',
      },
      error: {
        background: '#F8D7DA',
        text: '#721C24',
      },
    },
  },
  dark: {
    primary: '#0A84FF',
    secondary: '#FF453A',
    background: '#121212',
    card: '#1C1C1E',
    cardButton: '#2C2C2E',
    surface: '#2C2C2E',
    text: '#FFFFFF',
    subText: '#EBEBF5',
    border: '#3A3A3C',
    notification: '#FF453A',
    icon: '#FFFFFF',
    tabBar: '#1C1C1E',
    tabBarInactive: '#8E8E93',
    statusBar: 'light',
    mapMarker: '#FF453A',
    mapMarkerActive: '#0A84FF',
    loadingBackground: '#1C1C1E',
    banner: {
      info: {
        background: 'rgba(10, 132, 255, 0.8)',
        text: '#FFFFFF',
      },
      warning: {
        background: '#3A3400',
        text: '#FFD60A',
      },
      error: {
        background: '#3B1213',
        text: '#FF453A',
      },
    },
  },
};

export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  stylesFunc: (colors: typeof Colors.light) => T
) => {
  return {
    light: StyleSheet.create(stylesFunc(Colors.light)),
    dark: StyleSheet.create(stylesFunc(Colors.dark)),
  };
};
