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
              <FontAwesome size={28} name="home" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Mua hàng",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="address-book" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: "Camera",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="camera" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            title: "Vụ nuôi",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="cog" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            title: "Thông báo",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="cog" color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
