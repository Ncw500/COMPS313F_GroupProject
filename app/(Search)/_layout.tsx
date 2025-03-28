import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const SearchLayout = () => {
    return (
        <Stack screenOptions={{
            headerShown: false,
        }} />
    )
}

export default SearchLayout

const styles = StyleSheet.create({})