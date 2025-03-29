import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Route } from '@/types/Interfaces'
import { Link } from 'expo-router'

type RouteItemProps = {
  route: Route
}

const RouteItem = ({ route }: RouteItemProps) => {
  return (
    <Link href={`/${(route.route.toString() + "_" + route.bound.toString() + "_" + route.service_type.toString())}`} asChild>
      <TouchableOpacity activeOpacity={0.7}>
        <View style={styles.container}>
          <Text style={styles.routeText}>{route.route}</Text>
          <View style={styles.destView}>
            <Text style={styles.toText}>To </Text>
            <Text style={styles.destText}>{route.dest_en}</Text>
          </View>
          <Text style={styles.boundText}>{route.bound}</Text>
        </View>
      </TouchableOpacity>
    </Link >
  )
}


export default RouteItem

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "#bdbbb5",
  },
  routeText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: "bold",
    width: "15%",
    marginRight: 10,
    textAlignVertical: "center"
  },
  destView: {
    flexDirection: "row", 
    alignItems: "center",
    flex: 1,
  },
  toText: {
    fontSize: 14,
    color: '#666',
    fontStyle: "italic",
    fontWeight: "bold",
    width: 25,
  },
  destText: {
    fontSize: 18,
    color: '#666',
    fontWeight: "bold",
    width: "100%",
  }, 
  boundText: {
    fontSize: 18,
    color: '#666',
    fontWeight: "bold",
    width: "20%",
    textAlign: "right",
    textAlignVertical: "center",
    marginLeft: 20,
  }
})