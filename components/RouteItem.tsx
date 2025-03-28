import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Route } from '@/types/Interfaces'

type RouteItemProps = {
  route: Route
}

const routeItem = ({ route }: RouteItemProps) => {
  return (
    <TouchableOpacity activeOpacity={0.7}>
      <View style={styles.container}>
        <Text style={styles.text}>{route.route}</Text>
        <Text style={styles.text}>{route.dest_tc}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default routeItem

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f2d4ac",
    margin: 10,
    padding: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 16,
    color: "#000",
  },
})