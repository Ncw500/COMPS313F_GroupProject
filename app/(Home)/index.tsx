import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import NearbyStops from "@/components/NearbyStops";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/styles/theme";
import { useTranslation } from '@/utils/i18n';

export default function HomePage() {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { t } = useTranslation();
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{t('home.title')}</Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>{t('home.subtitle')}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.nearbyContainer}>

          <NearbyStops />
        </View>
      </View>
    </SafeAreaView>
  );
}
    
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    height: 90
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  nearbyContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  }
});


