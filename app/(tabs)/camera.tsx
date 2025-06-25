import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import ViewShot from "react-native-view-shot";
import "../../global.css";
import TablerIconComponent from "@/components/icon";
import ScreenWithTabBar from "@/components/layout/ScreenWithTabBar";
import { useFocusEffect } from "@react-navigation/native";

// Enhanced logging utility
const logger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[CAMERA-${timestamp}] ${message}`, data || "");
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[CAMERA-ERROR-${timestamp}] ${message}`, error || "");
  },
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[CAMERA-WARN-${timestamp}] ${message}`, data || "");
  },
};

export default function CameraScreen() {
  logger.log("🚀 CameraScreen component initializing");

  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const cameraRef = useRef<any>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    mask: string;
    ratio_thit: number;
    ratio_ruot: number;
  } | null>(null);
  const [maskImageUri, setMaskImageUri] = useState<string | null>(null);
  const [imageLayout, setImageLayout] = useState({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  });

  // Fix for camera crash - delayed rendering
  const [cameraPermissionGrantedDelayed, setCameraPermissionGrantedDelayed] =
    useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Handle screen focus to properly manage camera lifecycle
  useFocusEffect(
    React.useCallback(() => {
      logger.log("🎯 Screen focused - setting up camera");
      setIsScreenFocused(true);

      return () => {
        logger.log("👋 Screen unfocused - cleaning up camera");
        setIsScreenFocused(false);
        setCameraPermissionGrantedDelayed(false);
        setIsCameraReady(false);

        // Safe camera ref cleanup
        if (cameraRef.current) {
          logger.log("🧹 Cleaning up camera ref");
          try {
            cameraRef.current = null;
          } catch (error) {
            logger.error("Error cleaning up camera ref", error);
          }
        }
      };
    }, []),
  );

  useEffect(() => {
    logger.log("🔐 Checking permissions", {
      cameraPermission: permission?.granted,
      mediaPermission: mediaLibraryPermission?.granted,
    });

    if (!permission) {
      logger.log("📸 Requesting camera permission");
      requestPermission();
    }
    if (!mediaLibraryPermission) {
      logger.log("📁 Requesting media library permission");
      requestMediaLibraryPermission();
    }
  }, []);

  // Delayed camera permission to prevent crashes
  useEffect(() => {
    logger.log("⏱️ Camera permission delay effect", {
      permissionGranted: permission?.granted,
      isScreenFocused,
      currentDelayedState: cameraPermissionGrantedDelayed,
    });

    if (permission?.granted && isScreenFocused) {
      logger.log("⏳ Starting camera permission delay timer (1000ms)");

      const timer = setTimeout(() => {
        logger.log("✅ Camera permission delay completed - enabling camera");
        setCameraPermissionGrantedDelayed(true);
      }, 1000);

      return () => {
        logger.log("🚫 Clearing camera permission delay timer");
        clearTimeout(timer);
      };
    } else {
      if (cameraPermissionGrantedDelayed) {
        logger.log("❌ Disabling delayed camera permission");
        setCameraPermissionGrantedDelayed(false);
      }
    }
  }, [permission?.granted, isScreenFocused]);

  // Convert base64 to local image URI when analysis result is set
  useEffect(() => {
    if (analysisResult?.mask) {
      logger.log("🖼️ Creating local image from base64 mask");
      createLocalImageFromBase64(analysisResult.mask);
    }
  }, [analysisResult]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      logger.log("🏁 Component unmounting - final cleanup");
      setIsLoading(false);
      setIsSaving(false);
      setIsCameraReady(false);
    };
  }, []);

  // Camera lifecycle handlers
  const handleCameraReady = () => {
    logger.log("📹 Camera ready callback triggered");
    setIsCameraReady(true);
  };

  const handleCameraError = (error: any) => {
    logger.error("💥 Camera mount error", error);
    setIsCameraReady(false);
  };

  // Get the actual layout of the displayed image
  const onImageLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    logger.log("📐 Image layout updated", { x, y, width, height });
    setImageLayout({ x, y, width, height });
  };

  // Function to determine health status based on muscle to gut ratio
  const getHealthStatus = (muscleRatio: number, gutRatio: number) => {
    const muscleToGutRatio = muscleRatio / gutRatio;
    logger.log("💪 Calculating health status", {
      muscleRatio,
      gutRatio,
      ratio: muscleToGutRatio,
    });

    if (muscleToGutRatio >= 3.5) {
      return {
        status: "Healthy",
        color: "#22c55e",
        bgColor: "rgba(34, 197, 94, 0.1)",
      };
    } else if (muscleToGutRatio >= 2.5) {
      return {
        status: "Needs Attention",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
      };
    } else {
      return {
        status: "Unhealthy",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      };
    }
  };

  const createLocalImageFromBase64 = async (base64: string) => {
    try {
      logger.log("💾 Creating local image from base64");
      const fileUri = FileSystem.cacheDirectory + "mask_image.png";
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      logger.log("✅ Local image created successfully", fileUri);
      setMaskImageUri(fileUri);
    } catch (error) {
      logger.error("Failed to create local image", error);
    }
  };

  const takePicture = async () => {
    logger.log("📸 Take picture requested", {
      cameraRefExists: !!cameraRef.current,
      isLoading,
      isCameraReady,
    });

    if (!cameraRef.current) {
      logger.error("Camera ref is null when trying to take picture");
      return;
    }

    if (!isCameraReady) {
      logger.warn("Camera not ready when trying to take picture");
      return;
    }

    if (isLoading) {
      logger.warn("Already loading when trying to take picture");
      return;
    }

    try {
      logger.log("📷 Taking picture...");
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        exif: true,
      });
      logger.log("✅ Picture taken successfully", photo.uri);
      setCapturedImage(photo.uri);
    } catch (error) {
      logger.error("Failed to take picture", error);
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const pickImage = async () => {
    try {
      logger.log("🖼️ Picking image from gallery");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        logger.log("✅ Image picked successfully", result.assets[0].uri);
        setCapturedImage(result.assets[0].uri);
      } else {
        logger.log("❌ Image picking cancelled");
      }
    } catch (error) {
      logger.error("Failed to pick image", error);
      Alert.alert("Error", "Failed to pick image from gallery");
    }
  };

  const handleFlipCamera = () => {
    logger.log("🔄 Flip camera requested", {
      currentFacing: facing,
      isLoading,
      isSaving,
      isCameraReady,
    });

    if (!isLoading && !isSaving && isCameraReady) {
      const newFacing = facing === "back" ? "front" : "back";
      logger.log("🔄 Flipping camera", { from: facing, to: newFacing });
      setFacing(newFacing);
    } else {
      logger.warn("Cannot flip camera - conditions not met", {
        isLoading,
        isSaving,
        isCameraReady,
      });
    }
  };

  const toggleFlash = () => {
    logger.log("⚡ Toggle flash requested", {
      currentFlash: flash,
      isLoading,
      isSaving,
      isCameraReady,
    });

    if (!isLoading && !isSaving && isCameraReady) {
      const newFlash = flash === "off" ? "on" : "off";
      logger.log("⚡ Toggling flash", { from: flash, to: newFlash });
      setFlash(newFlash);
    } else {
      logger.warn("Cannot toggle flash - conditions not met", {
        isLoading,
        isSaving,
        isCameraReady,
      });
    }
  };

  const uploadImageForAnalysis = async (imageUri: string) => {
    logger.log("🚀 Starting image analysis", imageUri);

    try {
      setIsLoading(true);
      logger.log("⏳ Set loading state to true");

      const response = await fetch(imageUri);
      const blob = await response.blob();
      logger.log("📦 Image converted to blob");

      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(",")[1]);
        };
      });
      logger.log("🔤 Image converted to base64");

      logger.log("📡 Sending request to backend...");
      const apiResponse = await fetch("https://contom.newlysight.com/predict", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: base64,
        }),
      });

      logger.log("📡 Backend response received", {
        status: apiResponse.status,
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        logger.log("✅ Analysis successful", result);

        setAnalysisResult(result);
        setShowResultModal(true);
        logger.log("📊 Analysis result set and modal shown");
      } else {
        const errorText = await apiResponse.text();
        logger.error("❌ Backend error response", {
          status: apiResponse.status,
          error: errorText,
        });

        try {
          const errorData = JSON.parse(errorText);
          Alert.alert("Error", errorData.error || "Failed to analyze image");
        } catch (e) {
          Alert.alert(
            "Error",
            `Server responded with: ${apiResponse.status} - ${errorText.substring(0, 100)}`,
          );
        }
      }
    } catch (error) {
      logger.error("💥 Analysis failed", error);
      Alert.alert(
        "Error",
        `Failed to connect to analysis server: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      logger.log("🏁 Analysis finished, setting loading to false");
      setIsLoading(false);
    }
  };

  const saveMaskImage = async () => {
    if (!maskImageUri) {
      logger.warn("No mask image URI to save");
      return false;
    }

    try {
      logger.log("💾 Saving mask image", maskImageUri);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        logger.error("Media library permission denied");
        Alert.alert(
          "Permission denied",
          "Cannot save mask image without media library permission",
        );
        return false;
      }

      const asset = await MediaLibrary.createAssetAsync(maskImageUri);
      await MediaLibrary.createAlbumAsync("ShrimpAnalysis", asset, false);
      logger.log("✅ Mask image saved successfully");
      return true;
    } catch (error) {
      logger.error("Failed to save mask image", error);
      return false;
    }
  };

  const saveImages = async () => {
    if (!maskImageUri || !capturedImage) {
      logger.warn("Missing images to save", {
        maskImageUri: !!maskImageUri,
        capturedImage: !!capturedImage,
      });
      return;
    }

    try {
      logger.log("💾 Starting image save process");
      setIsSaving(true);

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        logger.error("Media library permission denied for saving");
        Alert.alert(
          "Permission denied",
          "Cannot save images without media library permission",
        );
        return;
      }

      const maskSaved = await saveMaskImage();
      logger.log("💾 Mask save result", maskSaved);

      if (viewShotRef.current) {
        logger.log("📸 Capturing composite view");
        const uri = await viewShotRef.current.capture();
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("ShrimpAnalysis", asset, false);

        logger.log("✅ All images saved successfully");
        Alert.alert(
          "Success",
          `${maskSaved ? "Mask image and overlay" : "Overlay"} saved to your gallery`,
        );
      } else {
        logger.error("ViewShot ref is null");
        if (maskSaved) {
          Alert.alert("Partial Success", "Only mask image was saved");
        } else {
          Alert.alert("Error", "Failed to save images");
        }
      }
    } catch (error) {
      logger.error("Failed to save images", error);
      Alert.alert("Error", "Failed to save images");
    } finally {
      logger.log("🏁 Image save process finished");
      setIsSaving(false);
    }
  };

  const analyzeShrimpImage = () => {
    logger.log("🔬 Analyze shrimp requested", {
      capturedImage: !!capturedImage,
      isLoading,
    });

    if (!capturedImage || isLoading) {
      logger.warn("Cannot analyze - missing image or already loading", {
        capturedImage: !!capturedImage,
        isLoading,
      });
      return;
    }

    uploadImageForAnalysis(capturedImage);
  };

  const retakePhoto = () => {
    logger.log("🔄 Retake photo requested", {
      isLoading,
      isSaving,
      capturedImage: !!capturedImage,
      showResultModal,
    });

    if (isLoading || isSaving) {
      logger.warn("Cannot retake - still loading or saving");
      return;
    }

    try {
      logger.log("🧹 Resetting all photo states");
      setCapturedImage(null);
      setAnalysisResult(null);
      setMaskImageUri(null);
      setShowResultModal(false);
      logger.log("✅ Photo states reset successfully");
    } catch (error) {
      logger.error("Error in retakePhoto", error);
    }
  };

  const closeResultModal = () => {
    logger.log("❌ Close result modal requested", { isSaving });

    if (!isSaving) {
      logger.log("✅ Closing result modal");
      setShowResultModal(false);
    } else {
      logger.warn("Cannot close modal - still saving");
    }
  };

  // Permission checking
  if (!permission || !mediaLibraryPermission) {
    logger.log("⏳ Waiting for permissions to load");
    return (
      <ScreenWithTabBar>
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-4">Requesting permissions...</Text>
        </SafeAreaView>
      </ScreenWithTabBar>
    );
  }

  if (!permission.granted || !mediaLibraryPermission.granted) {
    logger.warn("❌ Permissions not granted", {
      camera: permission.granted,
      mediaLibrary: mediaLibraryPermission.granted,
    });

    return (
      <ScreenWithTabBar>
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
          <Text className="text-red-500 mb-4 text-center px-4">
            Camera and media library access required for this feature
          </Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 py-3 px-6 rounded-full"
            onPress={() => {
              logger.log("🔐 Requesting permissions manually");
              if (!permission.granted) requestPermission();
              if (!mediaLibraryPermission.granted)
                requestMediaLibraryPermission();
            }}
          >
            <Text className="text-white font-bold">Grant Permissions</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScreenWithTabBar>
    );
  }

  // Show loading while waiting for delayed camera permission
  if (!cameraPermissionGrantedDelayed) {
    logger.log("⏳ Waiting for delayed camera permission");
    return (
      <ScreenWithTabBar>
        <SafeAreaView className="flex-1 justify-center items-center bg-black">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="text-white mt-4">Initializing camera...</Text>
        </SafeAreaView>
      </ScreenWithTabBar>
    );
  }

  if (capturedImage) {
    logger.log("🖼️ Rendering captured image view", {
      showResultModal,
      hasAnalysisResult: !!analysisResult,
      hasMaskImage: !!maskImageUri,
    });

    const healthStatus = analysisResult
      ? getHealthStatus(analysisResult.ratio_thit, analysisResult.ratio_ruot)
      : null;

    return (
      <ScreenWithTabBar>
        <SafeAreaView className="flex-1">
          <ViewShot
            ref={viewShotRef}
            options={{ format: "jpg", quality: 0.9 }}
            style={{ flex: 1 }}
          >
            <View className="flex-1 justify-center">
              {/* Original image */}
              <Image
                source={{ uri: capturedImage }}
                className="w-full h-full"
                resizeMode="contain"
                onLayout={onImageLayout}
              />

              {/* Mask image overlay - only shown when showResultModal is true */}
              {showResultModal && maskImageUri && (
                <Image
                  source={{ uri: maskImageUri }}
                  style={[
                    StyleSheet.absoluteFill,
                    { opacity: 0.6, width: "100%", height: "100%" },
                  ]}
                  resizeMode="contain"
                />
              )}

              {/* Loading overlay - simple version without animation */}
              {isLoading && (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00bcd4" />
                    <Text style={styles.loadingText}>Analyzing shrimp...</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Analysis Results information panel */}
            {showResultModal && analysisResult && (
              <View className="absolute top-10 left-0 right-0 bg-black/80 p-4 mx-4 rounded-lg">
                <TouchableOpacity
                  className="absolute top-2 right-2"
                  onPress={closeResultModal}
                  disabled={isSaving}
                >
                  <TablerIconComponent
                    name="x"
                    size={24}
                    color={isSaving ? "gray" : "white"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>

                <Text className="text-white text-xl font-bold mb-3">
                  Muscle-to-Gut Analysis
                </Text>

                {/* Health Status */}
                {healthStatus && (
                  <View
                    className="mb-3 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: healthStatus.bgColor }}
                  >
                    <Text
                      className="text-center font-bold text-lg"
                      style={{ color: healthStatus.color }}
                    >
                      Status: {healthStatus.status}
                    </Text>
                  </View>
                )}

                {/* Ratios */}
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-white text-base font-medium">
                      Muscle Ratio:
                    </Text>
                    <Text className="text-white text-base">
                      {(analysisResult.ratio_thit * 100).toFixed(1)}%
                    </Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-white text-base font-medium">
                      Gut Ratio:
                    </Text>
                    <Text className="text-white text-base">
                      {(analysisResult.ratio_ruot * 100).toFixed(1)}%
                    </Text>
                  </View>

                  <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-400">
                    <Text className="text-white text-base font-bold">
                      Muscle:Gut Ratio:
                    </Text>
                    <Text className="text-white text-base font-bold">
                      {(
                        analysisResult.ratio_thit / analysisResult.ratio_ruot
                      ).toFixed(2)}
                      :1
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ViewShot>

          <View className="absolute bottom-10 w-full flex-row justify-evenly">
            <TouchableOpacity
              className="bg-white/70 p-4 rounded-full"
              onPress={retakePhoto}
              disabled={isLoading || isSaving}
            >
              <TablerIconComponent
                name="arrow-left"
                size={28}
                color={isLoading || isSaving ? "gray" : "black"}
                strokeWidth={2}
              />
            </TouchableOpacity>

            {showResultModal ? (
              <TouchableOpacity
                className="bg-saltpan-400/90 p-4 rounded-full"
                onPress={saveImages}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <TablerIconComponent
                    name="device-floppy"
                    size={28}
                    color="white"
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-saltpan-400/90 p-4 rounded-full"
                onPress={analyzeShrimpImage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <TablerIconComponent
                    name="check"
                    size={28}
                    color="white"
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </ScreenWithTabBar>
    );
  }

  logger.log("📹 Rendering camera view", {
    cameraPermissionGrantedDelayed,
    isScreenFocused,
    isCameraReady,
  });

  return (
    <ScreenWithTabBar style={{ paddingBottom: 0 }}>
      <StatusBar hidden={true} />
      <View className="flex-1">
        {/* CameraView without any children */}
        {cameraPermissionGrantedDelayed && isScreenFocused ? (
          <CameraView
            ref={cameraRef}
            facing={facing}
            flash={flash}
            style={styles.camera}
            ratio="16:9"
            onCameraReady={handleCameraReady}
            onMountError={handleCameraError}
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-black">
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white mt-4">Loading camera...</Text>
          </View>
        )}

        {/* All UI elements positioned absolutely over the camera */}
        {cameraPermissionGrantedDelayed && isScreenFocused && (
          <>
            {/* Top controls */}
            <View className="absolute top-0 left-0 right-0 flex-row justify-between p-6 pt-12">
              <TouchableOpacity
                className="bg-black/30 p-3 rounded-full"
                onPress={toggleFlash}
                disabled={isLoading || isSaving || !isCameraReady}
              >
                <Ionicons
                  name={flash === "on" ? "flash" : "flash-off"}
                  size={24}
                  color={
                    isLoading || isSaving || !isCameraReady ? "gray" : "white"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-black/30 p-3 rounded-full"
                onPress={handleFlipCamera}
                disabled={isLoading || isSaving || !isCameraReady}
              >
                <Ionicons
                  name="camera-reverse"
                  size={24}
                  color={
                    isLoading || isSaving || !isCameraReady ? "gray" : "white"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Shrimp detection guide overlay */}
            <View className="absolute top-1/4 left-0 right-0 items-center">
              <View className="border-2 border-sky-400 border-dotted rounded-lg w-4/5 h-64 opacity-70">
                <View className="absolute -top-8 w-full">
                  <Text className="text-white text-center bg-black/50 p-1 rounded">
                    Position shrimp within frame
                  </Text>
                </View>
              </View>
            </View>

            {/* Camera status indicator */}
            {!isCameraReady && (
              <View className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2">
                <View className="bg-black/70 p-3 rounded-lg">
                  <Text className="text-white text-center text-sm">
                    Camera loading...
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Bottom button row - always visible */}
        <View className="absolute bottom-40 left-0 right-0 flex-row justify-between items-center space-x-6 px-5">
          {/* Gallery button */}
          <TouchableOpacity
            className="bg-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg border border-gray-300"
            onPress={pickImage}
            disabled={isLoading || isSaving}
          >
            <View className="bg-saltpan-400 h-10 w-10 rounded-full flex items-center justify-center">
              <TablerIconComponent
                name="library-photo"
                size={24}
                color={isLoading || isSaving ? "gray" : "white"}
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>

          {/* Camera button */}
          <TouchableOpacity
            className="bg-white h-20 w-20 rounded-full flex items-center justify-center shadow-lg border border-gray-300"
            onPress={takePicture}
            disabled={
              isLoading ||
              isSaving ||
              !cameraPermissionGrantedDelayed ||
              !isCameraReady
            }
          >
            <View className="bg-sky-500 h-16 w-16 rounded-full flex items-center justify-center">
              <TablerIconComponent
                name="camera"
                size={30}
                color={
                  isLoading ||
                  isSaving ||
                  !cameraPermissionGrantedDelayed ||
                  !isCameraReady
                    ? "gray"
                    : "white"
                }
                strokeWidth={2}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-transparent h-14 w-14 rounded-full flex items-center justify-center shadow-lg"
            onPress={pickImage}
            disabled={isLoading || isSaving}
          ></TouchableOpacity>
        </View>
      </View>
    </ScreenWithTabBar>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
});
