import { FlatList, StyleSheet, Text, View } from "react-native";
import RouteItem from "@/components/RouteItem";
import { Route } from "@/types/Interfaces";
import { useEffect, useState } from "react";

export default function RoutesPage() {

  const [routes, setRoutes] = useState<Route[]>([]);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [renderCount, setRenderCount] = useState(20);

  useEffect(() => {
    fetchRoute();
  }, []);


  const fetchRoute = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
      const results = await response.json();
      setRoutes(results.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

  }

  const renderItem = ({ item }: { item: Route }) => {
    return <RouteItem route={item} />
  }

  const generateKey = (item: Route, index: number) => {
    var key = (index.toString() + item.route.toString() + item.bound.toString());
    return key;
  }

  const onEndReached = () => {
    setRenderCount(prevCount => Math.min(prevCount + 20, routes.length));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={routes.slice(0, renderCount)}
        renderItem={renderItem}
        keyExtractor={generateKey}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});


