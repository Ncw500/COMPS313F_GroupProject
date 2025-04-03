import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import RouteETAList from '../../components/RouteETAList';
import MapComponent from '@/components/MapComponent';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/utils/i18n';
import { Colors } from '@/styles/theme';
import { useTheme } from '@/context/ThemeContext';
import OperationBar from '@/components/OperationBar';
import { Route } from '@/types/Interfaces';
import { fetchRouteByIdAndBound } from '@/utils/api';

interface StopLocation {
    stopId: string;
    latitude: number;
    longitude: number;
    stopName: string;
    seq: number;
}

// interface BusStop {
//     stop: string;
//     name_en: string;
//     name_tc: string;
//     name_sc: string;
//     lat: string;
//     long: string;
//     seq?: number; // Optional sequence number for ordered stops
// }



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
    const [route, setRoute] = useState<Route | null>(null);
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;

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

    useEffect(() => {
        const fetchData = async () => {
            const routes = await fetchRouteByIdAndBound(routeId as string, routeBound as string, routeServiceType as string);
            setRoute(routes);
        };
        fetchData();
    
    }, [routeId, routeBound, routeServiceType]);

    // const [routeStops, setRouteStops] = useState<BusStop[]>([]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.mapViewContainer}>
                <MapComponent
                    ref={mapRef}
                    routeId={routeId}
                    routeBound={routeBound}
                    serviceType={routeServiceType}
                    selectedStop={selectedStop}
                />
            </View>
            <View style={styles.operationBarContainer} >
                <OperationBar
                    route={route}
                    routeId={routeId}
                    routeBound={routeBound}
                    serviceType={routeServiceType}
                    // routeStops={routeStops}
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
    operationBarContainer: {
        height: "11%",
    },
    routeETAListContainer: {
        height: "39%",
        marginTop: 10,
        borderColor: "#bdbbb5",
    }
})