import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Route } from '@/types/Interfaces'


const RouteDetailPage = () => {

    const { id } = useLocalSearchParams();
    const [route, setRoute] = useState<Route | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const fetchRouteDetail = async () => {
            try {
                const [routeId, routeBound, routeServiceType ] = id.toString().split("_");
     
                const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route/`);

                const result = await response.json();
                const routeObject = result.data.find((route: Route) => route.route === routeId && route.bound === routeBound && route.service_type === routeServiceType);
                setRoute(routeObject);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        }

        fetchRouteDetail();
        
    }, [id]);

    // const fetchStopETA = async () => {
    //     setLoading(true);
    //     try {
    //         const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-eta/${route?.route}/${route?.service_type}`);
    //         const results = await response.json();
    //         console.log(results);
    //     } catch (error) {
    //         //   console.error(error);
    //     } finally {
    //         setLoading(false);
    //         setRefreshing(false);
    //     }
    // }

    if (loading) {
        return (
            <View>
                <Text>Loading...</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.routeText}>Route: {route?.route}</Text>
            <Text style={styles.text}>Bound: {route?.route}</Text>
            <Text style={styles.text}>Service Type: {route?.route}</Text>
            <Text style={styles.text}>Orig: {route?.orig_en}</Text>
            <Text style={styles.text}>Dest: {route?.dest_en}</Text>
        </View>
    )
}

export default RouteDetailPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,

    }, 
    routeText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        marginBottom: 8,
    }
})