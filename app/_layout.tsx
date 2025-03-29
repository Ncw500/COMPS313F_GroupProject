import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="(Home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(Search)"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
        }} />
        <Tabs.Screen
        name="Search/index"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
        }} />
    </Tabs>)
}
