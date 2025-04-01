import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { StopInfo, Route } from '@/types/Interfaces';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { calculateDistance, formatDistance, fetchAllStops, fetchAllRouteStops, fetchAllRoutes } from '@/utils/api';
import { Colors } from '@/styles/theme';
import { useTheme } from '@/context/ThemeContext';

interface NearbyStop extends StopInfo {
  distance: number; // Distance in meters from user
}

interface NearbyRoute extends Route {
  distanceFromUser: number; // Shortest distance from user in meters
  nearestStop: string; // Name of nearest stop
}

const RADIUS_KM = 0.5; // 500m radius for nearby stops

const NearbyRoutes = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyRoutes, setNearbyRoutes] = useState<NearbyRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  // Function to load data
  const loadNearbyRoutes = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
        setLoading(true);
      }

      // 1. Get user's location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(userLocation);

      // 2. Fetch all bus stops
      const allStops = await fetchAllStops();

      // 3. Find nearby stops within radius
      const nearbyStops = allStops
        .map((stop) => ({
          ...stop,
          distance: calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            parseFloat(stop.lat),
            parseFloat(stop.long)
          ),
        }))
        .filter((stop) => stop.distance <= RADIUS_KM * 1000) // Convert km to meters
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 30); // Limit to nearest 30 stops for performance

      if (nearbyStops.length === 0) {
        setLoading(false);
        setRefreshing(false);
        setNearbyRoutes([]);
        return;
      }

      // 4. Get routes for each nearby stop
      const routeStops = await fetchAllRouteStops();

      // Find route IDs that pass through nearby stops
      const nearbyStopIds = new Set(nearbyStops.map((stop) => stop.stop));
      const relevantRouteStops = routeStops.filter((rs) =>
        nearbyStopIds.has(rs.stop)
      );

      // Get unique route identifiers (route + bound + service_type)
      const uniqueRouteIdentifiers = new Set(
        relevantRouteStops.map(
          (rs) => `${rs.route}_${rs.bound}_${rs.service_type}`
        )
      );

      // 5. Fetch full route details
      const allRoutes = await fetchAllRoutes();

      // 6. Match routes with nearby stops
      const matchedNearbyRoutes: NearbyRoute[] = [];
      
      // For each unique route identifier found
      uniqueRouteIdentifiers.forEach((identifier) => {
        const [routeNum, bound, serviceType] = identifier.split('_');
        
        // Find the matching route in all routes
        const matchedRoute = allRoutes.find(
          (r) => 
            r.route === routeNum && 
            r.bound === bound && 
            r.service_type === serviceType
        );
        
        if (matchedRoute) {
          // Find the nearest stop for this route
          const routePassesThrough = relevantRouteStops.filter(
            (rs) => 
              rs.route === routeNum && 
              rs.bound === bound && 
              rs.service_type === serviceType
          );
          
          // Get distances of each stop this route passes through
          const stopsWithDistances = routePassesThrough.map((rs) => {
            const matchedStop = nearbyStops.find((stop) => stop.stop === rs.stop);
            return {
              stopId: rs.stop,
              stopName: matchedStop?.name_en || 'Unknown',
              distance: matchedStop?.distance || Infinity
            };
          });
          
          // Sort by distance and get the nearest
          stopsWithDistances.sort((a, b) => a.distance - b.distance);
          const nearest = stopsWithDistances[0];
          
          if (nearest) {
            matchedNearbyRoutes.push({
              ...matchedRoute,
              distanceFromUser: nearest.distance,
              nearestStop: nearest.stopName
            });
          }
        }
      });
      
      // Sort by distance from user
      matchedNearbyRoutes.sort((a, b) => a.distanceFromUser - b.distanceFromUser);
      
      setNearbyRoutes(matchedNearbyRoutes);
    } catch (error) {
      console.error('Error fetching nearby routes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadNearbyRoutes();
  }, []);

  // Handle refresh
  const onRefresh = () => {
    loadNearbyRoutes(true);
  };

  // Navigate to route detail
  const handleRoutePress = (route: NearbyRoute) => {
    const routeId = `${route.route}_${route.bound}_${route.service_type}`;
    router.push(`/(Home)/${routeId}`);
  };

  // Render each route item
  const renderRouteItem = ({ item }: { item: NearbyRoute }) => (
    <TouchableOpacity
      style={styles.routeItem}
      onPress={() => handleRoutePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.routeHeader}>
        <Text style={styles.routeNumber}>{item.route}</Text>
        <View style={styles.distanceBadge}>
          <MaterialIcons name="near-me" size={14} color="#FFF" />
          <Text style={styles.distanceText}>{formatDistance(item.distanceFromUser)}</Text>
        </View>
      </View>
      <Text style={styles.routeDestination}>
        {item.orig_en} → {item.dest_en}
      </Text>
      <Text style={styles.nearestStop}>
        Nearest stop: {item.nearestStop}
      </Text>
    </TouchableOpacity>
  );

  if (locationError) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="location-off" size={40} color="#888" />
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLocationError(null);
            loadNearbyRoutes();
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Finding nearby routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={nearbyRoutes}
        renderItem={renderRouteItem}
        keyExtractor={(item) => `${item.route}_${item.bound}_${item.service_type}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Nearby Routes</Text>
            <Text style={styles.subtitle}>
              Found {nearbyRoutes.length} routes within {RADIUS_KM}km
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="location-searching" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No bus routes found nearby</Text>
            <Text style={styles.emptySubtext}>
              Try moving closer to a bus stop or increasing search radius
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default NearbyRoutes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  routeItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  routeDestination: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  nearestStop: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  distanceBadge: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
