import React, { useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import TablerIconComponent from '@/components/icon';

const { height } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: number;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  headerIcon?: string;
  headerIconColor?: string;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  maxHeight = height * 0.85,
  showCloseButton = true,
  closeOnBackdropPress = true,
  headerIcon,
  headerIconColor = '#2563eb',
}: ModalProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  // Don't render anything if not visible
  if (!visible) {
    return null;
  }

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop with blur effect */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleBackdropPress}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          </TouchableOpacity>
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              maxHeight,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Drag Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              {title && (
                <View className="flex-row items-center flex-1">
                  {headerIcon && (
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: `${headerIconColor}15` }}
                    >
                      <TablerIconComponent
                        name={headerIcon}
                        size={24}
                        color={headerIconColor}
                      />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900">{title}</Text>
                  </View>
                </View>
              )}
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center ml-2"
                  activeOpacity={0.7}
                >
                  <TablerIconComponent name="x" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 24,
      },
    }),
  },
});
