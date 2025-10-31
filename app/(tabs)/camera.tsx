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
  Animated,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import ViewShot from "react-native-view-shot";
import "../../global.css";
import TablerIconComponent from "@/components/icon";
import ScreenWithTabBar from "@/components/layout/ScreenWithTabBar";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

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

  // NEW: Separate state for mask visibility
  const [showMaskOverlay, setShowMaskOverlay] = useState(true);

  const [imageLayout, setImageLayout] = useState({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  });

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(300)).current;
  const maskToggleAnim = useRef(new Animated.Value(1)).current; // NEW: Animation for mask toggle

  // Fix for camera crash - delayed rendering
  const [cameraPermissionGrantedDelayed, setCameraPermissionGrantedDelayed] =
    useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Handle screen focus to properly manage camera lifecycle
  useFocusEffect(
    React.useCallback(() => {
      logger.log("🎯 Screen focused - setting up camera");
      setIsScreenFocused(true);

      // Reset animations
      slideUpAnim.setValue(300);
      progressAnim.setValue(0);

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

  // Pulse animation for capture button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    if (isCameraReady && !capturedImage) {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnim.setValue(1);
    }

    return () => pulse.stop();
  }, [isCameraReady, capturedImage]);

  // NEW: Mask toggle animation
  useEffect(() => {
    Animated.timing(maskToggleAnim, {
      toValue: showMaskOverlay ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showMaskOverlay]);

  // Scanning animation
  useEffect(() => {
    if (isLoading) {
      const scanAnimation = Animated.loop(
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      );
      scanAnimation.start();

      // Progress simulation
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => {
        scanAnimation.stop();
        clearInterval(progressInterval);
      };
    } else {
      scanAnim.setValue(0);
      setAnalysisProgress(0);
    }
  }, [isLoading]);

  // Result modal slide up animation
  useEffect(() => {
    if (showResultModal) {
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      slideUpAnim.setValue(300);
    }
  }, [showResultModal]);

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

  // NEW: Auto-enable mask overlay when analysis completes
  useEffect(() => {
    if (analysisResult && maskImageUri) {
      setShowMaskOverlay(true);
    }
  }, [analysisResult, maskImageUri]);

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
        status: "Tuyệt vời",
        description: "Tôm có sức khỏe rất tốt",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.15)",
        icon: "shield-check",
      };
    } else if (muscleToGutRatio >= 2.5) {
      return {
        status: "Bình thường",
        description: "Cần theo dõi thêm",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.15)",
        icon: "alert-triangle",
      };
    } else {
      return {
        status: "Cần cải thiện",
        description: "Nên điều chỉnh chế độ nuôi",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.15)",
        icon: "alert-circle",
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

  // NEW: Function to toggle mask overlay
  const toggleMaskOverlay = () => {
    logger.log("🎭 Toggling mask overlay", { current: showMaskOverlay });
    setShowMaskOverlay(!showMaskOverlay);
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
      Alert.alert("Lỗi", "Không thể chụp ảnh");
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
      Alert.alert("Lỗi", "Không thể chọn ảnh từ thư viện");
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
    }
  };

  const uploadImageForAnalysis = async (imageUri: string) => {
    logger.log("🚀 Starting image analysis", imageUri);

    try {
      setIsLoading(true);
      setAnalysisProgress(0);
      logger.log("⏳ Set loading state to true");

      const response = await fetch(imageUri);
      const blob = await response.blob();
      logger.log("📦 Image converted to blob");
      setAnalysisProgress(20);

      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(",")[1]);
        };
      });
      logger.log("🔤 Image converted to base64");
      setAnalysisProgress(40);

      logger.log("📡 Sending request to backend...");
      // const apiResponse = await fetch("https://contom.newlysight.com/predict", {

      const apiResponse = await fetch("https://192.168.1.52:8081/predict", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: base64,
        }),
      });

      setAnalysisProgress(80);
      logger.log("📡 Backend response received", {
        status: apiResponse.status,
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        logger.log("✅ Analysis successful", result);
        setAnalysisProgress(100);

        // Delay to show 100% completion
        setTimeout(() => {
          setAnalysisResult(result);
          setShowResultModal(true);
          logger.log("📊 Analysis result set and modal shown");
        }, 500);
      } else {
        const errorText = await apiResponse.text();
        logger.error("❌ Backend error response", {
          status: apiResponse.status,
          error: errorText,
        });

        try {
          const errorData = JSON.parse(errorText);
          Alert.alert("Lỗi", errorData.error || "Không thể phân tích hình ảnh");
        } catch (e) {
          Alert.alert(
            "Lỗi",
            `Máy chủ phản hồi với: ${apiResponse.status} - ${errorText.substring(0, 100)}`,
          );
        }
      }
    } catch (error) {
      logger.error("💥 Analysis failed", error);
      Alert.alert(
        "Lỗi",
        `Không thể kết nối đến máy chủ phân tích: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      logger.log("🏁 Analysis finished, setting loading to false");
      setIsLoading(false);
      setAnalysisProgress(0);
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
          "Từ chối quyền",
          "Không thể lưu ảnh mặt nạ mà không có quyền truy cập thư viện phương tiện",
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
          "Từ chối quyền",
          "Không thể lưu ảnh mà không có quyền truy cập thư viện phương tiện",
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
          "Thành công",
          "Kết quả phân tích đã được lưu vào thư viện của bạn",
        );
      } else {
        logger.error("ViewShot ref is null");
        if (maskSaved) {
          Alert.alert("Thành công một phần", "Chỉ ảnh phân tích được lưu");
        } else {
          Alert.alert("Lỗi", "Không thể lưu ảnh");
        }
      }
    } catch (error) {
      logger.error("Failed to save images", error);
      Alert.alert("Lỗi", "Không thể lưu ảnh");
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
    logger.log("🔄 Retake photo requested");

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
      setShowMaskOverlay(true); // Reset mask overlay to default
      setAnalysisProgress(0);
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

  // Permission checking with improved UI
  if (!permission || !mediaLibraryPermission) {
    logger.log("⏳ Waiting for permissions to load");
    return (
      <ScreenWithTabBar>
        <LinearGradient
          colors={["#e4f3ff", "#b2dcfe"]}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 justify-center items-center">
            <View className="bg-white/90 p-8 rounded-3xl mx-8 items-center shadow-lg">
              <ActivityIndicator size="large" color="#a6d2fd" />
              <Text className="mt-4 text-lg font-semibold text-gray-700">
                Đang kiểm tra quyền...
              </Text>
              <Text className="mt-2 text-sm text-gray-500 text-center">
                Vui lòng chờ trong giây lát
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ScreenWithTabBar>
    );
  }

  if (!permission.granted || !mediaLibraryPermission.granted) {
    logger.warn("❌ Permissions not granted");

    return (
      <ScreenWithTabBar>
        <LinearGradient
          colors={["#e4f3ff", "#b2dcfe"]}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 justify-center items-center">
            <View className="bg-white/95 p-8 rounded-3xl mx-8 items-center shadow-xl">
              <View className="bg-[#a6d2fd]/20 p-6 rounded-full mb-6">
                <TablerIconComponent
                  name="camera"
                  size={64}
                  color="#a6d2fd"
                  strokeWidth={1.5}
                />
              </View>

              <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Cần quyền truy cập
              </Text>

              <Text className="text-gray-600 mb-6 text-center leading-6">
                Ứng dụng cần quyền truy cập camera và thư viện ảnh để phân tích sức khỏe tôm
              </Text>

              <TouchableOpacity
                className="bg-[#a6d2fd] py-4 px-8 rounded-2xl shadow-lg"
                onPress={() => {
                  logger.log("🔐 Requesting permissions manually");
                  if (!permission.granted) requestPermission();
                  if (!mediaLibraryPermission.granted)
                    requestMediaLibraryPermission();
                }}
              >
                <Text className="text-white font-bold text-lg">
                  Cấp quyền truy cập
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ScreenWithTabBar>
    );
  }

  // Show loading while waiting for delayed camera permission
  if (!cameraPermissionGrantedDelayed) {
    logger.log("⏳ Waiting for delayed camera permission");
    return (
      <ScreenWithTabBar>
        <View className="flex-1 justify-center items-center bg-black">
          <View className="items-center">
            <ActivityIndicator size="large" color="#a6d2fd" />
            <Text className="text-white mt-4 text-lg font-medium">
              Đang khởi tạo camera...
            </Text>
            <Text className="text-gray-300 mt-2 text-sm">
              Chuẩn bị sẵn sàng để phân tích
            </Text>
          </View>
        </View>
      </ScreenWithTabBar>
    );
  }

  if (capturedImage) {
    logger.log("🖼️ Rendering captured image view");

    const healthStatus = analysisResult
      ? getHealthStatus(analysisResult.ratio_thit, analysisResult.ratio_ruot)
      : null;

    return (
      <ScreenWithTabBar>
        <SafeAreaView className="flex-1 bg-black">
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

              {/* UPDATED: Mask image overlay - now shows based on showMaskOverlay state AND maskImageUri */}
              {maskImageUri && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: maskToggleAnim,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: maskImageUri }}
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        opacity: 0.7,
                        width: "100%",
                        height: "100%",
                      },
                    ]}
                    resizeMode="contain"
                  />
                </Animated.View>
              )}

              {/* Enhanced loading overlay with better visuals */}
              {isLoading && (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                  <LinearGradient
                    colors={["rgba(0,0,0,0.85)", "rgba(0,0,0,0.95)"]}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.loadingContainer}>
                    {/* Scanning animation */}
                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          transform: [
                            {
                              translateY: scanAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-100, 100],
                              }),
                            },
                          ],
                        },
                      ]}
                    />

                    <View className="items-center">
                      {/* AI Icon with glow effect */}
                      <View className="relative mb-8">
                        <View className="bg-[#a6d2fd]/20 p-6 rounded-full mb-4">
                          <View className="bg-[#a6d2fd]/40 p-5 rounded-full">
                            <View className="bg-[#a6d2fd] p-4 rounded-full">
                              <TablerIconComponent
                                name="brain"
                                size={40}
                                color="white"
                                strokeWidth={2}
                              />
                            </View>
                          </View>
                        </View>
                        <Text className="text-[#a6d2fd] text-xl font-bold text-center">
                          Đang phân tích AI
                        </Text>
                      </View>

                      {/* Enhanced Progress bar */}
                      <View className="w-72 mb-6">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-white/80 text-xs font-medium">
                            Tiến độ
                          </Text>
                          <Text className="text-[#a6d2fd] text-sm font-bold">
                            {Math.round(analysisProgress)}%
                          </Text>
                        </View>
                        <View className="w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                          <Animated.View
                            className="h-full rounded-full"
                            style={{ 
                              width: analysisProgress ? `${analysisProgress}%` : '0%',
                              backgroundColor: "#a6d2fd",
                            }}
                          />
                        </View>
                      </View>
                      
                      {/* Status text with icon */}
                      <View className="bg-black/50 px-6 py-3 rounded-2xl border border-[#a6d2fd]/30">
                        <View className="flex-row items-center">
                          <View className="mr-3">
                            {analysisProgress < 20 && (
                              <TablerIconComponent name="file-upload" size={20} color="#a6d2fd" />
                            )}
                            {analysisProgress >= 20 && analysisProgress < 40 && (
                              <TablerIconComponent name="photo-scan" size={20} color="#a6d2fd" />
                            )}
                            {analysisProgress >= 40 && analysisProgress < 80 && (
                              <TablerIconComponent name="scan" size={20} color="#a6d2fd" />
                            )}
                            {analysisProgress >= 80 && analysisProgress < 100 && (
                              <TablerIconComponent name="calculator" size={20} color="#a6d2fd" />
                            )}
                            {analysisProgress >= 100 && (
                              <TablerIconComponent name="circle-check" size={20} color="#10b981" />
                            )}
                          </View>
                          <Text className="text-white text-sm font-medium">
                            {analysisProgress < 20 && "Đang chuẩn bị dữ liệu..."}
                            {analysisProgress >= 20 && analysisProgress < 40 && "Đang xử lý hình ảnh..."}
                            {analysisProgress >= 40 && analysisProgress < 80 && "Đang phân tích cấu trúc..."}
                            {analysisProgress >= 80 && analysisProgress < 100 && "Đang tính toán kết quả..."}
                            {analysisProgress >= 100 && "Hoàn thành! ✨"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Enhanced Analysis Results panel - FIXED POSITIONING */}
            {showResultModal && analysisResult && (
              <View style={styles.resultModalContainer}>
                {/* Dismissible backdrop */}
                <TouchableOpacity
                  style={styles.resultModalBackdrop}
                  activeOpacity={1}
                  onPress={closeResultModal}
                  disabled={isSaving}
                />
                
                <Animated.View
                  style={[
                    styles.resultModal,
                    {
                      transform: [{ translateY: slideUpAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["#ffffff", "#f0f9ff"]}
                    style={styles.resultContent}
                  >
                    {/* Drag handle */}
                    <View className="w-full items-center mb-4">
                      <View className="w-12 h-1 bg-gray-300 rounded-full" />
                    </View>

                    <TouchableOpacity
                      className="absolute top-6 right-4 z-10"
                      onPress={closeResultModal}
                      disabled={isSaving}
                    >
                      <View className="bg-gray-100 p-2 rounded-full">
                        <TablerIconComponent
                          name="x"
                          size={20}
                          color={isSaving ? "#9ca3af" : "#374151"}
                          strokeWidth={2}
                        />
                      </View>
                    </TouchableOpacity>

                    <View className="items-center mb-6">
                      <View className="bg-gradient-to-br from-[#a6d2fd] to-[#7fb8f7] p-4 rounded-full mb-4 shadow-lg">
                        <TablerIconComponent
                          name="fish"
                          size={36}
                          color="white"
                          strokeWidth={2}
                        />
                      </View>

                      <Text className="text-2xl font-bold text-gray-900 mb-2">
                        Kết quả phân tích
                      </Text>

                      <Text className="text-sm text-gray-600 text-center px-4">
                        🤖 Phân tích AI - Tỷ lệ cơ và ruột
                      </Text>
                    </View>

                    {/* Health Status Card - Enhanced */}
                    {healthStatus && (
                      <View
                        className="mb-6 p-5 rounded-2xl border-2"
                        style={{
                          backgroundColor: healthStatus.bgColor,
                          borderColor: healthStatus.color,
                        }}
                      >
                        <View className="flex-row items-center justify-center mb-3">
                          <View
                            className="p-2 rounded-full mr-3"
                            style={{ backgroundColor: healthStatus.color + "20" }}
                          >
                            <TablerIconComponent
                              name={healthStatus.icon}
                              size={28}
                              color={healthStatus.color}
                              strokeWidth={2.5}
                            />
                          </View>
                          <View className="flex-1">
                            <Text
                              className="font-bold text-xl mb-1"
                              style={{ color: healthStatus.color }}
                            >
                              {healthStatus.status}
                            </Text>
                            <Text
                              className="text-sm font-medium"
                              style={{ color: healthStatus.color }}
                            >
                              {healthStatus.description}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Metrics - Enhanced Cards */}
                    <View className="space-y-3">
                      {/* Muscle Ratio */}
                      <View className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-2xl border border-red-200 shadow-sm">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="bg-red-500 p-3 rounded-xl mr-3 shadow-md">
                              <TablerIconComponent
                                name="meat"
                                size={24}
                                color="white"
                                strokeWidth={2}
                              />
                            </View>
                            <View>
                              <Text className="text-gray-600 text-xs font-medium mb-1">
                                Muscle Ratio
                              </Text>
                              <Text className="text-gray-900 font-bold text-base">
                                Tỷ lệ cơ
                              </Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text className="text-3xl font-black text-red-600">
                              {(analysisResult.ratio_thit * 100).toFixed(1)}
                            </Text>
                            <Text className="text-red-500 font-bold text-sm">%</Text>
                          </View>
                        </View>
                      </View>

                      {/* Gut Ratio */}
                      <View className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200 shadow-sm">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="bg-orange-500 p-3 rounded-xl mr-3 shadow-md">
                              <TablerIconComponent
                                name="circle-dot"
                                size={24}
                                color="white"
                                strokeWidth={2}
                              />
                            </View>
                            <View>
                              <Text className="text-gray-600 text-xs font-medium mb-1">
                                Gut Ratio
                              </Text>
                              <Text className="text-gray-900 font-bold text-base">
                                Tỷ lệ ruột
                              </Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text className="text-3xl font-black text-orange-600">
                              {(analysisResult.ratio_ruot * 100).toFixed(1)}
                            </Text>
                            <Text className="text-orange-500 font-bold text-sm">%</Text>
                          </View>
                        </View>
                      </View>

                      {/* Main Ratio - Highlighted */}
                      <View className="bg-gradient-to-r from-[#a6d2fd] to-[#7fb8f7] p-5 rounded-2xl border-2 border-[#7fb8f7] shadow-lg">
                        <View className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full">
                          <Text className="text-[#7fb8f7] font-bold text-xs">
                            TỶ LỆ CHÍNH
                          </Text>
                        </View>
                        <View className="flex-row items-center justify-between mt-4">
                          <View className="flex-row items-center flex-1">
                            <View className="bg-white p-3 rounded-xl mr-3 shadow-md">
                              <TablerIconComponent
                                name="calculator"
                                size={24}
                                color="#7fb8f7"
                                strokeWidth={2.5}
                              />
                            </View>
                            <View>
                              <Text className="text-white text-xs font-bold mb-1">
                                Muscle : Gut Ratio
                              </Text>
                              <Text className="text-white font-black text-base">
                                Tỷ lệ cơ : ruột
                              </Text>
                            </View>
                          </View>
                          <View className="items-end">
                            <Text className="text-4xl font-black text-white">
                              {(
                                analysisResult.ratio_thit / analysisResult.ratio_ruot
                              ).toFixed(2)}
                            </Text>
                            <Text className="text-white font-bold text-sm">: 1</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </View>
            )}
          </ViewShot>

          {/* Enhanced Top controls for image view */}
          {analysisResult && maskImageUri && (
            <View style={styles.imageViewTopControls}>
              <TouchableOpacity
                className="bg-black/70 backdrop-blur-md px-4 py-3 rounded-2xl"
                onPress={toggleMaskOverlay}
                style={styles.maskToggleButton}
              >
                <View className="flex-row items-center">
                  <View className="bg-white/20 p-2 rounded-lg mr-2">
                    <TablerIconComponent
                      name={showMaskOverlay ? "eye" : "eye-off"}
                      size={20}
                      color="white"
                      strokeWidth={2.5}
                    />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-sm">
                      {showMaskOverlay ? "Ẩn phân tích" : "Hiện phân tích"}
                    </Text>
                    <Text className="text-white/80 text-xs">
                      {showMaskOverlay ? "Xem ảnh gốc" : "Xem kết quả AI"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Enhanced bottom controls with better styling */}
          <View className="absolute bottom-8 w-full px-6">
            <View className="flex-row justify-center items-center gap-4">
              <TouchableOpacity
                className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg items-center"
                onPress={retakePhoto}
                disabled={isLoading || isSaving}
                style={styles.controlButton}
              >
                <TablerIconComponent
                  name="arrow-left"
                  size={26}
                  color={isLoading || isSaving ? "#9ca3af" : "#374151"}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>

              {analysisResult ? (
                <>
                  {/* Info/Details button */}
                  <TouchableOpacity
                    className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg items-center"
                    onPress={() => setShowResultModal(!showResultModal)}
                    disabled={isSaving}
                    style={styles.controlButton}
                  >
                    <TablerIconComponent
                      name={showResultModal ? "chart-bar" : "chart-bar"}
                      size={26}
                      color={isSaving ? "#9ca3af" : "#a6d2fd"}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>

                  {/* Save button with enhanced styling */}
                  <TouchableOpacity
                    className="bg-[#a6d2fd] px-8 py-4 rounded-2xl shadow-lg flex-row items-center"
                    onPress={saveImages}
                    disabled={isSaving}
                    style={styles.primaryButton}
                  >
                    {isSaving ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text className="text-white font-bold ml-3 text-base">
                          Đang lưu...
                        </Text>
                      </>
                    ) : (
                      <>
                        <TablerIconComponent
                          name="device-floppy"
                          size={24}
                          color="white"
                          strokeWidth={2.5}
                        />
                        <Text className="text-white font-bold ml-3 text-base">
                          Lưu kết quả
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  className="bg-gradient-to-r from-[#a6d2fd] to-[#7fb8f7] px-8 py-5 rounded-2xl shadow-lg flex-row items-center flex-1 max-w-xs"
                  onPress={analyzeShrimpImage}
                  disabled={isLoading}
                  style={styles.analyzeButton}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text className="text-white font-bold ml-3 text-base">
                        Đang phân tích...
                      </Text>
                    </>
                  ) : (
                    <>
                      <View className="bg-white/20 p-2 rounded-lg mr-2">
                        <TablerIconComponent
                          name="brain"
                          size={24}
                          color="white"
                          strokeWidth={2.5}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-black text-lg">
                          Phân tích AI
                        </Text>
                        <Text className="text-white/90 text-xs">
                          Nhấn để bắt đầu
                        </Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ScreenWithTabBar>
    );
  }

  // Enhanced camera view
  logger.log("📹 Rendering camera view");

  return (
    <ScreenWithTabBar style={{ paddingBottom: 0 }}>
      <StatusBar hidden={true} />
      <View className="flex-1">
        {/* Camera view with enhanced overlay */}
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
            <ActivityIndicator size="large" color="#a6d2fd" />
            <Text className="text-white mt-4 text-lg">Đang tải camera...</Text>
          </View>
        )}

        {/* Enhanced UI overlay */}
        {cameraPermissionGrantedDelayed && isScreenFocused && (
          <>
            {/* Top gradient overlay */}
            <LinearGradient
              colors={["rgba(0,0,0,0.6)", "transparent"]}
              style={styles.topGradient}
              pointerEvents="none"
            />

            {/* Top controls with better styling */}
            <View style={styles.topControls}>
              <TouchableOpacity
                className="bg-black/40 backdrop-blur-sm p-3 rounded-2xl"
                onPress={toggleFlash}
                disabled={isLoading || isSaving || !isCameraReady}
                style={styles.topControlButton}
              >
                <Ionicons
                  name={flash === "on" ? "flash" : "flash-off"}
                  size={24}
                  color={
                    isLoading || isSaving || !isCameraReady ? "#9ca3af" : "white"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-black/40 backdrop-blur-sm p-3 rounded-2xl"
                onPress={handleFlipCamera}
                disabled={isLoading || isSaving || !isCameraReady}
                style={styles.topControlButton}
              >
                <Ionicons
                  name="camera-reverse"
                  size={24}
                  color={
                    isLoading || isSaving || !isCameraReady ? "#9ca3af" : "white"
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Enhanced shrimp detection guide with better visuals */}
            <View style={styles.detectionGuide}>
              <View style={styles.detectionFrame}>
                {/* Animated corner brackets */}
                <View style={styles.frameCorner} />
                <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />

                {/* Center crosshair */}
                <View style={styles.crosshair}>
                  <View style={styles.crosshairHorizontal} />
                  <View style={styles.crosshairVertical} />
                  <View style={styles.crosshairCenter} />
                </View>

                <View className="absolute -top-16 w-full px-4">
                  <View className="bg-black/70 backdrop-blur-sm px-5 py-3 rounded-2xl">
                    <View className="flex-row items-center justify-center">
                      <Text className="text-2xl mr-2">🦐</Text>
                      <Text className="text-white text-center font-bold text-base">
                        Đặt tôm vào trong khung
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="absolute -bottom-16 w-full px-4">
                  <View className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <Text className="text-white/90 text-center text-xs font-medium">
                      💡 Đảm bảo tôm được chiếu sáng đều và rõ nét
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Camera status with better styling */}
            {!isCameraReady && (
              <View style={styles.cameraStatus}>
                <View className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-2xl">
                  <Text className="text-white text-center font-medium">
                    📷 Camera đang khởi động...
                  </Text>
                </View>
              </View>
            )}

            {/* Bottom gradient overlay */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.bottomGradient}
              pointerEvents="none"
            />
          </>
        )}

        {/* Enhanced bottom controls with better layout */}
        <View style={styles.bottomControls}>
          {/* Gallery button with label */}
          <TouchableOpacity
            className="items-center"
            onPress={pickImage}
            disabled={isLoading || isSaving}
            style={styles.sideButton}
          >
            <View 
              className="bg-white/95 backdrop-blur-sm h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg mb-2"
              style={styles.galleryButton}
            >
              <TablerIconComponent
                name="photo"
                size={28}
                color={isLoading || isSaving ? "#9ca3af" : "#a6d2fd"}
                strokeWidth={2}
              />
            </View>
            <Text className="text-white text-xs font-medium">Thư viện</Text>
          </TouchableOpacity>

          {/* Enhanced camera button with pulse animation and outer ring */}
          <View className="items-center">
            <Animated.View
              style={[
                styles.cameraButtonContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <TouchableOpacity
                className="bg-white/10 h-24 w-24 rounded-full flex items-center justify-center border-4 border-white/30"
                onPress={takePicture}
                disabled={
                  isLoading ||
                  isSaving ||
                  !cameraPermissionGrantedDelayed ||
                  !isCameraReady
                }
              >
                <View className="bg-white h-20 w-20 rounded-full flex items-center justify-center">
                  <View className="bg-[#a6d2fd] h-16 w-16 rounded-full flex items-center justify-center">
                    <TablerIconComponent
                      name="camera"
                      size={32}
                      color={
                        isLoading ||
                        isSaving ||
                        !cameraPermissionGrantedDelayed ||
                        !isCameraReady
                          ? "#9ca3af"
                          : "white"
                      }
                      strokeWidth={2.5}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
            <Text className="text-white text-xs font-bold mt-2">Chụp ảnh</Text>
          </View>

          {/* AI Info button with label */}
          <TouchableOpacity
            className="items-center"
            onPress={() => {
              Alert.alert(
                "🤖 Phân tích AI",
                "Công nghệ AI tiên tiến giúp:\n\n• Phân tích tỷ lệ cơ và ruột\n• Đánh giá sức khỏe tôm\n• Tối ưu chất lượng nuôi trồng\n\nKết quả chính xác trong vài giây!",
                [{ text: "Đã hiểu", style: "default" }]
              );
            }}
            disabled={isLoading || isSaving}
            style={styles.sideButton}
          >
            <View 
              className="bg-white/95 backdrop-blur-sm h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg mb-2"
              style={styles.infoButton}
            >
              <TablerIconComponent
                name="info-circle"
                size={28}
                color={isLoading || isSaving ? "#9ca3af" : "#a6d2fd"}
                strokeWidth={2}
              />
            </View>
            <Text className="text-white text-xs font-medium">Trợ giúp</Text>
          </TouchableOpacity>
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
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 24,
    paddingTop: 48,
    zIndex: 10,
  },
  detectionGuide: {
    position: "absolute",
    top: height * 0.25,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  cameraStatus: {
    position: "absolute",
    bottom: height * 0.33,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  bottomControls: {
    position: "absolute",
    bottom: 128,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    zIndex: 10,
    gap: 32,
  },
  // NEW: Style for image view top controls
  imageViewTopControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 48,
    zIndex: 10,
    alignItems: "flex-start",
  },
  maskToggleButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
    elevation: 50,
  },
  loadingContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 40,
    paddingVertical: 40,
    borderRadius: 32,
    minWidth: 320,
    borderWidth: 1,
    borderColor: "rgba(166, 210, 253, 0.3)",
  },
  scanLine: {
    position: "absolute",
    width: 250,
    height: 3,
    backgroundColor: "#a6d2fd",
    shadowColor: "#a6d2fd",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  resultModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
    justifyContent: "flex-end",
  },
  resultModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  resultModal: {
    maxHeight: height * 0.75,
    zIndex: 101,
    elevation: 101,
  },
  resultContent: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 120,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  detectionFrame: {
    width: width * 0.85,
    height: 300,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  frameCorner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#a6d2fd",
    top: 0,
    left: 0,
    shadowColor: "#a6d2fd",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: "auto",
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderLeftWidth: 0,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    top: "auto",
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: "auto",
    left: "auto",
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  crosshair: {
    position: "absolute",
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  crosshairHorizontal: {
    position: "absolute",
    width: 40,
    height: 2,
    backgroundColor: "#a6d2fd",
    opacity: 0.6,
  },
  crosshairVertical: {
    position: "absolute",
    width: 2,
    height: 40,
    backgroundColor: "#a6d2fd",
    opacity: 0.6,
  },
  crosshairCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#a6d2fd",
    borderWidth: 2,
    borderColor: "white",
  },
  topControlButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  primaryButton: {
    shadowColor: "#a6d2fd",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  analyzeButton: {
    shadowColor: "#7fb8f7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  sideButton: {
    opacity: 1,
  },
  cameraButtonContainer: {
    shadowColor: "#a6d2fd",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  galleryButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  infoButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
});