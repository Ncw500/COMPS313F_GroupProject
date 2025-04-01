import { useTranslation } from '@/utils/i18n';

const NearbyRoutes = () => {
  const { t, currentLanguage } = useTranslation();

  // 假设 stops 是从 API 获取的站点数据数组
  const stops = [
    // 示例数据结构
    {
      name: {
        tc: '站名TC',
        en: 'Station Name EN'
      }
    },
    // 更多站点...
  ];

  return (
    <View>
      {/* 渲染站点列表 */}
      {stops.map((stop, index) => (
        <View key={index}>
          {/* 正确访问对象属性 */}
          <Text>{t('nearbyStopsChips.stopNameMain', { stopName: stop.name })}</Text>
          {/* 处理中文和英文名称 */}
          <Text>{currentLanguage === 'chinese' ? stop.name.tc : stop.name.en}</Text>
        </View>
      ))}
    </View>
  );
};

export default NearbyRoutes;