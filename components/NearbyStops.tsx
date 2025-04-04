import { cache } from '@/utils/api';

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { StopInfo, RouteStop, Route } from '@/types/Interfaces';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { calculateDistance, formatDistance, fetchAllStops, fetchAllRouteStops, fetchAllRoutes } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';
import { useTranslation } from '@/utils/i18n';

interface NearbyStop extends StopInfo {
  distance: number;
  routes?: Array<{
    routeId: string;
    bound: string;
    serviceType: string;
    destination: string;
  }>;
}



const RADIUS_KM = 0.5; // 500m radius to search for stops

const NearbyStops = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyStops, setNearbyStops] = useState<NearbyStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [routeLoadingError, setRouteLoadingError] = useState<string | null>(null);
  const loadingAttempts = useRef(0);
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  // Function to load nearby bus stops with route information - with progressive loading
  const loadNearbyStops = async (forceRefresh = false) => {
    const startTime = Date.now();
    console.log('--- loadNearbyStops START ---');
    try {
      if (forceRefresh) {
        setRefreshing(true);
      }

      setLoading(true);
      setApiError(null);
      setRouteLoadingError(null);
      loadingAttempts.current = 0;

      // 获取用户位置
      console.log('Step 1: Start requesting location permissions');
      const permissionStartTime = Date.now();
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log(`Step 1: Permissions request took ${Date.now() - permissionStartTime} ms`);

      if (status !== 'granted') {
        setLocationError(t('nearbyStops.locationPermissionDenied'));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('Step 1: Start getting current position');
      
      // console.log(`❤️‍🩹❤️‍🩹❤️‍🩹❤️‍🩹❤️‍🩹❤️‍🩹❤️‍🩹❤️‍🩹❤️‍🩹❤️‍🩹Step 1: Getting current position took`);
      const positionStartTime = Date.now();
      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // 5 seconds
      });
      // console.log(`💝💝💝💝💝💝💝💝💝💝Step 1: Getting current position took ${Date.now() - positionStartTime} ms`);
      console.log(`Step 1: Current position coordinates: latitude=${userLocation.coords.latitude.toFixed(6)}, longitude=${userLocation.coords.longitude.toFixed(6)}`);
      setLocation(userLocation);

      // 获取所有站点和路线数据时优先使用缓存
      const [allStops, allRouteStops] = await Promise.all([
        forceRefresh ? fetchAllStops() : getStopsFromCacheOrFetch(), // 添加缓存逻辑
        forceRefresh ? fetchAllRouteStops() : getRouteStopsFromCacheOrFetch()
      ]) as [StopInfo[], RouteStop[]];

      // console.log(`Step 2: Total fetch took ${Date.now() - fetchStartTime} ms`);

      // 计算距离并过滤附近站点
      console.log('Step 3: Start processing stops data');
      const processStartTime = Date.now();
      const stopsWithDistance = allStops
        .map((stop: StopInfo) => ({ // 明确指定 stop 类型
          ...stop,
          distance: calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            parseFloat(stop.lat),
            parseFloat(stop.long)
          ),
        }))
        .filter((stop) => stop.distance <= RADIUS_KM * 1000)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 30);
      console.log(`Step 3: Processing took ${Date.now() - processStartTime} ms`);

      // 设置基本站点数据
      setNearbyStops(stopsWithDistance);
      setLoading(false);

      // 如果没有找到站点，提前返回
      if (stopsWithDistance.length === 0) {
        setRefreshing(false);
        return;
      }

      // 加载路线数据
      loadRouteData(stopsWithDistance, allRouteStops);

    } catch (error) {
      console.error('Error loading nearby stops:', error);
      setApiError(t('nearbyStops.setApiError'));
      setLoading(false);
      setIsLoadingRoutes(false);
      setRefreshing(false);
    } finally {
      const duration = Date.now() - startTime;
      console.log(`--- loadNearbyStops END (Total: ${duration} ms) ---`);
      setRefreshing(false);
    }
  };

  // Separate function to load route data with retry logic
  const loadRouteData = async (stopsWithDistance: NearbyStop[], allRouteStops: RouteStop[]) => {
    const startTime = Date.now();
    try {
      // Load route data in a separate try/catch to handle failure gracefully
      const startTime = Date.now();
      const allRoutes = await fetchAllRoutes().then(result => {
        console.log("fetchAllRoutes completed in", Date.now() - startTime, "ms with", result.length, "routes");
        return result;
      });

      try {
        // Find which routes pass through each nearby stop
        const nearbyWithRoutes = await Promise.all(
          stopsWithDistance.map(async (stop) => {
            // Find all route-stop entries for this stop
            const routesForStop = allRouteStops.filter(
              routeStop => routeStop.stop === stop.stop
            );

            // Match with route details to get destinations
            const routeDetails = routesForStop.map(routeStop => {
              const matchingRoute = allRoutes.find(
                route =>
                  route.route === routeStop.route &&
                  route.bound === routeStop.bound &&
                  route.service_type === routeStop.service_type
              );

              return {
                routeId: routeStop.route,
                bound: routeStop.bound,
                serviceType: routeStop.service_type,
                destination: matchingRoute ? matchingRoute.dest_en : 'Unknown'
              };
            });

            // Sort routes
            routeDetails.sort((a, b) => {
              const numA = parseInt(a.routeId);
              const numB = parseInt(b.routeId);

              if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
              }
              return a.routeId.localeCompare(b.routeId);
            });

            return {
              ...stop,
              routes: routeDetails
            };
          })
        );

        setNearbyStops(nearbyWithRoutes);
        setRouteLoadingError(null);

      } catch (routeStopError) {
        console.error('Error loading route-stops:', routeStopError);

        if (routeStopError instanceof Error && routeStopError.message.includes('rate limit') && loadingAttempts.current < 2) {
          loadingAttempts.current++;
          setRouteLoadingError(t('nearbyStops.setRouteLoadingError', { loadingAttempts: loadingAttempts.current }));

          // Wait and retry after 10 seconds
          setTimeout(() => {
            setRouteLoadingError(t('nearbyStops.setRouteLoadingErrorRetry', { loadingAttempts: loadingAttempts.current }));
            loadRouteData(stopsWithDistance, allRouteStops);
          }, 10000);
          return;
        }

        setRouteLoadingError(t('nearbyStops.setRouteLoadingErrorAPILimit'));
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      setRouteLoadingError(t('nearbyStops.setRouteLoadingErrorFetchError'));
    } finally {
      const duration = Date.now() - startTime;
      console.log('loadRouteData executed in', duration, 'ms');
      setIsLoadingRoutes(false);
      setRefreshing(false);
    }
  };

  // Load stops on component mount
  useEffect(() => {
    loadNearbyStops();
  }, []);

  // Handle refresh
  const onRefresh = () => {
    loadNearbyStops(true);
  };

  // Navigate to specific route with stop information
  const navigateToRoute = (routeId: string, bound: string, serviceType: string, stop: NearbyStop) => {
    const startTime = Date.now();
    try {
      router.push({
        pathname: "/(Home)/[id]",
        params: {
          id: `${routeId}_${bound}_${serviceType}`,
          stopId: stop.stop,
          stopLat: stop.lat,
          stopLng: stop.long,
          stopName: stop.name_en,
          stopSeq: "1" // Default sequence since we don't know the exact sequence here
        }
      });
    } finally {
      const duration = Date.now() - startTime;
      console.log('navigateToRoute executed in', duration, 'ms');
    }
  };

  // Render route chip
  const RouteChip = ({
    routeId,
    bound,
    serviceType,
    destination,
    stop
  }: {
    routeId: string;
    bound: string;
    serviceType: string;
    destination: string;
    stop: NearbyStop;
  }) => {
    const startTime = Date.now();
    const component = (
      <TouchableOpacity
        style={[styles.routeChip, {
          backgroundColor: colors.cardButton,
        }]}
        onPress={() => navigateToRoute(routeId, bound, serviceType, stop)}
      >
        <Text style={[styles.routeChipNumber, { color: colors.primary }]}>{routeId} / {bound} / {serviceType}</Text>
        <Text style={[styles.routeChipDestination, { color: colors.subText }]} numberOfLines={1}>
          {destination}
        </Text>
      </TouchableOpacity>
    );

    const duration = Date.now() - startTime;
    return component;
  };

  // Render each stop item - update to handle missing route data
  const renderStopItem = ({ item }: { item: NearbyStop }) => {
    const startTime = Date.now();
    return (
      <View style={[styles.stopItem, {
        backgroundColor: colors.card,
        shadowColor: isDark ? 'transparent' : '#000',
      }]}>
        <View style={styles.stopHeader}>
          <View style={styles.stopIconContainer}>
            <Text style={[styles.stopName, { color: colors.text, marginBottom: 5 }]}>{t('nearbyStopsChips.stopNameMain', { stopName: item })}</Text>
            <Text style={[styles.stopNameLocal, { color: colors.subText }]}>{t('nearbyStopsChips.stopNameSub', { stopName: item })}</Text>
          </View>

          <View style={[styles.distanceBadge, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="near-me" size={14} color="#FFF" />
            <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
          </View>
        </View>


        {isLoadingRoutes && !item.routes && (
          <View style={styles.routeLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.routeLoadingText, { color: colors.subText }]}>{t('nearbyStops.loadingInfo')}</Text>
          </View>
        )}

        {item.routes && item.routes.length > 0 ? (
          <View style={styles.routesContainer}>
            <Text style={[styles.routesTitle, { color: colors.subText }]}>{t('nearbyStops.routePassingStops')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routesScrollContent}
            >
              {item.routes.map((route, index) => (
                <RouteChip
                  key={`${route.routeId}_${route.bound}_${route.serviceType}_${index}`}
                  routeId={route.routeId}
                  bound={route.bound}
                  serviceType={route.serviceType}
                  destination={route.destination}
                  stop={item}
                />
              ))}
            </ScrollView>
          </View>
        ) : (!isLoadingRoutes && (
          <Text style={[styles.noRoutesText, { color: colors.subText }]}>
            {routeLoadingError ? t('nearbyStops.routeLoadingError') : t('nearbyStops.noNearbyStops')}
          </Text>
        ))}
      </View>
    );
  };

  if (locationError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons name="location-off" size={40} color={colors.subText} />
        <Text style={[styles.errorText, { color: colors.text }]}>{locationError}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setLocationError(null);
            loadNearbyStops();
          }}
        >
          <Text style={styles.retryText}>{t('nearbyStops.locationPermissionRetry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Update return with API error handling
  if (apiError && nearbyStops.length === 0) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={40} color={colors.subText} />
        <Text style={[styles.errorText, { color: colors.text }]}>{apiError}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setApiError(null);
            loadNearbyStops(true);
          }}
        >
          <Text style={styles.retryText}>{t('nearbyStops.locationPermissionRetry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subText }]}>{t('nearbyStopsChips.loadingText')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={nearbyStops}
        renderItem={renderStopItem}
        keyExtractor={(item) => item.stop}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('home.nearbyRoutes')}</Text>
            <Text style={[styles.subtitle, { color: colors.subText }]}>
              {t('routes.nearbyStopsFound', { count: nearbyStops.length, distance: RADIUS_KM })}
            </Text>
            {apiError && (
              <Text style={[styles.errorBanner, {
                backgroundColor: colors.banner.error.background,
                color: colors.banner.error.text
              }]}>{apiError}</Text>
            )}
            {routeLoadingError && (
              <Text style={[styles.warningBanner, {
                backgroundColor: colors.banner.warning.background,
                color: colors.banner.warning.text
              }]}>{routeLoadingError}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
            <MaterialIcons name="location-searching" size={60} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, { color: colors.text }]}>{t('nearbyStopsChips.noBusStopsFound')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.subText }]}>
              {t('nearbyStopsChips.tryIncreasingSearchRadius')}
            </Text>
          </View>
        }
        contentContainerStyle={
          nearbyStops.length === 0 ? { flex: 1, backgroundColor: colors.background } : [styles.listContent, { backgroundColor: colors.background }]
        }
      />
    </View>
  );
};

export default NearbyStops;

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
  stopItem: {
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
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    marginBottom: 4,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  stopNameLocal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  stopId: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  distanceBadge: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    height: 30,
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  routesContainer: {
    marginTop: 8,
  },
  routesTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  routesScrollContent: {
    paddingBottom: 5,
  },
  routeChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 150,
  },
  routeChipNumber: {
    fontWeight: '700',
    color: '#007AFF',
    fontSize: 14,

  },
  routeChipDestination: {
    fontSize: 12,
    color: '#555',
    flex: 1,
    flexShrink: 1,
  },
  noRoutesText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 8,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
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
  routeLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  routeLoadingText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  errorBanner: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
  warningBanner: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
  stopIconContainer: {
    maxWidth: '70%',
  }
});

const retryableFetch = async (func: Function, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await func();
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Retry failed');
};

async function getStopsFromCacheOrFetch() {
  const cachedData = cache['all_stops_cache_key'];
  if (cachedData && Date.now() - cachedData.timestamp < 20 * 60 * 1000) {
    return cachedData.data;
  }
  return await fetchAllStops();
}

async function getRouteStopsFromCacheOrFetch() {
  const cachedData = cache['all_route_stops'];
  if (cachedData && Date.now() - cachedData.timestamp < 20 * 60 * 1000) {
    return cachedData.data;
  }
  return await fetchAllRouteStops();
}
