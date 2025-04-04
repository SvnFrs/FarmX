import TablerIconComponent from "@/components/icon";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { StatusBar } from "react-native";

export default function TabLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Tabs
        screenOptions={{ tabBarActiveTintColor: "blue", headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Tin tức",
            tabBarIcon: ({ color }) => (
              <TablerIconComponent name="fish" size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Mua hàng",
            tabBarIcon: ({ color }) => (
              <TablerIconComponent name="building-store" size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: "Camera",
            tabBarIcon: ({ color }) => (
              <TablerIconComponent name="camera" size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            title: "Vụ nuôi",
            tabBarIcon: ({ color }) => (
              <TablerIconComponent name="fish" size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            title: "Thông báo",
            tabBarIcon: ({ color }) => (
              <TablerIconComponent name="bell" size={24} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
