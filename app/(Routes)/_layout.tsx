import { Stack } from "expo-router";
import React from "react";

export default function RoutesLayout() {
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
