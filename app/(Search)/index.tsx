import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SearchRouteForm from '@/components/SearchRouteForm'

const SearchPage = () => {



    return (
        <View style={styles.container}>
            <View style={styles.routeListView}> 
                <Text>Routes List</Text>
            </View>
            <View style={styles.searchRouteFormView}>
                <SearchRouteForm />
            </View>
            
        </View>
    )
}

export default SearchPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeListView: {
        height: "60%",
        width: "100%",
        backgroundColor: "#333",
    },
    searchRouteFormView: {
        height: "40%",
        width: "100%",
        backgroundColor: "#555",
    }

})