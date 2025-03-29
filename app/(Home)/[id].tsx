import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import RouteETAList from '@/components/RouteETAList';
import MapComponent from '@/components/MapComponent';


const RouteDetailPage = () => {

    const { id } = useLocalSearchParams();

    return (
        <View style={styles.container}>
            <View style={styles.mapViewContainer}>
                <MapComponent />
            </View>
            <View style={styles.routeETAListContainer}>
                <RouteETAList id={id as string} />
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