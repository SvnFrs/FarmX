import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenWithTabBarProps = {
  children: ReactNode;
  style?: object;
};

export default function ScreenWithTabBar({
  children,
  style = {},
}: ScreenWithTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: 70 + insets.bottom }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
