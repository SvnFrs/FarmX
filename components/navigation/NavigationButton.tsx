import { Text, Pressable, StyleSheet, Animated, Platform } from "react-native";
import React, { useEffect, useRef } from "react";
import TablerIconComponent from "@/components/icon";

type NavigationButtonProps = {
  onPress: () => void;
  onLongPress: () => void;
  isFocused: boolean;
  routeName: string;
  label: string | any;
  isCameraTab?: boolean;
};

export default function NavigationButton({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  label,
  isCameraTab = false,
}: NavigationButtonProps) {
  // Animation for smooth transitions
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.9)).current;
  const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1 : 0.9,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  // Icon colors - modern and vibrant
  const getIconColor = () => {
    if (isCameraTab) {
      return isFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
    }
    return isFocused ? '#2563eb' : '#9ca3af';
  };

  // Map route names to icon names with modern icons
  const getIconName = (route: string) => {
    const iconMap: { [key: string]: string } = {
      index: "home",
      shop: "shopping-bag",
      camera: "scan",
      manage: "layout-grid",
      notification: "bell",
    };
    return iconMap[route] || "circle";
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.button}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            backgroundColor: isFocused && !isCameraTab ? '#eff6ff' : 'transparent',
          },
        ]}
      >
        <TablerIconComponent
          name={getIconName(routeName)}
          size={isFocused ? 26 : 24}
          color={getIconColor()}
        />
      </Animated.View>

      {/* Show label only when focused */}
      {isFocused && (
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              opacity: opacityAnim,
              color: isCameraTab ? '#ffffff' : '#2563eb',
            },
          ]}
        >
          {typeof label === 'string' ? label : ''}
        </Animated.Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    ...Platform.select({
      ios: {
        letterSpacing: -0.2,
      },
    }),
  },
});