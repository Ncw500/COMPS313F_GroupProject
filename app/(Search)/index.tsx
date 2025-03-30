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
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';
import { ThemeToggle } from '@/components/ThemeToggle';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Route[]>([]);
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  const handleSearch = async (query: string) => {
    try {
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
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
  
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    setSearchResults([]);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Search Routes</Text>
          <ThemeToggle />
        </View>
      </View>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Search bar */}
        <View style={styles.searchBar}>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: isDark ? colors.card : '#f5f5f5',
                color: colors.text
              }
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Enter route number"
            placeholderTextColor={colors.subText}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          <MaterialIcons 
            name="search" 
            size={24} 
            color={colors.primary} 
            style={styles.searchIcon}
          />
        </View>

        {/* Search results list */}
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.routeItem,
                { 
                  backgroundColor: colors.card,
                  shadowColor: isDark ? 'transparent' : '#000',
                },
                pressed && {
                  backgroundColor: isDark ? '#2A2A2C' : '#f8f8f8',
                }
              ]}
              onPress={() => router.push(`/(Home)/${item.route}_${item.bound}_${item.service_type}`)}
            >
              <Text style={[styles.routeNumber, { color: colors.primary }]}>{item.route}</Text>
              <Text style={[styles.routeText, { color: colors.text }]}>
                {item.orig_en} → {item.dest_en}
              </Text>
            </Pressable>
          )}
          keyExtractor={item => `${item.route}_${item.bound}_${item.service_type}`}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="search" size={40} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                {searchQuery ? 'No routes found' : 'Enter route number to search'}
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
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    position: 'relative',
  },
  input: {
    borderRadius: 10,
    padding: 14,
    paddingLeft: 48,
    fontSize: 16,
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
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default SearchPage;