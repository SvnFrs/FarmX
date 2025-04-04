import React from "react";
import { Tabs } from "expo-router";
import { StatusBar, View } from "react-native";
import NavigationBar from "@/components/navigation/NavigationBar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" }, // Hide the default tab bar
        }}
        tabBar={(props) => <NavigationBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Tin tức",
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Mua hàng",
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: "Camera",
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            title: "Vụ nuôi",
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            title: "Thông báo",
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
