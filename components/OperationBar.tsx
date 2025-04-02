import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/styles/theme';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { Route } from '@/types/Interfaces';


interface OperationBarProps {
    route?: Route | null;
    routeId?: string;
    routeBound?: string;
    serviceType?: string;
    // 新增routeStops属性
    routeStops?: BusStop[];
}

interface BusStop {
    stop: string;
    name_en: string;
    name_tc: string;
    name_sc: string;
    lat: string;
    long: string;
    seq?: number; // Optional sequence number for ordered stops
}

// 在组件中使用routeStops数据
const OperationBar = ({ route, routeId, routeBound, serviceType, routeStops }: OperationBarProps) => {
    //   console.log("🚀 ~ OperationBar ~ routeStops:", routeStops)
    // 可以在此处访问routeStops数据
    //   console.log("Received route stops:", routeStops);

    const { isDark } = useTheme();
    const colors = isDark ? Colors.dark : Colors.light;
    const { t } = useTranslation();

    console.log("🚀 ~ OperationBar ~ routeId:", route)

    const toggleRouteBound = () => {
        // Handle route bound toggle
        console.log("Route bound toggled");
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.thirds, borderColor: colors.border }]}>
            <View style={styles.contentContainer}>
                <View>
                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.card }]} 
                        onPress={toggleRouteBound}>
                        <Ionicons name="swap-horizontal-outline" size={16} color={colors.text} />
                        <Text style={[styles.buttonText, { color: colors.text }]}> {t('operationBar.oppisiteLine')}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ maxWidth: "65%", marginLeft: 30 }}>
                    <View style={styles.routeInfoContainer}>
                        <Text style={[styles.routeInfo, { color: colors.text }]}>
                            {t('operationBar.currentRouteInfo')} ｜ {routeId} ｜ {routeStops?.length} {t('operationBar.stop')} ｜
                        </Text>
                        <View style={{ alignContent: 'center', justifyContent: 'center' }}>
                            {(routeBound !== "O" ? (<Ionicons name="enter-outline" size={14} style={{ color: colors.subText }} ></Ionicons>) : (<Ionicons name="exit-outline" size={14} style={{ color: colors.subText }} ></Ionicons>))}
                        </View>

                    </View>
                    <View style={styles.routeInfoSecoundRow}>
                        <View>
                            <Text style={[styles.routeDest, { color: colors.primary }]}>
                                {t('operationBar.to')}
                            </Text>
                        </View>
                        <View>
                            <Ionicons name="arrow-forward-outline" color={colors.primary} style={{marginHorizontal: 8}}></Ionicons>
                        </View>
                        <View>
                            <Text style={[styles.routeDest, { color: colors.primary }]}>
                                {t('operationBar.routesDest', { route: route })}
                            </Text>
                        </View>


                    </View>
                </View>
                <View>
                    <Text></Text>
                </View>
            </View>
        </View>
    )
}

export default OperationBar

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        height: "100%",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        
    },
    buttonText: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        marginHorizontal: 5,
        justifyContent: 'flex-start',

    },
    button: {
        flexDirection: 'row',
        height: 40,
        minWidth: 90,
        padding: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginLeft: 5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    routeInfo: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'left',

    },
    routeInfoContainer: {
        flexDirection: 'row',
        
    },
    routeInfoSecoundRow: {
        marginTop: 2,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',

    },
    routeDest: {
        fontSize: 14,
        fontStyle: 'italic',

    },
})