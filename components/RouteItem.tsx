import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Route } from '@/types/Interfaces'
import { Link } from 'expo-router'
import { useTheme } from '@/context/ThemeContext'
import { Colors } from '@/styles/theme'
import { useTranslation } from '@/utils/i18n'

type RouteItemProps = {
  route: Route
}

const RouteItem = ({ route }: RouteItemProps) => {
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();
  
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
            <Text style={[styles.toText, { color: colors.subText }]}>{t('routeItem.to')}</Text>
            <Text style={[styles.destText, { color: colors.text }]}>{t('routeItem.routeDestination', {routeItem: route})}</Text>
          </View>

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
  
    alignItems: "center",
    paddingHorizontal: 30,
    marginHorizontal: 15,
    margin: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    
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
    marginRight: 5,
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