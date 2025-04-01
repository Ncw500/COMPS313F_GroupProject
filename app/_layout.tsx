import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { StatusBar, useColorScheme, Platform } from "react-native";
import { Colors } from "@/styles/theme";
import { LanguageProvider } from "@/context/LanguageContext";
import { useTranslation } from "@/utils/i18n";

// Tabs wrapper with theme support
function TabsWrapper() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  useEffect(() => {
    // Update status bar style
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(colors.background);
    }
  }, [isDark]);

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.tabBarInactive,
      tabBarStyle: {
        borderTopColor: colors.border,
        backgroundColor: colors.tabBar,
      },
    }}>
      <Tabs.Screen
        name="(Home)"
        options={{
          title: t('home.index'),
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(Routes)"
        options={{
          title: t('routes.index'),
          tabBarIcon: ({ color }) => <FontAwesome5 name="bus" size={20} color={color} />,
        }}
      />
      {/* Hide Search tab but make it accessible */}
      <Tabs.Screen
        name="(Search)"
        options={{
          title: t('search.index'),
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Searchs"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="(Setting)"
        options={{
          title: t('settings.index'),
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="Search/index"
        options={{
          href: null,
        }}
      /> */}
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TabsWrapper />
      </LanguageProvider>
    </ThemeProvider>
  );
}
