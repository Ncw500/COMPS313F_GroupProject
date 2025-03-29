import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import SearchRouteForm from '@/components/SearchRouteForm'
import RouteList from '@/components/RouteList'
import { Route, useRouter } from 'expo-router'

const SearchPage = () => {

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Route[]>([]);
    const router = useRouter();

    // const handleSearch = async (query: string) => {
    //     try {
    //         // 如果查询为空直接返回
    //         if (!query.trim()) {
    //             setSearchResults([]);
    //             return;
    //         }
    //         const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
    //         const result = await response.json();
    //         const normalizedQuery = query.toUpperCase();
    //         const filteredRoutes = result.data.filter((route: Route) =>
    //             route.route.toUpperCase().includes(normalizedQuery)
    //         );
    //         setSearchResults(filteredRoutes);
    //     } catch (error) {
    //         console.error('搜索失败:', error);
    //         setSearchResults([]);
    //     }
    // };
    // useEffect(() => {
    //     const delayDebounceFn = setTimeout(() => {
    //         handleSearch(searchQuery);
    //     }, 300);
    //     return () => clearTimeout(delayDebounceFn);
    // }, [searchQuery]);
    // // 新增：组件加载时清空历史结果
    // useEffect(() => {
    //     setSearchResults([]);
    // }, []);
    // return (
    //     <SafeAreaView style={styles.safeArea}>
    //         <KeyboardAvoidingView
    //             behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    //             style={styles.container}
    //         >
    //             <TextInput
    //                 style={styles.input}
    //                 placeholder="Search for a route"
    //                 value={searchQuery}
    //                 onChangeText={setSearchQuery}
    //             />
    //             <FlatList
    //                 data={searchResults}
    //                 keyExtractor={(item) => item.route}
    //                 renderItem={({ item }) => (
    //                     <TouchableOpacity onPress={() => router.push(`/${item.route}`)}>
    //                         <Text>{item.route}</Text>
    //                     </TouchableOpacity>
    //                 )}
    //             />
    //         </KeyboardAvoidingView>
    //     </SafeAreaView>
    // );
              
    

    return (
        <View style={styles.container}>
            <View style={styles.routeListView}> 
                <RouteList />
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
        backgroundColor: "red",
    },
    searchRouteFormView: {
        height: "40%",
        width: "100%",
        backgroundColor: "yellow",
    }

})