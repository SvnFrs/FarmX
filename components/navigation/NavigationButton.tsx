import { Text, Pressable } from "react-native";
import React from "react";
import TablerIconComponent from "@/components/icon";

type NavigationButtonProps = {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  label: string | any;
  buttonBgClass?: string;
  focusedButtonClass?: string;
  isTransparentMode?: boolean;
};

export default function NavigationButton({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  label,
  buttonBgClass = "bg-transparent",
  focusedButtonClass = "bg-white",
  isTransparentMode = false,
}: NavigationButtonProps) {
  const buttonStyles = isFocused ? focusedButtonClass : buttonBgClass;
  const textColor = isFocused ? "text-black" : "text-gray-100";

  // Adjust icon color based on mode and focus state
  const iconColor = isTransparentMode
    ? isFocused
      ? "#0d4a4f"
      : "#fff"
    : isFocused
      ? "#0d4a4f"
      : "#374151";

  // Map route names to icon names
  const getIconName = (route: string) => {
    const iconMap: { [key: string]: string } = {
      index: "fish",
      shop: "building-store",
      camera: "camera",
      manage: "fish",
      notification: "bell",
    };
    return iconMap[route] || "question-mark";
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`flex-1 items-center justify-center py-2 px-1 rounded-2xl ${buttonStyles}`}
    >
      <TablerIconComponent
        name={getIconName(routeName)}
        size={24}
        color={iconColor}
      />

      {/* show the label only when focused */}
      {isFocused && (
        <Text
          numberOfLines={1}
          className={`text-xs font-bold mt-1 ${textColor}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}