import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  Text, 
  StyleSheet, 
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Route } from '@/types/Interfaces';
import { MaterialIcons } from '@expo/vector-icons';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Route[]>([]);
  const router = useRouter();

  const handleSearch = async (query: string) => {
    try {
      // 如果查询为空直接返回
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
  
      const response = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
      const result = await response.json();
      
      const normalizedQuery = query.toUpperCase();
      const filteredRoutes = result.data.filter((route: Route) => 
        route.route.toUpperCase().includes(normalizedQuery)
      );
      
      setSearchResults(filteredRoutes);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    }
  };
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
  
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 新增：组件加载时清空历史结果
  useEffect(() => {
    setSearchResults([]);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* 搜索栏 */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="輸入路線編號"
            placeholderTextColor="#999"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          <MaterialIcons 
            name="search" 
            size={24} 
            color="#007AFF" 
            style={styles.searchIcon}
          />
        </View>

        {/* 搜索结果列表 */}
        <FlatList
          data={searchResults}
          
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.routeItem,
                pressed && styles.routeItemPressed
              ]}
              onPress={() => router.push(`/(Home)/${item.route}_${item.bound}_${item.service_type}`)}
            >
              <Text style={styles.routeNumber}>{item.route}</Text>
              <Text style={styles.routeText}>
                {item.orig_en} → {item.dest_en}
              </Text>
            </Pressable>
          )}
          keyExtractor={item => `${item.route}_${item.bound}_${item.service_type}`}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="search" size={40} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? '找不到匹配路線' : '輸入路線編號開始搜索'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="on-drag"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingTop: 8,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    position: 'relative',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    paddingLeft: 48,
    fontSize: 16,
    color: '#333',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  routeItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  routeItemPressed: {
    backgroundColor: '#f8f8f8',
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
  },
});

export default SearchPage;