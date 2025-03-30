import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import NearbyStops from "@/components/NearbyStops";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/styles/theme";

export default function HomePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Bus App</Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>Find your next bus easily</Text>
            </View>
            <ThemeToggle showLabel={true} />
          </View>
        </View>
        
        <View style={styles.nearbyContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text, backgroundColor: isDark ? colors.surface : '#f5f5f5' }]}>
            Nearby Stops
          </Text>
          <NearbyStops />
        </View>
      </View>
    </SafeAreaView>
  );
}
    
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
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


