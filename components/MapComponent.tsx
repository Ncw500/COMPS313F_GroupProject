import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Callout, Polyline, Region, MapStyleElement, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Entypo } from '@expo/vector-icons';
import { RouteStop, StopInfo } from '@/types/Interfaces';
import { fetchDirectionsPath, fetchDirectionsPathWithBackup } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';
import { useTranslation } from '@/utils/i18n';

interface StopLocation {
  stopId: string;
  latitude: number;
  longitude: number;
  stopName: string;
  seq: number;
}

interface MapComponentProps {
  routeId?: string;
  routeBound?: string;
  serviceType?: string;
  selectedStop?: StopLocation | null;
  // 新增 routeStops变化回调
  onRouteStopsChange?: (stops: BusStop[]) => void;
}

interface BusStop {
  stop: string;
  name_en: string;
  name_tc: string;
  name_sc: string;
  lat: string;
  long: string;
  seq?: number; // Optional sequence number for ordered stops
}

// Interface for path coordinates
interface PathCoordinate {
  latitude: number;
  longitude: number;
}

interface RoutePathSection {
  coordinates: PathCoordinate[];
  color?: string;
}

// Dark mode map style
const darkMapStyle: MapStyleElement[] = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

const MapComponent = forwardRef(({ routeId, routeBound, serviceType, selectedStop, onRouteStopsChange }: MapComponentProps, ref) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeStops, setRouteStops] = useState<BusStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapViewRef = useRef<MapView | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [routePaths, setRoutePaths] = useState<RoutePathSection[]>([]);
  const [isLoadingPath, setIsLoadingPath] = useState(false);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [pathsRendered, setPathsRendered] = useState(false);
  const pathRenderAttempts = useRef(0);
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const [mapProviderError, setMapProviderError] = useState(false);
  const { t } = useTranslation();

  // Handle when a stop is selected from the ETA list
  useEffect(() => {
    if (selectedStop && mapViewRef.current) {
      focusOnStop(selectedStop);
    }
  }, [selectedStop]);

  // Focus map on a specific stop
  const focusOnStop = (stop: StopLocation) => {
    console.log(`Entering focusOnStop at ${new Date().toISOString()}`);
    if (!mapViewRef.current) return;

    const region: Region = {
      latitude: stop.latitude,
      longitude: stop.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    mapViewRef.current.animateToRegion(region, 1000);

    setActiveMarkerId(stop.stopId);

    setTimeout(() => {
      setActiveMarkerId(null);
    }, 3000);

    setInitialRegionSet(true);
    console.log(`Exiting focusOnStop at ${new Date().toISOString()}`);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focusOnStop
  }));

  useEffect(() => {
    (async () => {
      console.log(`Entering useEffect (location & route) at ${new Date().toISOString()}`);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission not granted');
          return;
        }

        let loc = await Location.getLastKnownPositionAsync({});
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }
        setLocation(loc);
      } catch (error) {
        console.error('Error getting location:', error);
      }

      if (routeId && routeBound && serviceType) {
        await fetchRouteStops(routeId, routeBound, serviceType);
      } else {
        await fetchNearbyStops();
      }
    })().finally(() => {
      console.log(`Exiting useEffect (location & route) at ${new Date().toISOString()}`);
    });
  }, [routeId, routeBound, serviceType]);

  const fetchNearbyStops = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop');
      const data = await response.json();

      const limitedStops = data.data.slice(0, 50);

      setRouteStops(limitedStops);
    } catch (error) {
      console.error('Error fetching bus stops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch route stops and then fetch path directions
  const fetchRouteStops = async (routeId: string, routeBound: string, serviceType: string) => {
    console.log(`Entering fetchRouteStops at ${new Date().toISOString()}`);
    try {
      setIsLoading(true);

      const boundDirection = routeBound === 'O' ? 'outbound' : 'inbound';

      const routeStopsResponse = await fetch(
        `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeId}/${boundDirection}/${serviceType}`
      );
      const routeStopsData = await routeStopsResponse.json();

      if (!routeStopsData.data || !Array.isArray(routeStopsData.data)) {
        console.error('Invalid route stops data:', routeStopsData);
        return;
      }

      const stopPromises = routeStopsData.data.map(async (routeStop: RouteStop) => {
        try {
          const stopResponse = await fetch(
            `https://data.etabus.gov.hk/v1/transport/kmb/stop/${routeStop.stop}`
          );
          const stopData = await stopResponse.json();
          return { ...stopData.data, seq: parseInt(routeStop.seq) };
        } catch (error) {
          console.error(`Error fetching stop ${routeStop.stop}:`, error);
          return null;
        }
      });

      const stops = await Promise.all(stopPromises);
      const validStops = stops.filter(stop => stop !== null) as BusStop[];
      validStops.sort((a, b) => (a.seq || 0) - (b.seq || 0));
      setRouteStops(validStops);
      if (onRouteStopsChange) { 
        onRouteStopsChange(validStops);
      }

      if (validStops.length > 1) {
        fetchRouteDirections(validStops);
      }

      if (!initialRegionSet && validStops.length > 0) {
        setTimeout(() => {
          if (!selectedStop && mapViewRef.current) {
            const firstStop = validStops[0];
            const stopLocation: StopLocation = {
              stopId: firstStop.stop,
              latitude: parseFloat(firstStop.lat),
              longitude: parseFloat(firstStop.long),
              stopName: firstStop.name_en,
              seq: firstStop.seq || 1
            };
            focusOnStop(stopLocation);
          }
        }, 500);
      }
    } finally {
      setIsLoading(false);
      console.log(`Exiting fetchRouteStops at ${new Date().toISOString()}`);
    }
  };

  // Fetch directions between sequential stops
  const fetchRouteDirections = async (stops: BusStop[]) => {
    const startTime = Date.now();
    try {
      setIsLoadingPath(true);
      const paths: RoutePathSection[] = [];
      let allResults: any[] = [];

      const batchSize = 25;
      const promises = stops.slice(0, stops.length - 1).map((stop, i) => ({
        index: i,
        origin: {
          lat: parseFloat(stop.lat),
          lng: parseFloat(stop.long)
        },
        destination: {
          lat: parseFloat(stops[i + 1].lat),
          lng: parseFloat(stops[i + 1].long)
        }
      }));
      console.log(`@@@@@@@@@@@@@@@@@@@@@@@@Total segments to fetch: ${promises.length}`);

      // 正确实现批次间间隔的批处理（新增关键修改）
      let batchIndex = 0;
      const apiRateLimit = 10; // 每秒最大请求数
      const batchInterval = 1000 / Math.ceil(apiRateLimit / batchSize); // 根据速率限制计算间隔
      var countLoop = 0;

      while (batchIndex < promises.length) {
        countLoop++;
        console.log(`fetchDirectionsPathWithBackup Loop count ${countLoop}`);
        const currentBatch = promises.slice(batchIndex, batchIndex + batchSize);
        const batchResults = await Promise.all(
          currentBatch.map(async (item) => {
            try {
              const path = await fetchDirectionsPathWithBackup(item.origin, item.destination);
              return { path, ...item };
            } catch (err) {
              console.error(`Failed fetching path for segment ${item.index}:`, err);
              return { ...item, path: null };
            }
          })
        );
        allResults.push(...batchResults);
        
        // 动态调整间隔时间
        if (batchIndex + batchSize < promises.length) {
          await new Promise(resolve => setTimeout(resolve, batchInterval));
        }

        batchIndex += batchSize;
      }

      allResults.forEach(result => {
        if (result.path && result.path.length > 0) {
          paths.push({
            coordinates: result.path,
            color: '#007AFF'
          });
        } else {
          paths.push({
            coordinates: [
              { latitude: result.origin.lat, longitude: result.origin.lng },
              { latitude: result.destination.lat, longitude: result.destination.lng }
            ],
            color: '#AAAAAA'
          });
        }
      });

      setRoutePaths(paths);

      if (!initialRegionSet && mapViewRef.current && stops.length > 1 && mapReady) {
        setTimeout(() => {
          try {
            mapViewRef.current?.fitToCoordinates(
              stops.map(stop => ({
                latitude: parseFloat(stop.lat),
                longitude: parseFloat(stop.long)
              })),
              {
                edgePadding: { top: 70, right: 50, bottom: 70, left: 50 },
                animated: true
              }
            );
            setInitialRegionSet(true);

            if (Platform.OS === 'ios') {
              setPathsRendered(false);
            } else {
              setPathsRendered(true);
            }
            console.log(`Fit to coordinates completed at ${Date.now() - startTime}ms`);
          } catch (e) {
            console.error('Error fitting to coordinates:', e);
          }
        }, 800);
      }
    } catch (error) {
      console.error('Error fetching route directions:', error);
      Alert.alert('Error', 'Could not load route paths. Using straight lines instead.');

      if (stops.length > 1) {
        const fallbackPath: RoutePathSection = {
          coordinates: stops.map(stop => ({
            latitude: parseFloat(stop.lat),
            longitude: parseFloat(stop.long)
          })),
          color: '#AAAAAA'
        };
        setRoutePaths([fallbackPath]);
      }
    } finally {
      setIsLoadingPath(false);
      console.log(`Exiting fetchRouteDirections total time: ${Date.now() - startTime}ms`);
    }
  };

  // This effect handles rendering paths properly on iOS
  useEffect(() => {
    if (mapReady && routePaths.length > 0 && !pathsRendered && pathRenderAttempts.current < 3) {
      const timer = setTimeout(() => {
        if (Platform.OS === 'ios' && mapViewRef.current) {
          console.log('Triggering iOS polyline refresh');
          mapViewRef.current.animateToRegion({
            ...region,
            latitudeDelta: region.latitudeDelta * 0.99,
            longitudeDelta: region.longitudeDelta * 0.99,
          }, 100);

          setTimeout(() => {
            if (mapViewRef.current && routeStops.length > 1) {
              try {
                mapViewRef.current.fitToCoordinates(
                  routeStops.map(stop => ({
                    latitude: parseFloat(stop.lat),
                    longitude: parseFloat(stop.long)
                  })),
                  {
                    edgePadding: { top: 70, right: 50, bottom: 70, left: 50 },
                    animated: true
                  }
                );
                setPathsRendered(true);
              } catch (e) {
                console.error('Error fitting to coordinates:', e);
              }
            }
          }, 300);
        }
        pathRenderAttempts.current += 1;
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [mapReady, routePaths, pathsRendered]);

  // Calculate the region to display on the map
  const calculateRegion = () => {
    if (!routeStops.length) {
      return {
        latitude: 22.302711,
        longitude: 114.177216,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    if (routeStops.length === 1) {
      return {
        latitude: parseFloat(routeStops[0].lat),
        longitude: parseFloat(routeStops[0].long),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    routeStops.forEach(stop => {
      const lat = parseFloat(stop.lat);
      const lng = parseFloat(stop.long);

      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  // Get route path coordinates for the Polyline
  const getRouteCoordinates = () => {
    console.log(`Entering getRouteCoordinates at ${new Date().toISOString()}`);
    const coordinates = routeStops.map(stop => ({
      latitude: parseFloat(stop.lat),
      longitude: parseFloat(stop.long),
    }));
    console.log(`Exiting getRouteCoordinates at ${new Date().toISOString()}`);
    return coordinates;
  };

  const region = location && routeStops.length === 0
    ? {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
    : calculateRegion();

  // Render fallback UI if there's an error with the map
  if (mapError || mapProviderError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.secondary }]}>Map could not be loaded</Text>
        <Text style={[styles.errorSubtext, { color: colors.subText }]}>{mapError || "Map provider not available on this device"}</Text>
        <View style={[styles.stopsList, {
          backgroundColor: colors.card,
          shadowColor: isDark ? 'transparent' : '#000',
        }]}>
          <Text style={[styles.stopsHeader, { color: colors.primary }]}>Route Stops:</Text>
          {routeStops.map((stop, index) => (
            <View key={stop.stop} style={[styles.stopItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.stopNumber, { color: colors.secondary }]}>{stop.seq || index + 1}.</Text>
              <View style={styles.stopDetails}>
                <Text style={[styles.stopName, { color: colors.text }]}>{stop.name_en}</Text>
                <Text style={[styles.stopNameTC, { color: colors.subText }]}>{stop.name_tc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Conditionally handle map provider based on platform and ability to load Google Maps
  const getMapProvider = () => {
    console.log(`Entering getMapProvider at ${new Date().toISOString()}`);
    try {
      return Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
    } catch (error) {
      console.error('Error determining map provider:', error);
      setMapProviderError(true);
      console.log(`Exiting getMapProvider at ${new Date().toISOString()}`);
      return undefined;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {(isLoading || isLoadingPath) && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.loadingBackground }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subText }]}>
            {isLoading ? t('mapComponent.loadingMap') : t('mapComponent.loadingRouteLine')}
          </Text>
        </View>
      )}

      <MapView
        ref={mapViewRef}
        style={[styles.map, isLoading && { display: 'none' }]}
        initialRegion={region}
        provider={getMapProvider()} // Don't directly use PROVIDER_GOOGLE constant which may be undefined
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsTraffic={false}
       
        onMapReady={() => {
          console.log('Map is ready');
          setIsLoading(false);
          setMapReady(true);
        }}

      >
        {/* Render bus stop markers with unique keys */}
        {routeStops.map((stop, index) => {
          const isActive = activeMarkerId === stop.stop;
          return (
            <Marker
              key={`stop-${stop.stop}-${index}`}
              coordinate={{
                latitude: parseFloat(stop.lat),
                longitude: parseFloat(stop.long)
              }}
              onPress={() => {
                setActiveMarkerId(stop.stop);
                focusOnStop({
                  stopId: stop.stop,
                  latitude: parseFloat(stop.lat),
                  longitude: parseFloat(stop.long),
                  stopName: stop.name_en,
                  seq: stop.seq || 1
                });
              }}
            >
             
            </Marker>
          );
        })}

        {/* Draw route lines using path segments with unique keys */}
        {routePaths.map((pathSection, index) => {
          const coordinateHash = pathSection.coordinates.length > 0
            ? `${pathSection.coordinates[0].latitude}-${pathSection.coordinates[0].longitude}`
            : '';

          return (
            <Polyline
              key={`path-${index}-${coordinateHash}`}
              coordinates={pathSection.coordinates}
              strokeWidth={Platform.OS === 'ios' ? 5 : 4}
              strokeColor={isDark ? '#3694FF' : (pathSection.color || colors.primary)}
              lineDashPattern={undefined}
              lineJoin="round"
              lineCap="round"
              geodesic={true}
              zIndex={999}
            />
          );
        })}
      </MapView>
      {!isLoading && !isLoadingPath && routePaths.length > 0 && (
        <View style={[styles.routeInfoBanner, {
          backgroundColor: colors.banner.info.background
        }]}>
          <Text style={[styles.routeInfoText, {
            color: colors.banner.info.text
          }]}>
            {routeId} - {routeStops.length} stops
          </Text>
        </View>
      )}
  
    </View>
  );
});

export default MapComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 2,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  stopsList: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  stopsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#007AFF',
  },
  stopItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stopNumber: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  stopDetails: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '500',
  },
  stopNameTC: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerCircle: {
    backgroundColor: '#FF3B30',
    borderRadius: 15,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calloutContainer: {
    width: 150,
    padding: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  calloutSubtitle: {
    fontSize: 12,
  },
  calloutSequence: {
    marginTop: 5,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  markerCircleActive: {
    backgroundColor: '#007AFF',
    borderColor: '#fff',
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
  },
  routeInfoBanner: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});