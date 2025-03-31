import { StyleSheet } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="[id]" 
        options={{
          // Hide from tab navigation, but still navigable when needed
          headerShown: false
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({})