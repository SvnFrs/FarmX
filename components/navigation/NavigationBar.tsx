import React from "react";
import { View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import NavigationButton from "./NavigationButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NavigationBar({
  state,
  descriptors,
  navigation,
  isVisible = true,
}: BottomTabBarProps & { isVisible?: boolean }) {
  const insets = useSafeAreaInsets();

  if (!isVisible) {
    return null;
  }

  // Check if current tab is camera
  const currentRoute = state.routes[state.index];
  const isCameraTab = currentRoute.name === "camera";

  // Set background color based on current tab
  const bgColor = isCameraTab ? "bg-transparent" : "bg-[#e4f3ff]";

  // Optional: slightly darken buttons if transparent for better visibility
  const buttonBgClass = isCameraTab ? "bg-black/30" : "bg-transparent";
  const focusedButtonClass = isCameraTab ? "bg-[#a6d2fd]" : "bg-[#b2dcfe]";

  return (
    <View
      className={`absolute bottom-0 left-0 right-0 flex-row justify-between gap-2 items-center ${bgColor} py-2 w-full px-2`}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        zIndex: 999,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <NavigationButton
            key={route.name}
            onPress={onPress}
            onLongPress={onLongPress}
            isFocused={isFocused}
            routeName={route.name}
            label={label}
            buttonBgClass={buttonBgClass}
            focusedButtonClass={focusedButtonClass}
            isTransparentMode={isCameraTab}
          />
        );
      })}
    </View>
  );
}