import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Route } from '@/types/Interfaces'
import { Link } from 'expo-router'
import { useTheme } from '@/context/ThemeContext'
import { Colors } from '@/styles/theme'

type RouteItemProps = {
  route: Route
}

const RouteItem = ({ route }: RouteItemProps) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  
  return (
    <Link href={`/${(route.route.toString() + "_" + route.bound.toString() + "_" + route.service_type.toString())}`} asChild>
      <TouchableOpacity activeOpacity={0.7}>
        <View style={[
          styles.container, 
          { 
            borderColor: colors.border,
            backgroundColor: colors.card
          }
        ]}>
          <Text style={[styles.routeText, { color: colors.primary }]}>{route.route}</Text>
          <View style={styles.destView}>
            <Text style={[styles.toText, { color: colors.subText }]}>To </Text>
            <Text style={[styles.destText, { color: colors.text }]}>{route.dest_en}</Text>
          </View>
          <Text style={[styles.boundText, { color: colors.subText }]}>{route.bound}</Text>
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
  },
  routeText: {
    fontSize: 18,
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
    fontStyle: "italic",
    fontWeight: "bold",
    width: 25,
  },
  destText: {
    fontSize: 18,
    fontWeight: "bold",
    width: "100%",
  }, 
  boundText: {
    fontSize: 18,
    fontWeight: "bold",
    width: "20%",
    textAlign: "right",
    textAlignVertical: "center",
    marginLeft: 20,
  }
})