import { StyleSheet, Text, View, Platform } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const SearchLayout = () => {
    return (
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="index" />
        </Stack>
    )
}

export default SearchLayout

const styles = StyleSheet.create({})