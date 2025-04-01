import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';
import { useTranslation } from '@/utils/i18n';

interface ThemeToggleProps {
  style?: any;
  showLabel?: boolean;
}

export const ThemeToggle = ({ style, showLabel = false }: ThemeToggleProps) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  // Determine icon based on current theme
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return 'sunny-outline';
      case 'dark':
        return 'moon-outline';
      case 'system':
        return 'settings-outline';
      default:
        return 'sunny-outline';
    }
  };

  // Get label text for current theme
  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'system':
        return 'system';
    }
  };

  return (
    <TouchableOpacity 
      onPress={toggleTheme} 
      style={[
        styles.container, 
        { backgroundColor: isDark ? colors.cardButton : colors.cardButton },
        style
      ]}
>
      <Ionicons name={getThemeIcon()} size={22} color={colors.primary} />
      {showLabel && (
        <Text style={[styles.label, { color: colors.text }]}>
          {t(`settings.themeMode.${getThemeLabel()}`)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
   
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  }
});
