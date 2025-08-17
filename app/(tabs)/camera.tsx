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
import * as FileSystem from "expo-file-system";
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

              {/* Enhanced loading overlay */}
              {isLoading && (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                  <LinearGradient
                    colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.9)"]}
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
                      <View className="relative mb-6">
                        <ActivityIndicator size="large" color="#a6d2fd" />
                        <Text className="text-[#a6d2fd] mt-3 text-lg font-bold">
                          Đang phân tích AI...
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View className="w-64 h-2 bg-gray-700 rounded-full mb-4">
                        <View
                          className="h-2 bg-[#a6d2fd] rounded-full transition-all duration-300"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </View>

                      <Text className="text-white text-sm">
                        {analysisProgress < 20 && "Đang chuẩn bị dữ liệu..."}
                        {analysisProgress >= 20 && analysisProgress < 40 && "Đang xử lý hình ảnh..."}
                        {analysisProgress >= 40 && analysisProgress < 80 && "Đang phân tích cấu trúc..."}
                        {analysisProgress >= 80 && analysisProgress < 100 && "Đang tính toán kết quả..."}
                        {analysisProgress >= 100 && "Hoàn thành!"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Enhanced Analysis Results panel */}
            {showResultModal && analysisResult && (
              <Animated.View
                style={[
                  styles.resultModal,
                  {
                    transform: [{ translateY: slideUpAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.98)"]}
                  style={styles.resultContent}
                >
                  <TouchableOpacity
                    className="absolute top-4 right-4 z-10"
                    onPress={closeResultModal}
                    disabled={isSaving}
                  >
                    <View className="bg-gray-100 p-2 rounded-full">
                      <TablerIconComponent
                        name="x"
                        size={20}
                        color={isSaving ? "gray" : "#374151"}
                        strokeWidth={2}
                      />
                    </View>
                  </TouchableOpacity>

                  <View className="items-center mb-6">
                    <View className="bg-[#a6d2fd]/10 p-4 rounded-full mb-4">
                      <TablerIconComponent
                        name="fish"
                        size={32}
                        color="#a6d2fd"
                        strokeWidth={1.5}
                      />
                    </View>

                    <Text className="text-xl font-bold text-gray-800 mb-2">
                      Kết quả phân tích
                    </Text>

                    <Text className="text-sm text-gray-500 text-center">
                      Phân tích tỷ lệ cơ và ruột bằng AI
                    </Text>
                  </View>

                  {/* Health Status Card */}
                  {healthStatus && (
                    <View
                      className="mb-6 p-4 rounded-2xl border"
                      style={{
                        backgroundColor: healthStatus.bgColor,
                        borderColor: healthStatus.color + "30",
                      }}
                    >
                      <View className="flex-row items-center justify-center mb-2">
                        <TablerIconComponent
                          name={healthStatus.icon}
                          size={24}
                          color={healthStatus.color}
                          strokeWidth={2}
                        />
                        <Text
                          className="ml-2 font-bold text-lg"
                          style={{ color: healthStatus.color }}
                        >
                          {healthStatus.status}
                        </Text>
                      </View>

                      <Text
                        className="text-center text-sm"
                        style={{ color: healthStatus.color }}
                      >
                        {healthStatus.description}
                      </Text>
                    </View>
                  )}

                  {/* Metrics */}
                  <View className="space-y-4">
                    <View className="flex-row justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                      <View className="flex-row items-center">
                        <View className="bg-red-100 p-2 rounded-lg mr-3">
                          <TablerIconComponent
                            name="meat"
                            size={20}
                            color="#ef4444"
                          />
                        </View>
                        <Text className="text-gray-700 font-medium">
                          Tỷ lệ cơ
                        </Text>
                      </View>
                      <Text className="text-lg font-bold text-gray-800">
                        {(analysisResult.ratio_thit * 100).toFixed(1)}%
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
                      <View className="flex-row items-center">
                        <View className="bg-orange-100 p-2 rounded-lg mr-3">
                          <TablerIconComponent
                            name="circle-dot"
                            size={20}
                            color="#f97316"
                          />
                        </View>
                        <Text className="text-gray-700 font-medium">
                          Tỷ lệ ruột
                        </Text>
                      </View>
                      <Text className="text-lg font-bold text-gray-800">
                        {(analysisResult.ratio_ruot * 100).toFixed(1)}%
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center py-4 px-4 bg-[#a6d2fd]/10 rounded-xl border border-[#a6d2fd]/20">
                      <View className="flex-row items-center">
                        <View className="bg-[#a6d2fd]/20 p-2 rounded-lg mr-3">
                          <TablerIconComponent
                            name="calculator"
                            size={20}
                            color="#a6d2fd"
                          />
                        </View>
                        <Text className="text-gray-700 font-semibold">
                          Tỷ lệ cơ:ruột
                        </Text>
                      </View>
                      <Text className="text-xl font-bold text-[#a6d2fd]">
                        {(
                          analysisResult.ratio_thit / analysisResult.ratio_ruot
                        ).toFixed(2)}:1
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}
          </ViewShot>

          {/* NEW: Top controls for image view */}
          {analysisResult && maskImageUri && (
            <View style={styles.imageViewTopControls}>
              <TouchableOpacity
                className="bg-black/60 backdrop-blur-sm p-3 rounded-2xl"
                onPress={toggleMaskOverlay}
                style={styles.maskToggleButton}
              >
                <View className="flex-row items-center">
                  <TablerIconComponent
                    name={showMaskOverlay ? "eye" : "eye-off"}
                    size={20}
                    color="white"
                    strokeWidth={2}
                  />
                  <Text className="text-white ml-2 font-medium text-sm">
                    {showMaskOverlay ? "Ẩn phân tích" : "Hiện phân tích"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Enhanced bottom controls */}
          <View className="absolute bottom-8 w-full">
            <View className="flex-row justify-center items-center gap-6 px-8">
              <TouchableOpacity
                className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg"
                onPress={retakePhoto}
                disabled={isLoading || isSaving}
                style={styles.controlButton}
              >
                <TablerIconComponent
                  name="arrow-left"
                  size={24}
                  color={isLoading || isSaving ? "#9ca3af" : "#374151"}
                  strokeWidth={2}
                />
              </TouchableOpacity>

              {analysisResult ? (
                <>
                  {/* NEW: Info/Details button */}
                  <TouchableOpacity
                    className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg"
                    onPress={() => setShowResultModal(!showResultModal)}
                    disabled={isSaving}
                    style={styles.controlButton}
                  >
                    <TablerIconComponent
                      name={showResultModal ? "info-circle-filled" : "info-circle"}
                      size={24}
                      color={isSaving ? "#9ca3af" : "#a6d2fd"}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>

                  {/* Save button */}
                  <TouchableOpacity
                    className="bg-[#a6d2fd] p-4 rounded-2xl shadow-lg"
                    onPress={saveImages}
                    disabled={isSaving}
                    style={styles.primaryButton}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <TablerIconComponent
                        name="download"
                        size={24}
                        color="white"
                        strokeWidth={2}
                      />
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  className="bg-[#a6d2fd] p-5 rounded-2xl shadow-lg flex-row items-center  mx-5"
                  onPress={analyzeShrimpImage}
                  disabled={isLoading}
                  style={styles.primaryButton}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text className="text-white font-bold ml-2">
                        Đang phân tích...
                      </Text>
                    </>
                  ) : (
                    <>
                      <TablerIconComponent
                        name="scan"
                        size={24}
                        color="white"
                        strokeWidth={2}
                      />
                      <Text className="text-white font-bold ml-2">
                        Phân tích AI
                      </Text>
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

            {/* Enhanced shrimp detection guide */}
            <View style={styles.detectionGuide}>
              <View style={styles.detectionFrame}>
                <View style={styles.frameCorner} />
                <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />

                <View className="absolute -top-12 w-full">
                  <View className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-2xl mx-auto">
                    <Text className="text-white text-center font-medium">
                      🦐 Đặt tôm vào trong khung
                    </Text>
                  </View>
                </View>

                <View className="absolute -bottom-12 w-full">
                  <Text className="text-white/80 text-center text-sm">
                    Đảm bảo tôm được chiếu sáng đều
                  </Text>
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

        {/* Enhanced bottom controls */}
        <View style={styles.bottomControls}>
          {/* Gallery button */}
          <TouchableOpacity
            className="bg-white/90 backdrop-blur-sm h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg"
            onPress={pickImage}
            disabled={isLoading || isSaving}
            style={styles.galleryButton}
          >
            <TablerIconComponent
              name="photo"
              size={28}
              color={isLoading || isSaving ? "#9ca3af" : "#a6d2fd"}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Enhanced camera button with pulse animation */}
          <Animated.View
            style={[
              styles.cameraButtonContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <TouchableOpacity
              className="bg-white h-20 w-20 rounded-full flex items-center justify-center shadow-xl"
              onPress={takePicture}
              disabled={
                isLoading ||
                isSaving ||
                !cameraPermissionGrantedDelayed ||
                !isCameraReady
              }
            >
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
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* AI Info button */}
          <TouchableOpacity
            className="bg-white/90 backdrop-blur-sm h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg"
            onPress={() => {
              Alert.alert(
                "Phân tích AI",
                "Công nghệ AI tiên tiến giúp phân tích tỷ lệ cơ và ruột của tôm, đánh giá sức khỏe và chất lượng nuôi trồng."
              );
            }}
            disabled={isLoading || isSaving}
            style={styles.infoButton}
          >
            <TablerIconComponent
              name="info-circle"
              size={28}
              color={isLoading || isSaving ? "#9ca3af" : "#a6d2fd"}
              strokeWidth={2}
            />
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
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 24,
    minWidth: 280,
  },
  scanLine: {
    position: "absolute",
    width: 200,
    height: 2,
    backgroundColor: "#a6d2fd",
    shadowColor: "#a6d2fd",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  resultModal: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    maxHeight: height * 0.7,
  },
  resultContent: {
    padding: 24,
    paddingTop: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomEndRadius: 24,
    borderBottomStartRadius: 24,
    minHeight: 400,
  },
  detectionFrame: {
    width: width * 0.8,
    height: 280,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  frameCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#a6d2fd",
    top: 0,
    left: 0,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: "auto",
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    top: "auto",
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: "auto",
    left: "auto",
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cameraButtonContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  galleryButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  infoButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});