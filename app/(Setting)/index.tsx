import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Colors } from "@/styles/theme";
import { useRouter } from 'expo-router';
import { useTheme } from "@/context/ThemeContext";
import { LanguageToggle } from '@/components/LanguageToggle';
import { LanguageProvider } from '@/context/LanguageContext';

export const SettingPage = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? Colors.dark : Colors.light;

  return (

    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Setting</Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>Customize your app settings</Text>
            </View>

          </View>
        </View>
        <View style={styles.settingListContainer}>

          <View style={styles.settingItemContainer}>
            {/* 新增设置项容器外边距和间距 */}
            <View style={[
              styles.settingItemTitleCard,
              {
                backgroundColor: colors.card,
                shadowColor: isDark ? 'transparent' : '#000',
                marginBottom: 12 // 增加底部间距
              }
            ]}>
              <View style={styles.settingItemTitleContainer}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>System Theme</Text>
              </View>
              {/* 调整开关位置为右对齐 */}
              <View style={{ justifyContent: 'flex-end', marginRight: 16, marginTop: 5 }}>
                <ThemeToggle showLabel={true} />
              </View>
            </View>

          </View>


          <View style={styles.settingItemContainer}>
            {/* 新增设置项容器外边距和间距 */}
            <View style={[
              styles.settingItemTitleCard,
              {
                backgroundColor: colors.card,
                shadowColor: isDark ? 'transparent' : '#000',
                marginBottom: 12 // 增加底部间距
              }
            ]}>
              <View style={styles.settingItemTitleContainer}>
                <Text style={[styles.settingItemTitle, { color: colors.text }]}>Language</Text>
              </View>
              {/* 调整开关位置为右对齐 */}
              <View style={{ justifyContent: 'flex-end', marginRight: 16, marginTop: 5 }}>
    
                  <LanguageToggle showLabel={true} />
              </View>
            </View>

          </View>
        </View>
      </View>
    </SafeAreaView>

  )
}

export default SettingPage

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  settingListContainer: {
    paddingTop: 14
  },
  settingItemContainer: {

    paddingHorizontal: 16, // 新增内边距
    paddingTop: 12, // 新增顶部内边距
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  settingItemTitleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 0, // 移除外边距
    marginTop: 0,
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // 调整标题容器布局
  settingItemTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // 增大标题与开关间距
    width: '100%' // 新增全宽布局
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 24 // 新增标题右侧间距
  },
  stopNameLocal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  stopId: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  distanceBadge: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  routesContainer: {
    marginTop: 8,
  },
  routesTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  routesScrollContent: {
    paddingBottom: 5,
  },
  routeChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 150,
  },
  routeChipNumber: {
    fontWeight: '700',
    color: '#007AFF',
    fontSize: 14,
    marginRight: 6,
  },
  routeChipDestination: {
    fontSize: 12,
    color: '#555',
    flex: 1,
    flexShrink: 1,
  },
  noRoutesText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  routeLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  routeLoadingText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  errorBanner: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
  warningBanner: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
})