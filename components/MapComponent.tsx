import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Callout, Polyline, Region, MapStyleElement } from 'react-native-maps';
import * as Location from 'expo-location';
import { Entypo } from '@expo/vector-icons';
import { RouteStop, StopInfo } from '@/types/Interfaces';
import { fetchDirectionsPath } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';

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

const MapComponent = forwardRef(({ routeId, routeBound, serviceType, selectedStop }: MapComponentProps, ref) => {
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

  // Handle when a stop is selected from the ETA list
  useEffect(() => {
    if (selectedStop && mapViewRef.current) {
      focusOnStop(selectedStop);
    }
  }, [selectedStop]);

  // Focus map on a specific stop
  const focusOnStop = (stop: StopLocation) => {
    if (!mapViewRef.current) return;
    
    // Animate to the selected stop with some zoom
    const region: Region = {
      latitude: stop.latitude,
      longitude: stop.longitude,
      latitudeDelta: 0.005, // More zoomed in when focusing on a single stop
      longitudeDelta: 0.005,
    };
    
    mapViewRef.current.animateToRegion(region, 1000);
    
    // Highlight the marker
    setActiveMarkerId(stop.stopId);
    
    // After a delay, reset the active marker to remove highlight effect
    setTimeout(() => {
      setActiveMarkerId(null);
    }, 3000);

    // Mark that we've set an initial region
    setInitialRegionSet(true);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focusOnStop
  }));

  useEffect(() => {
    // Get user location
    (async () => {
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
    })();

    // If we have route information, fetch stops for that route
    if (routeId && routeBound && serviceType) {
      fetchRouteStops(routeId, routeBound, serviceType);
    } else {
      // Fallback to loading some nearby stops
      fetchNearbyStops();
    }
  }, [routeId, routeBound, serviceType]);

  const fetchNearbyStops = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop');
      const data = await response.json();
      
      // Limit to a reasonable number for performance
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
    try {
      setIsLoading(true);
      
      // Convert bound format (O/I to outbound/inbound)
      const boundDirection = routeBound === 'O' ? 'outbound' : 'inbound';
      
      // Fetch route stops
      const routeStopsResponse = await fetch(
        `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeId}/${boundDirection}/${serviceType}`
      );
      const routeStopsData = await routeStopsResponse.json();
      
      if (!routeStopsData.data || !Array.isArray(routeStopsData.data)) {
        console.error('Invalid route stops data:', routeStopsData);
        return;
      }

      // Extract stop IDs and fetch details for each stop
      const stopPromises = routeStopsData.data.map(async (routeStop: RouteStop) => {
        try {
          const stopResponse = await fetch(
            `https://data.etabus.gov.hk/v1/transport/kmb/stop/${routeStop.stop}`
          );
          const stopData = await stopResponse.json();
          
          // Combine the sequence information with stop details
          return {
            ...stopData.data,
            seq: parseInt(routeStop.seq) // Add sequence number
          };
        } catch (error) {
          console.error(`Error fetching stop ${routeStop.stop}:`, error);
          return null;
        }
      });

      const stops = await Promise.all(stopPromises);
      const validStops = stops.filter(stop => stop !== null) as BusStop[];
      
      // Sort stops by sequence number
      validStops.sort((a, b) => (a.seq || 0) - (b.seq || 0));
      setRouteStops(validStops);
      
      // After we have stops, fetch directions between them
      if (validStops.length > 1) {
        fetchRouteDirections(validStops);
      }

      // Automatically focus on the first stop or the entire route when first loaded
      if (!initialRegionSet && validStops.length > 0) {
        setTimeout(() => {
          // If there's no selectedStop yet, focus on the first stop
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

            // Or, if you prefer to focus on the entire route path, you can use:
            // mapViewRef.current.fitToCoordinates(
            //   validStops.map(stop => ({latitude: parseFloat(stop.lat), longitude: parseFloat(stop.long)})),
            //   {edgePadding: {top: 50, right: 50, bottom: 50, left: 50}, animated: true}
            // );
          }
        }, 500); // Give a small delay to ensure map is ready
      }
    } catch (error) {
      console.error('Error fetching route stops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch directions between sequential stops
  const fetchRouteDirections = async (stops: BusStop[]) => {
    try {
      setIsLoadingPath(true);
      const paths: RoutePathSection[] = [];
      
      // Process stops in pairs to get directions between consecutive stops
      for (let i = 0; i < stops.length - 1; i++) {
        const origin = {
          lat: parseFloat(stops[i].lat),
          lng: parseFloat(stops[i].long)
        };
        
        const destination = {
          lat: parseFloat(stops[i + 1].lat),
          lng: parseFloat(stops[i + 1].long)
        };
        
        try {
          const pathSegment = await fetchDirectionsPath(origin, destination);
          
          if (pathSegment && pathSegment.length > 0) {
            paths.push({
              coordinates: pathSegment,
              color: '#007AFF' // Use a consistent color for all segments
            });
          } else {
            // If we couldn't get directions, fall back to a straight line
            paths.push({
              coordinates: [
                { latitude: origin.lat, longitude: origin.lng },
                { latitude: destination.lat, longitude: destination.lng }
              ],
              color: '#AAAAAA' // Use a different color for straight lines
            });
          }
        } catch (error) {
          console.error(`Error fetching directions for segment ${i}:`, error);
          // Fall back to a straight line on error
          paths.push({
            coordinates: [
              { latitude: origin.lat, longitude: origin.lng },
              { latitude: destination.lat, longitude: destination.lng }
            ],
            color: '#AAAAAA'
          });
        }
        
        // Add a small delay to avoid rate limiting issues with the directions API
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setRoutePaths(paths);

      // After paths are loaded, make the map fit to the entire route if not already focused
      if (!initialRegionSet && mapViewRef.current && stops.length > 1 && mapReady) {
        setTimeout(() => {
          try {
            // For Android or if we're already using Google Maps provider
            mapViewRef.current?.fitToCoordinates(
              stops.map(stop => ({
                latitude: parseFloat(stop.lat), 
                longitude: parseFloat(stop.long)
              })),
              {
                edgePadding: {top: 70, right: 50, bottom: 70, left: 50}, 
                animated: true
              }
            );
            setInitialRegionSet(true);
            
            // For iOS, we'll handle this in the separate effect
            if (Platform.OS === 'ios') {
              setPathsRendered(false);
            } else {
              setPathsRendered(true);
            }
          } catch (e) {
            console.error('Error fitting to coordinates:', e);
          }
        }, 800); // Give time for paths to render
      }
    } catch (error) {
      console.error('Error fetching route directions:', error);
      Alert.alert('Error', 'Could not load route paths. Using straight lines instead.');
      
      // Fall back to straight line connections
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
    }
  };

  // This effect handles rendering paths properly on iOS
  useEffect(() => {
    // If map is ready and we have route paths but they haven't been rendered
    if (mapReady && routePaths.length > 0 && !pathsRendered && pathRenderAttempts.current < 3) {
      // On iOS, we need to trigger a small update to the map to make polylines appear
      const timer = setTimeout(() => {
        if (Platform.OS === 'ios' && mapViewRef.current) {
          console.log('Triggering iOS polyline refresh');
          
          // Force a small region update to refresh the map
          mapViewRef.current.animateToRegion({
            ...region,
            latitudeDelta: region.latitudeDelta * 0.99, // Very small change to trigger refresh
            longitudeDelta: region.longitudeDelta * 0.99,
          }, 100);
          
          // Try to fit to coordinates again
          setTimeout(() => {
            if (mapViewRef.current && routeStops.length > 1) {
              try {
                mapViewRef.current.fitToCoordinates(
                  routeStops.map(stop => ({
                    latitude: parseFloat(stop.lat), 
                    longitude: parseFloat(stop.long)
                  })),
                  {
                    edgePadding: {top: 70, right: 50, bottom: 70, left: 50}, 
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
  }, [mapReady, routePaths, pathsRendered, region]);

  // Calculate the region to display on the map
  const calculateRegion = () => {
    // Default to Hong Kong
    if (!routeStops.length) {
      return {
        latitude: 22.302711,
        longitude: 114.177216,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    // If we have route stops, center on the first stop or calculate bounds
    if (routeStops.length === 1) {
      return {
        latitude: parseFloat(routeStops[0].lat),
        longitude: parseFloat(routeStops[0].long),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    // Calculate bounds for multiple stops
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
    
    // Add some padding
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
    return routeStops.map(stop => ({
      latitude: parseFloat(stop.lat),
      longitude: parseFloat(stop.long),
    }));
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
    try {
      // Only use Google Maps on Android, default to standard provider on iOS 
      return Platform.OS === 'android' ? 'google' : undefined;
    } catch (error) {
      console.error('Error determining map provider:', error);
      setMapProviderError(true);
      return undefined; // Fall back to default provider
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {(isLoading || isLoadingPath) && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.loadingBackground }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subText }]}>
            {isLoading ? 'Loading to map...' : 'Loading the route line...'}
          </Text>
        </View>
      )}
      
      <MapView 
        ref={mapViewRef}
        style={[styles.map, isLoading && { display: 'none' }]} 
        initialRegion={region} 
        provider={getMapProvider()} // Don't directly use PROVIDER_GOOGLE constant which may be undefined
        showsUserLocation={true}
        showsTraffic={false}
        customMapStyle={isDark ? darkMapStyle : []}
        onMapReady={() => {
          console.log('Map is ready');
          setIsLoading(false);
          setMapReady(true);
        }}
        onError={(error) => {
          console.error('Map error:', error.nativeEvent);
          setMapError('Failed to load the map. Showing stops list instead.');
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
              title={`${stop.seq || ''} ${stop.name_en}`}
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.markerCircle, 
                  { backgroundColor: isActive ? colors.mapMarkerActive : colors.mapMarker },
                  isActive && styles.markerCircleActive
                ]}>
                  <Text style={styles.markerText}>{stop.seq || index + 1}</Text>
                </View>
                <Entypo 
                  name="location-pin" 
                  size={24} 
                  color={isActive ? colors.primary : colors.secondary} 
                />
              </View>
              <Callout>
                <View style={[styles.calloutContainer, { backgroundColor: colors.card }]}>
                  <Text style={[styles.calloutTitle, { color: colors.text }]}>{stop.name_en}</Text>
                  <Text style={[styles.calloutSubtitle, { color: colors.subText }]}>{stop.name_tc}</Text>
                  {stop.seq && <Text style={[styles.calloutSequence, { color: colors.primary }]}>Stop #{stop.seq}</Text>}
                </View>
              </Callout>
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