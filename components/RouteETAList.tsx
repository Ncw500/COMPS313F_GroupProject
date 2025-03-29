import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { ETASquence, MergedRouteETA, OriginRouteETA, RouteStop, StopInfo } from '@/types/Interfaces';

interface RouteETAListProps {
    id: string;
}

enum Direction {
    OUTBOUND = "outbound",
    INBOUND = "inbound",
}

interface TimeRemainingProps {
    eta: string;
}

const RouteETAList = ({ id }: RouteETAListProps) => {
    const [routeETA, setRouteETA] = useState<MergedRouteETA[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const fetchRouteDetail = async () => {
            setLoading(true);
            try {
                const { routeId, routeBound, routeServiceType } = splitId(id);
                const oppositeDir = getOppositeDir(routeBound);

                const [etaResponse, stopResponse] = await Promise.all([
                    fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-eta/${routeId}/${routeServiceType}`),
                    fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeId}/${routeBound === "O" ? Direction.OUTBOUND : Direction.INBOUND}/${routeServiceType}`),
                ]);

                const etaResult = await etaResponse.json();
                const stopResult = await stopResponse.json();

                var filteredETAData: OriginRouteETA[] = [];

                if (etaResult.data.service_type === "2")
                    filteredETAData = etaResult.data.filter((item: OriginRouteETA) => {
                        return item.dir === oppositeDir
                    })
                else
                    filteredETAData = etaResult.data;


                const stopIds = new Set(stopResult.data.map((stop: RouteStop) => stop.stop));

                const stopInfoPromises = Array.from(stopIds).map((stopId) => fetchStopInfo(stopId as string));
                const stopInfoResults = await Promise.all(stopInfoPromises);

                const stopInfoMap: { [key: string]: StopInfo } = {};
                stopInfoResults.forEach((info) => {
                    stopInfoMap[info.stop] = info;
                });

                const mergedData = mergeData(filteredETAData, stopResult.data, stopInfoMap);

                setRouteETA(mergedData);
            } catch (error) {
                console.error('Error fetching route details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRouteDetail();
    }, [id]);

    const fetchStopInfo = async (stopId: string): Promise<StopInfo> => {
        try {
            const response = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop/${stopId}`);
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching stop info:', error);
            throw error;
        }
    };

    const mergeData = (
        etaData: OriginRouteETA[],
        stopData: RouteStop[],
        stopInfoMap: { [key: string]: StopInfo }
    ): MergedRouteETA[] => {
        const mergedMap: { [key: string]: MergedRouteETA } = {};

        const stopSeqMap: { [key: number]: RouteStop } = {};
        stopData.forEach((stop) => {
            stopSeqMap[Number(stop.seq)] = stop;
        });

        etaData.forEach((item) => {
            const { dir, seq, eta_seq, eta, rmk_tc, rmk_sc, rmk_en } = item;
            const key = `${dir}_${seq}`;

            if (!mergedMap[key]) {
                const routeStop = stopSeqMap[seq];
                if (!routeStop) return;

                const stopInfo = stopInfoMap[routeStop.stop];
                if (!stopInfo) return;

                mergedMap[key] = {
                    co: item.co,
                    route: item.route,
                    dir: item.dir,
                    service_type: item.service_type,
                    seq: item.seq,
                    dest_tc: item.dest_tc,
                    dest_sc: item.dest_sc,
                    dest_en: item.dest_en,
                    eta_seq_list: [],
                    data_timestamp: item.data_timestamp,
                    route_stop: routeStop,
                    stop_info: stopInfo,
                };
            }

            mergedMap[key].eta_seq_list.push({
                eta_seq,
                eta,
                rmk_tc,
                rmk_sc,
                rmk_en,
            });
        });

        return Object.values(mergedMap);
    };

    const splitId = (id: string) => {
        const [routeId, routeBound, routeServiceType] = id.split('_');
        return { routeId, routeBound, routeServiceType };
    };

    const getOppositeDir = (dir: string): string => {
        return dir === 'O' ? 'I' : 'O';
    };

    const renderRouteItem = useCallback(
        ({ item }: { item: MergedRouteETA }) => {
            const key = generateRouteItemKey(item);
            const isExpanded = expandedItems[key];

            return (
                <View style={styles.boxes}>
                    <TouchableOpacity onPress={() => toggleExpand(key)}>
                        <View style={styles.routeTitleRow}>
                            <Text style={styles.routeTitle}>{item.seq}. </Text>
                            <Text style={styles.routeTitle}>{item.stop_info?.name_en}</Text>
                        </View>
                    </TouchableOpacity>
                    {isExpanded && (
                        <FlatList
                            data={item.eta_seq_list}
                            renderItem={renderETAItem}
                            keyExtractor={(etaItem) => generateETAItemKey(etaItem, item)}
                            style={{ marginTop: 10, marginBottom: 10 }}
                        />
                    )}
                </View>
            );
        },
        [expandedItems]
    );

    const renderETAItem = useCallback(({ item }: { item: ETASquence }) => {
        return (
            <View style={styles.etaSeq}>
                <View style={styles.etaStartItem}>
                    <TimeRemaining eta={item.eta} />
                </View>
                <Text style={styles.etaMiddleItem}> - </Text>
                <Text style={styles.etaEndItem}>{item.rmk_en}</Text>
            </View>
        );
    }, []);

    const generateRouteItemKey = (item: MergedRouteETA) => {
        return `${item.route}_${item.dir}_${item.seq}_${item.service_type}`;
    };

    const generateETAItemKey = (item: ETASquence, parentItem: MergedRouteETA) => {
        return `${parentItem.route}_${parentItem.dir}_${parentItem.service_type}_${parentItem.seq}_${item.eta_seq}`;
    };

    const toggleExpand = (key: string) => {
        setExpandedItems((prev) => ({
            [key]: !prev[key],
        }));
    };

    const calculateTimeRemaining = (eta: string) => {
        try {
            const now = new Date();
            const target = new Date(eta);
            const difference = target.getTime() - now.getTime();

            if (difference < 0) return 'Expired';

            const totalMinutes = Math.floor(difference / 1000 / 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            let result = [];
            if (hours > 0) result.push(`${hours} hrs`);
            if (minutes > 0 || hours === 0) result.push(`${minutes} min`);

            return result.join(' ') || 'Arriving';
        } catch (error) {
            return 'Invalid time';
        }
    };

    const TimeRemaining = ({ eta }: TimeRemainingProps) => {
        const [remaining, setRemaining] = useState(() => calculateTimeRemaining(eta));

        useEffect(() => {
            const interval = setInterval(() => {
                setRemaining(calculateTimeRemaining(eta));
            }, 60000);
            return () => clearInterval(interval);
        }, [eta]);

        const renderColoredTime = (text: string) => {
            return text.split(/(\d+)/).map((part, i) => {
                if (/\d+/.test(part)) {
                    return <Text key={i} style={styles.numberText}>{part}</Text>;
                }
                return <Text key={i} >{part}</Text>;
            });
        };

        return (
            <Text>{renderColoredTime(remaining)}</Text>
        );
    };


    if (loading) {
        return (
            <View>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={routeETA}
                renderItem={renderRouteItem}
                keyExtractor={generateRouteItemKey}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
};

export default RouteETAList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        borderTopWidth: 1,
        borderColor: "#bdbbb5",
    },
    routeTitleRow: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: 20,
        borderWidth: 1,
        borderColor: '#bdbbb5',
    },
    routeTitle: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
        marginRight: 10,
        textAlignVertical: 'center',
    },
    boxes: {
        borderColor: "#bdbbb5",
    },
    etaSeq: {
        flexDirection: 'row',
        padding: 12,
        borderColor: '#bdbbb5',
        alignItems: 'center',
        marginLeft: 20,

    },
    etaStartItem: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        width: 80,
    },
    etaMiddleItem: {
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    etaEndItem: {
        marginLeft: 15,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    
    numberText: {
        color: '#007AFF',
    },

});