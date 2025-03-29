import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';

const SearchRouteForm = () => {
    const numericData = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'remove'];
    const alphabetData = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    const [numericButtonSize, setNumericButtonSize] = useState(0);

    // Define the renderItem function with explicit TypeScript types
    const renderItem = ({ item, dataType, size }: { item: string; dataType: string; size?: number }) => {
        if (dataType === 'numeric') {
            return (
                <TouchableOpacity
                    style={{
                        width: size, // Safe because size is provided for numeric items
                        height: size,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                    }}
                >
                    <Text style={{ fontSize: 20 }}>{item}</Text>
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity style={styles.alphabetGridItem}>
                    <Text style={{ fontSize: 20 }}>{item}</Text>
                </TouchableOpacity>
            );
        }
    };

    return (
        <View style={styles.container}>
            <View
                style={styles.numericInputBox}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setNumericButtonSize(Math.min(width / 3, height / 4));
                }}
            >
                <FlatList
                    style={{ flex: 1 }}
                    data={numericData}
                    renderItem={({ item }) => renderItem({ item, dataType: 'numeric', size: numericButtonSize })}
                    keyExtractor={(item, index) => index.toString()}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                />
            </View>
            <View style={styles.alphabetInputBox}>
                <FlatList
                    style={{ flex: 1 }}
                    data={alphabetData}
                    renderItem={({ item }) => renderItem({ item, dataType: 'alphabet' })}
                    keyExtractor={(item, index) => index.toString()}
                    numColumns={2}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start' }}
                />
            </View>
        </View>
    );
};

export default SearchRouteForm;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flex: 1,
    },
    numericInputBox: {
        flex: 3,
        height: '100%',
    },
    alphabetInputBox: {
        flex: 2,
        marginRight: 3,
    },
    alphabetGridItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 5,
        aspectRatio: 1,
        margin: 2,
    },
});