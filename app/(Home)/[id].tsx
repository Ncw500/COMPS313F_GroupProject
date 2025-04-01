import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import RouteETAList from '../../components/RouteETAList';
import MapComponent from '@/components/MapComponent';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/utils/i18n';

interface StopLocation {
    stopId: string;
    latitude: number;
    longitude: number;
    stopName: string;
    seq: number;
}

const RouteDetailPage = () => {
    const params = useLocalSearchParams();
    const { 
      id, 
      stopId, 
      stopLat, 
      stopLng, 
      stopName, 
      stopSeq 
    } = params;
    
    const mapRef = useRef(null);
    const [selectedStop, setSelectedStop] = useState<StopLocation | null>(null);
    const { t } = useTranslation();

    // Parse the route ID format (e.g., "1_O_1" to separate components)
    const splitId = (id: string) => {
        const [routeId, routeBound, routeServiceType] = id.split('_');
        return { routeId, routeBound, routeServiceType };
    };
    
    const { routeId, routeBound, routeServiceType } = id ? splitId(id as string) : { routeId: undefined, routeBound: undefined, routeServiceType: undefined };

    // Handle when a stop is selected from the ETA list
    const handleStopSelect = (stopLocation: StopLocation) => {
        setSelectedStop(stopLocation);
    };

    // If we have stop information in params, set it as selected stop when component mounts
    useEffect(() => {
        if (stopId && stopLat && stopLng && stopName) {
            const stopLocation: StopLocation = {
                stopId: stopId as string,
                latitude: parseFloat(stopLat as string),
                longitude: parseFloat(stopLng as string),
                stopName: stopName as string,
                seq: parseInt(stopSeq as string) || 1
            };
            
            // Set a small delay to ensure the map is fully loaded
            const timer = setTimeout(() => {
                setSelectedStop(stopLocation);
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [stopId, stopLat, stopLng, stopName, stopSeq]);

    return (
        <View style={styles.container}>
            <View style={styles.mapViewContainer}>
                <MapComponent 
                    ref={mapRef}
                    routeId={routeId} 
                    routeBound={routeBound} 
                    serviceType={routeServiceType}
                    selectedStop={selectedStop}
                />
            </View>
            <View style={styles.routeETAListContainer}>
                <RouteETAList 
                    id={id as string} 
                    onStopSelect={handleStopSelect}
                    initialStopId={stopId as string}
                />
            </View>
        </View>
    )
}

export default RouteDetailPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mapViewContainer: {
        height: "50%",
    },
    routeETAListContainer: {
        height: "50%",
    }
})