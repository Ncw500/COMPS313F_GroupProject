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
} from 'react-native';
import * as Location from 'expo-location';
import { StopInfo, RouteStop, Route } from '@/types/Interfaces';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { calculateDistance, formatDistance, fetchAllStops, fetchAllRouteStops, fetchAllRoutes } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';
import { useTranslation } from '@/utils/i18n';

interface StopGroup {
  name: string;        // The display name of the stop group
  stops: StopInfo[];   // All stops in this group
  primaryStop: StopInfo; // The closest stop (used for display)
  distance: number;    // Distance to the closest stop
}

interface NearbyStop {
  stopGroup: StopGroup;
  routes?: Array<{
    routeId: string;
    bound: string;
    serviceType: string;
    destination_en: string;  // Changed from 'destination' to 'destination_en'
    destination_tc: string;  // Added Chinese destination
    origin_en?: string;      // Add origin English name
    origin_tc?: string;      // Add origin Chinese name
    specificStopId: string;
    time?: string;
    eta?: string;
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

      // Add distance information to each stop
      const stopsWithDistance = allStops.map((stop) => ({
        ...stop,
        distance: calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          parseFloat(stop.lat),
          parseFloat(stop.long)
        ),
      }))
      .filter((stop) => stop.distance <= RADIUS_KM * 1000);

      // Group stops by name
      const nameGroups: Record<string, StopInfo[]> = {};
      stopsWithDistance.forEach(stop => {
        // Use both English and Chinese names as the key to ensure proper matching
        const nameKey = `${stop.name_en.toLowerCase().trim()}_${stop.name_tc.toLowerCase().trim()}`;
        
        if (!nameGroups[nameKey]) {
          nameGroups[nameKey] = [];
        }
        nameGroups[nameKey].push(stop);
      });

      // Create stop groups
      const stopGroups: StopGroup[] = Object.values(nameGroups).map(stops => {
        // Sort stops by distance to find the closest one
        stops.sort((a, b) => a.distance - b.distance);
        const primaryStop = stops[0];
        
        return {
          name: primaryStop.name_en,
          stops: stops,
          primaryStop: primaryStop,
          distance: primaryStop.distance
        };
      });

      // Sort groups by distance and limit to 30
      stopGroups.sort((a, b) => a.distance - b.distance);
      const limitedGroups = stopGroups.slice(0, 30);
      
      // Create initial nearby stops array (without routes yet)
      const initialNearbyStops = limitedGroups.map(group => ({
        stopGroup: group,
        routes: []
      }));

      console.log(`Step 3: Processing took ${Date.now() - processStartTime} ms`);
      
      setNearbyStops(initialNearbyStops);
      setLoading(false);

      if (initialNearbyStops.length === 0) {
        setRefreshing(false);
        return;
      }

      // Load route data for the grouped stops
      loadRouteDataForGroups(limitedGroups, allRouteStops);

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

  // Fetch ETA data for all stops in a group
  const fetchETAForStopGroup = async (stopGroup: StopGroup): Promise<Record<string, {eta: string, stopId: string}>> => {
    try {
      const etaMaps = await Promise.all(stopGroup.stops.map(async (stop) => {
        try {
          const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stop.stop}`);
          const data = await response.json();
          
          if (!data?.data || !Array.isArray(data.data)) {
            return { stopId: stop.stop, etaEntries: [] };
          }
          
          return { 
            stopId: stop.stop, 
            etaEntries: data.data 
          };
        } catch (err) {
          console.error(`Error fetching ETA for stop ${stop.stop}:`, err);
          return { stopId: stop.stop, etaEntries: [] };
        }
      }));
      
      // Combine and process all ETA data
      const combinedEtaMap: Record<string, {eta: string, stopId: string}> = {};
      
      etaMaps.forEach(({ stopId, etaEntries }) => {
        etaEntries.forEach((eta: any) => {
          if (!eta.eta) return;
          
          const routeKey = `${eta.route}_${eta.dir}_${eta.service_type}`;
          const etaTime = new Date(eta.eta);
          const now = new Date();
          const minutesRemaining = Math.round((etaTime.getTime() - now.getTime()) / (1000 * 60));
          
          // Only add if:
          // 1. We don't already have an ETA for this route, or
          // 2. This ETA is sooner than the one we have
          if (minutesRemaining >= 0 && 
              (!combinedEtaMap[routeKey] || 
               combinedEtaMap[routeKey].eta === t('routeETA.arriving') ||
               (minutesRemaining === 0 && combinedEtaMap[routeKey].eta !== t('routeETA.arriving')) || 
               (minutesRemaining > 0 && parseInt(combinedEtaMap[routeKey].eta) > minutesRemaining))
          ) {
            combinedEtaMap[routeKey] = {
              eta: minutesRemaining === 0 ? t('routeETA.arriving') : `${minutesRemaining} min`,
              stopId: stopId
            };
          }
        });
      });
      
      return combinedEtaMap;
    } catch (error) {
      console.error('Error fetching ETAs for stop group:', error);
      return {};
    }
  };

  // Load route data for grouped stops
  const loadRouteDataForGroups = async (stopGroups: StopGroup[], allRouteStops: RouteStop[]) => {
    setIsLoadingRoutes(true);
    const startTime = Date.now();
    
    try {
      const allRoutes = await fetchAllRoutes();
      console.log("fetchAllRoutes completed in", Date.now() - startTime, "ms with", allRoutes.length, "routes");
      
      try {
        // Process each stop group
        const stopsWithRoutes = await Promise.all(
          stopGroups.map(async (group) => {
            // Get all stop IDs in this group
            const stopIds = group.stops.map(stop => stop.stop);
            
            // Find all route-stops for this group
            const routeStopsForGroup = allRouteStops.filter(rs => 
              stopIds.includes(rs.stop)
            );
            
            // Get unique route identifiers from the route-stops
            const uniqueRouteKeys = new Set(
              routeStopsForGroup.map(rs => `${rs.route}_${rs.bound}_${rs.service_type}`)
            );
            
            // Create a map of route key -> stop ID
            const routeStopMap: Record<string, string> = {};
            routeStopsForGroup.forEach(rs => {
              const key = `${rs.route}_${rs.bound}_${rs.service_type}`;
              routeStopMap[key] = rs.stop;
            });
            
            // Fetch ETA data for all stops in this group
            const etaMap = await fetchETAForStopGroup(group);
            
            // Create route objects with correct stop IDs
            const routes = Array.from(uniqueRouteKeys).map(key => {
              const [routeId, bound, serviceType] = key.split('_');
              
              // Find matching route for destination info
              const matchingRoute = allRoutes.find(
                route =>
                  route.route === routeId &&
                  route.bound === bound &&
                  route.service_type === serviceType
              );
              
              // Use ETA if available, otherwise use default values
              const etaInfo = etaMap[key];
              
              return {
                routeId,
                bound,
                serviceType,
                destination_en: matchingRoute ? matchingRoute.dest_en : 'Unknown',
                destination_tc: matchingRoute ? matchingRoute.dest_tc : '未知',
                origin_en: matchingRoute ? matchingRoute.orig_en : 'Unknown',
                origin_tc: matchingRoute ? matchingRoute.orig_tc : '未知',
                specificStopId: etaInfo?.stopId || routeStopMap[key],
                eta: etaInfo?.eta || ''
              };
            });
            
            // Sort routes numerically if possible
            routes.sort((a, b) => {
              const numA = parseInt(a.routeId);
              const numB = parseInt(b.routeId);
              
              if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
              }
              return a.routeId.localeCompare(b.routeId);
            });
            
            return {
              stopGroup: group,
              routes
            };
          })
        );
        
        setNearbyStops(stopsWithRoutes);
        setRouteLoadingError(null);
        
      } catch (routeStopError) {
        console.error('Error loading route-stops:', routeStopError);

        if (routeStopError instanceof Error && routeStopError.message.includes('rate limit') && loadingAttempts.current < 2) {
          loadingAttempts.current++;
          setRouteLoadingError(t('nearbyStops.setRouteLoadingError', { loadingAttempts: loadingAttempts.current }));

          // Wait and retry after 10 seconds
          setTimeout(() => {
            setRouteLoadingError(t('nearbyStops.setRouteLoadingErrorRetry', { loadingAttempts: loadingAttempts.current }));
            loadRouteDataForGroups(stopGroups, allRouteStops);
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
      console.log('loadRouteDataForGroups executed in', duration, 'ms');
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

  // Navigate to specific route with the correct stop information
  const navigateToRoute = (routeId: string, bound: string, serviceType: string, stopGroup: StopGroup, specificStopId: string) => {
    const startTime = Date.now();
    try {
      // Find the specific stop with the matching ID
      const specificStop = stopGroup.stops.find(stop => stop.stop === specificStopId) || stopGroup.primaryStop;
      
      router.push({
        pathname: "/(Home)/[id]",
        params: {
          id: `${routeId}_${bound}_${serviceType}`,
          stopId: specificStopId,
          stopLat: specificStop.lat,
          stopLng: specificStop.long,
          stopName: specificStop.name_en,
          stopSeq: "1" // Default sequence
        }
      });
    } finally {
      const duration = Date.now() - startTime;
      console.log('navigateToRoute executed in', duration, 'ms');
    }
  };

  // Replace the RoutesList component to use the stop group and specific stop ID
  const RoutesList = ({
    routes,
    stopGroup,
  }: {
    routes: Array<{
      routeId: string;
      bound: string;
      serviceType: string;
      destination_en: string;
      destination_tc: string;
      origin_en?: string;
      origin_tc?: string;
      specificStopId: string;
      time?: string;
      eta?: string;
    }>;
    stopGroup: StopGroup;
  }) => {
    return (
      <View style={styles.routeListContainer}>
        <FlatList
          data={routes}
          keyExtractor={(item, index) => `${item.routeId}_${item.bound}_${item.serviceType}_${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.routeListItem, { backgroundColor: colors.cardButton }]}
              onPress={() => navigateToRoute(
                item.routeId, 
                item.bound, 
                item.serviceType, 
                stopGroup,
                item.specificStopId
              )}
            >
              <View style={styles.routeListItemContent}>
                <Text style={[styles.routeNumber, { color: colors.primary }]}>{item.routeId}</Text>
                <View style={styles.routeDetailContainer}>
                  <Text style={[styles.routeDestination, { color: colors.text }]} numberOfLines={1}>
                    {t('search.destinationRouteName', { route: {
                      dest_en: item.destination_en,
                      dest_tc: item.destination_tc
                    }})}
                  </Text>
                  {item.eta ? (
                    <Text style={[styles.routeTime, { color: colors.primary }]}>
                      {item.eta}
                    </Text>
                  ) : null}
                </View>
                <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.routeListContentContainer}
        />
      </View>
    );
  };

  // Update the renderStopItem to hide the stop group count
  const renderStopItem = ({ item }: { item: NearbyStop }) => {
    return (
      <View style={[styles.stopItem, {
        backgroundColor: colors.card,
        shadowColor: isDark ? 'transparent' : '#000',
      }]}>
        <View style={styles.stopHeader}>
          <View style={styles.stopIconContainer}>
            <Text style={[styles.stopName, { color: colors.text, marginBottom: 5 }]}>
              {item.stopGroup.primaryStop.name_en}
            </Text>
            <Text style={[styles.stopNameLocal, { color: colors.subText }]}>
              {item.stopGroup.primaryStop.name_tc}
            </Text>
          </View>

          <View style={[styles.distanceBadge, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="near-me" size={14} color="#FFF" />
            <Text style={styles.distanceText}>{formatDistance(item.stopGroup.distance)}</Text>
          </View>
        </View>

        {isLoadingRoutes && !item.routes?.length && (
          <View style={styles.routeLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.routeLoadingText, { color: colors.subText }]}>{t('nearbyStops.loadingInfo')}</Text>
          </View>
        )}

        {item.routes && item.routes.length > 0 ? (
          <View style={styles.routesContainer}>
            <Text style={[styles.routesTitle, { color: colors.subText }]}>{t('nearbyStops.routePassingStops')}</Text>
            <RoutesList routes={item.routes} stopGroup={item.stopGroup} />
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
        keyExtractor={(item, index) => `group-${index}-${item.stopGroup.primaryStop.stop}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={[styles.header, { backgroundColor: colors.card }]}>
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
  },
  // Add styles for the dropdown
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  picker: {
    height: 45,
  },
  // Remove dropdown styles and add list styles
  routeListContainer: {
    marginTop: 8,
  },
  routeListContentContainer: {
    paddingBottom: 5,
  },
  routeListItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  routeListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumber: {
    fontWeight: '700',
    fontSize: 16,
    minWidth: 40,
  },
  routeDetailContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  routeDestination: {
    fontSize: 14,
    fontWeight: '500',
  },
  routeTime: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  // Add styles for the stop count badge
  stopCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  stopCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
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
