import React from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "react-native";
import NavigationBar from "@/components/navigation/NavigationBar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
        tabBar={(props) => {
          // Filter out the result screen from navigation
          const filteredState = {
            ...props.state,
            routes: props.state.routes.filter(route => route.name !== 'result'),
          };

          // Adjust index if needed
          if (props.state.index >= filteredState.routes.length) {
            filteredState.index = filteredState.routes.length - 1;
          } else {
            filteredState.index = props.state.index;
          }

          return <NavigationBar {...props} state={filteredState} />;
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Store",
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: "Scan",
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            title: "Manage",
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            title: "Alerts",
          }}
        />
        <Tabs.Screen
          name="result"
          options={{
            title: "Result",
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
