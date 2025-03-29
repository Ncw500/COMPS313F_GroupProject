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
<<<<<<< HEAD
        name="Search/index"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
=======
        name="(Search)"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
        }} />
    </Tabs>)
}
>>>>>>> 8a4704bfa77c2b53bb9d0e815814477ecc35d98a
