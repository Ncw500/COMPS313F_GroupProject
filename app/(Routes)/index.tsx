import { FlatList, RefreshControl, StyleSheet, Text, View, StatusBar, SafeAreaView } from "react-native";
import RouteItem from "@/components/RouteItem";
import { Route } from "@/types/Interfaces";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { fetchAllRoutes } from "@/utils/api";
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AllRoutesScreen() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [renderCount, setRenderCount] = useState(20);
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const results = await fetchAllRoutes();
      setRoutes(results);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const renderItem = ({ item }: { item: Route }) => {
    return <RouteItem route={item} />;
  }

  const generateKey = (item: Route) => {
    return `${item.route}_${item.bound}_${item.service_type}`;
  }

  const onEndReached = () => {
    setRenderCount(prevCount => Math.min(prevCount + 20, routes.length));
  };

  const onRefresh = () => {
    setRenderCount(20);
    setRefreshing(true);
    fetchRoutes();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { 
        backgroundColor: colors.card,
        borderBottomColor: colors.border
      }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>All Bus Routes</Text>
            <Text style={[styles.subtitle, { color: colors.subText }]}>{routes.length} routes available</Text>
          </View>
          <ThemeToggle />
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subText }]}>Loading routes...</Text>
        </View>
      ) : (
        <FlatList
          data={routes.slice(0, renderCount)}
          renderItem={renderItem}
          keyExtractor={generateKey}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          style={{ backgroundColor: colors.background }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  }
});
