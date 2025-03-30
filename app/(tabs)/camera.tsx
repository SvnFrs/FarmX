import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as MediaLibrary from "expo-media-library";
import "../../global.css";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    if (!mediaLibraryPermission) {
      requestMediaLibraryPermission();
    }
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          exif: true,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const handleFlipCamera = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const uploadImageForAnalysis = async (imageUri: string) => {
    try {
      // Show loading state
      Alert.alert("Uploading...", "Sending image for analysis");

      // First, fetch the image file content
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Send to your API
      const apiResponse = await fetch("http://192.168.1.6:4000/analyze", {
        method: "POST",
        body: blob,
        headers: {
          "Content-Type": "image/jpeg", // Assuming JPEG image
        },
      });

      // Handle the response
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        Alert.alert(
          "Analysis Complete",
          `Intestine Percentage: ${result.analysis.intestinePercentage}%\n` +
            `Muscle Percentage: ${result.analysis.musclePercentage}%\n` +
            `Confidence: ${result.analysis.confidence}%\n` +
            `Quality: ${result.analysis.quality}`,
        );
      } else {
        const errorData = await apiResponse.json();
        Alert.alert("Error", errorData.error || "Failed to analyze image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Error",
        `Failed to connect to analysis server: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const analyzeShrimpImage = () => {
    if (!capturedImage) return;
    uploadImageForAnalysis(capturedImage);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  if (!permission || !mediaLibraryPermission) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text>Requesting camera permissions...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted || !mediaLibraryPermission.granted) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500">
          No access to camera or media library
        </Text>
        <TouchableOpacity
          className="mt-4 bg-blue-500 py-3 px-6 rounded-full"
          onPress={() => {
            if (!permission.granted) requestPermission();
            if (!mediaLibraryPermission.granted)
              requestMediaLibraryPermission();
          }}
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center">
          <Image
            source={{ uri: capturedImage }}
            className="w-full h-full"
            resizeMode="contain"
          />

          <View className="absolute bottom-10 w-full flex-row justify-evenly">
            <TouchableOpacity
              className="bg-white/70 p-4 rounded-full"
              onPress={retakePhoto}
            >
              <FontAwesome name="refresh" size={28} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-green-500/80 p-4 rounded-full"
              onPress={analyzeShrimpImage}
            >
              <FontAwesome name="check" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1">
      <StatusBar hidden={true} />
      <CameraView
        ref={cameraRef}
        facing={facing}
        flash={flash}
        style={styles.camera}
        ratio="16:9"
        onCameraReady={() => console.log("Camera ready")}
        onMountError={(error) => console.error("Camera mount error:", error)}
      >
        <View className="flex-1">
          <View className="flex-row justify-between p-6">
            <TouchableOpacity
              className="bg-black/30 p-3 rounded-full"
              onPress={toggleFlash}
            >
              <Ionicons
                name={flash === "on" ? "flash" : "flash-off"}
                size={24}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-black/30 p-3 rounded-full"
              onPress={handleFlipCamera}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Shrimp detection guide overlay */}
          <View className="flex-1 justify-center items-center">
            <View className="border-2 border-blue-400 rounded-lg w-4/5 h-2/5 opacity-70">
              <View className="absolute -top-8 w-full">
                <Text className="text-white text-center bg-black/50 p-1 rounded">
                  Position shrimp within frame
                </Text>
              </View>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Fixed capture button at bottom of screen */}
      <View className="absolute bottom-5 left-0 right-0 items-center">
        <TouchableOpacity
          className="bg-white h-16 w-16 rounded-full flex items-center justify-center shadow-lg border border-gray-300"
          onPress={takePicture}
        >
          <View className="bg-blue-500 h-12 w-12 rounded-full flex items-center justify-center">
            <FontAwesome name="camera" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
