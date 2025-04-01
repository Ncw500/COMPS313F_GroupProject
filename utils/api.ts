import { LatLng, Route, RouteStop, StopInfo, PathCacheItem } from '@/types/Interfaces';
import { decode } from '@mapbox/polyline';
import { GOOGLE_API_KEY } from '@env';

/**
 * 解码Polyline编码的路径
 */
const decodePolyline = (polyline: string): { latitude: number; longitude: number }[] => {
  return decode(polyline).map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
};

/**
 * Base URL for the KMB API
 */
const API_BASE_URL = 'https://data.etabus.gov.hk/v1/transport/kmb';

/**
 * Cache mechanism to reduce API calls
 */
const cache: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch with caching and retry
 */
const fetchWithCache = async (url: string, cacheKey: string, maxRetries = 2): Promise<any> => {
  const startTime = Date.now();
  console.log("Starting API call:", url);
  
  // Check cache first
  const now = Date.now();
  if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_DURATION) {
    console.log(`Using cached data for ${cacheKey}`);
    return cache[cacheKey].data;
  }
  
  // If not in cache or expired, fetch with retry logic
  let retries = 0;
  while (retries <= maxRetries) {
    try {
      console.log(`Fetching ${url} (attempt ${retries + 1})`);
      const response = await fetch(url);
      
      if (response.status === 403) {
        throw new Error('API rate limit reached. Wait a few minutes and try again.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Cache the successful response
      cache[cacheKey] = {
        data: result.data,
        timestamp: now
      };
      
      console.log(`API call completed: ${url} took ${Date.now() - startTime}ms`);
      return result.data;
    } catch (error) {
      retries++;
      
      if (retries <= maxRetries && error instanceof Error && error.message.includes('403')) {
        console.log(`Rate limited, waiting before retry ${retries}...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, retries * 2000));
      } else if (retries > maxRetries) {
        console.error(`Failed to fetch ${url} after ${maxRetries} retries`);
        throw error;
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
};

/**
 * Fetch all bus routes
 */
export const fetchAllRoutes = async (): Promise<Route[]> => {
  const startTime = Date.now();
  console.log("Starting fetchAllRoutes");
  
  try {
    const result = await fetchWithCache(`${API_BASE_URL}/route/`, 'all_routes');
    console.log(`fetchAllRoutes completed in ${Date.now() - startTime}ms with ${result.length} routes`);
    return result;
  } catch (error) {
    console.error(`fetchAllRoutes failed after ${Date.now() - startTime}ms`, error);
    throw error;
  }
};

/**
 * Fetch all bus stops
 */
export const fetchAllStops = async (): Promise<StopInfo[]> => {
  const startTime = Date.now();
  console.log("Starting fetchAllStops");
  
  try {
    console.log('Fetching all stops...');
    const EXTENDED_CACHE_DURATION = 15 * 60 * 1000; // 15分钟
    const now = Date.now();
    const cacheKey = 'all_stops';
    
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < EXTENDED_CACHE_DURATION) {
      console.log(`Using cached stop data from memory cache`);
      return cache[cacheKey].data;
    }
    
    const result = await fetchWithCache(`${API_BASE_URL}/stop`, 'all_stops', 3); // 增加重试次数
    console.log(`fetchAllStops completed in ${Date.now() - startTime}ms with ${result.length} stops`);
    return result;
  } catch (error) {
    console.error(`fetchAllStops failed after ${Date.now() - startTime}ms`, error);
    throw error;
  }
};

/**
 * Fetch information for a specific bus stop
 */
export const fetchStopInfo = async (stopId: string): Promise<StopInfo> => {
  try {
    const response = await fetch(`${API_BASE_URL}/stop/${stopId}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error fetching stop info for ${stopId}:`, error);
    throw error;
  }
};

/**
 * Fetch all route-stop mappings
 */
export const fetchAllRouteStops = async (): Promise<RouteStop[]> => {
  const startTime = Date.now();
  console.log("Starting fetchAllRouteStops");
  
  try {
    console.log('Fetching all route-stop mappings...');
    let routeStops: RouteStop[] = [];
    // Check memory cache first - extend cache duration for this heavy call
    const EXTENDED_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
    const now = Date.now();
    const cacheKey = 'all_route_stops';
    
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < EXTENDED_CACHE_DURATION) {
      console.log(`Using cached route-stop data from memory cache`);
      return cache[cacheKey].data;
    }
    
    // Try to fetch with retry logic
    let retry = 0;
    const maxRetries = 3;
    
    while (retry < maxRetries) {
      try {
        if (retry > 0) {
          console.log(`Retry attempt ${retry} for route-stop data...`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 1000));
        }
        
        const response = await fetch(`${API_BASE_URL}/route-stop`);
        
        if (response.status === 403) {
          console.warn('API rate limit hit for route-stop data');
          throw new Error('API rate limit reached. Wait a few minutes and try again.');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Cache the successful response with extended duration
        cache[cacheKey] = {
          data: result.data,
          timestamp: now
        };
        
        console.log(`Fetched ${result.data.length} route-stop mappings successfully`);
        return result.data;
      } catch (error) {
        retry++;
        
        if (retry >= maxRetries) {
          console.error(`Failed to fetch route-stop data after ${maxRetries} attempts`);
          throw error;
        }
      }
    }
    
    throw new Error('Failed to fetch route-stop data');
  } catch (error) {
    console.error(`fetchAllRouteStops failed after ${Date.now() - startTime}ms`, error);
    throw error;
  }
};

/**
 * Fetch stops for a specific route
 */
export const fetchRouteStops = async (
  routeId: string,
  direction: 'outbound' | 'inbound',
  serviceType: string
): Promise<RouteStop[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/route-stop/${routeId}/${direction}/${serviceType}`
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error fetching stops for route ${routeId}:`, error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    console.warn('Invalid coordinates for distance calculation');
    return Infinity;
  }

  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // Distance in meters
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

interface DirectionsResult {
  routes: Array<{
    overview_polyline: {
      points: string;
    };
    legs: Array<{
      steps: Array<{
        polyline: {
          points: string;
        };
      }>;
    }>;
  }>;
}

/**
 * Fetch directions path between two coordinates using OSRM and Google Maps APIs with logging
 */
export const fetchDirectionsPath = async (
  origin: LatLng, 
  destination: LatLng
): Promise<{ latitude: number; longitude: number }[] | null> => {
  const startTime = Date.now();
  console.log(`--- fetchDirectionsPath START (Total: ${Date.now() - startTime}ms) ---`);
  
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline`;


    // OSRM 请求开始
    console.log(`OSRM request started`);
    let osrmResponse = await Promise.race([
      fetch(osrmUrl),
      new Promise((_, reject) => setTimeout(() => reject(new Error('OSRM timeout')), 5000))
    ]) as Response;
    console.log(`OSRM request completed at ${Date.now() - startTime}ms`);

    if (osrmResponse.ok) {
      const data = await osrmResponse.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const decodeTime = Date.now();
        const path = decodePolyline(data.routes[0].geometry);
        console.log(`OSRM path decoded in ${Date.now() - decodeTime}ms`);
        console.log(`fetchDirectionsPath SUCCESS (OSRM) at ${Date.now() - startTime}ms`);
        return path;
      }
    } else {
      console.error('OSRM returned non-OK response:', osrmResponse.status, osrmResponse.statusText);
    }

    console.log(`fetchDirectionsPath FAILED at ${Date.now() - startTime}ms`);
    return null;
  } catch (error) {
    console.error('Error fetching directions:', error, `Total time: ${Date.now() - startTime}ms`);
    return null;
  } finally {
    console.log(`--- fetchDirectionsPath END (Total: ${Date.now() - startTime}ms) ---`);
  }
};

// Fallback to using Google Maps Directions API if needed
// This requires an API key with billing enabled
export const fetchGoogleDirectionsPath = async (
  origin: LatLng, 
  destination: LatLng, 
  apiKey: string
) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${apiKey}&mode=driving`;
    
    // console.log(`🛑Google Directions API request started, url: ${url}`);
    const response = await fetch(url);
    const result: DirectionsResult = await response.json();
    
    if (!result.routes || result.routes.length === 0) {
      console.log(' Google Paths Faild');
      return null;
    }
    
    // Use the detailed steps polylines for better route accuracy
    const route = result.routes[0];
    
    if (route.legs && route.legs.length > 0) {
      let paths: { latitude: number; longitude: number }[] = [];
      
      for (const leg of route.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            if (step.polyline && step.polyline.points) {
              const decodedPath = decodePolyline(step.polyline.points);
              paths = [...paths, ...decodedPath];
            }
          }
        }
      }
      // console.log('🛑 Google Paths', paths);
      return paths;
    }
    
    // Fallback to overview polyline if no detailed steps
    if (route.overview_polyline && route.overview_polyline.points) {
      return decodePolyline(route.overview_polyline.points);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Google directions:', error);
    return null;
  }
};

// 新增路径缓存机制
const pathCache = new Map<string, PathCacheItem>();
const cacheTTL = 60 * 60 * 1000; // 1小时

export const fetchDirectionsPathWithBackup = async (
  origin: LatLng, 
  destination: LatLng
): Promise<{ latitude: number; longitude: number }[] | null> => {
  const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
  
  // 检查缓存是否存在且未过期
  const cachedPath = pathCache.get(cacheKey);
  if (cachedPath && Date.now() - cachedPath.timestamp < cacheTTL) {
    return cachedPath.path;
  }

  try {
    // // 尝试OSRM
    // const osrmResult = await fetchDirectionsPath(origin, destination);
    // if (osrmResult) {
    //   pathCache.set(cacheKey, { path: osrmResult, timestamp: Date.now() });
    //   return osrmResult;
    // }
    
    // OSRM失败则尝试Google Maps
    // console.log("✅", GOOGLE_API_KEY);
    const googleResult = await fetchGoogleDirectionsPath(
      origin, 
      destination, 
      GOOGLE_API_KEY!
    );
    if (googleResult) {
      pathCache.set(cacheKey, { path: googleResult, timestamp: Date.now() });
      return googleResult;
    }
  } catch (error) {
    console.error('Both APIs failed:', error);
  }

  return null;
};

