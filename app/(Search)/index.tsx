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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTranslation } from '@/utils/i18n';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Route[]>([]);
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t('search.title')}</Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>{t('search.subTitle')}</Text>
            </View>
            {/* <ThemeToggle showLabel={true} /> */}
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
              placeholder={t('search.placeholder')}
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
                <View style={styles.routeNumbnerContainer}>
                  <Text style={[styles.routeNumber, { color: colors.primary }]}>{item.route}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.routeBound, { color: colors.subText }]}>{(item.bound === "O" ? t('search.outbound') : t('search.inbound'))}

                    </Text>
                    {(item.bound !== "O" ? (<Ionicons name="enter-outline" size={18} style={{marginBottom: 4, marginLeft: 4, color: colors.subText}} ></Ionicons>) : (<Ionicons name="exit-outline" size={18} style={{marginBottom: 4, marginLeft: 4, color: colors.subText}} ></Ionicons>))}
                    
                  </View>

                </View>

                <View style={styles.routeTextContainer}>

                  <Text style={[styles.routeText, { color: colors.text }]}>
                    {t('search.originRouteName', { route: item })}
                  </Text>
                  <Text style={[styles.routeText, { color: colors.text, marginHorizontal: 10 }]}>
                    <Ionicons name="arrow-forward-outline"></Ionicons>
                  </Text>
                  <Text style={[styles.routeText, { color: colors.text }]}>
                    {t('search.destinationRouteName', { route: item })}
                  </Text>
                </View>
              </Pressable>
            )}
            keyExtractor={item => `${item.route}_${item.bound}_${item.service_type}`}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="search" size={40} color={isDark ? '#555' : '#ccc'} />
                <Text style={[styles.emptyText, { color: colors.subText }]}>
                  {searchQuery ? t('search.noResults') : t('search.searchHits')}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            keyboardDismissMode="on-drag"
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    height: 90
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
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  container: {
    flex: 1,
  },
  searchBar: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,

  },
  routeText: {
    fontSize: 14,
    fontWeight: 'bold',
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeNumbnerContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flex: 1,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#aaa',
    justifyContent: 'space-between',
  },
  routeTextContainer: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  routeBound: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,

  }
});

export default SearchPage;