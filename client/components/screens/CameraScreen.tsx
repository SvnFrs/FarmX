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
import "../../global.css";
import TablerIconComponent from "@/components/icon";
import ScreenWithTabBar from "@/components/layout/ScreenWithTabBar";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

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

export function CameraScreen() {
  logger.log("🚀 CameraScreen component initializing");

  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] =
    MediaLibrary.usePermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on" | "auto">("off");
  const cameraRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

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

      return () => {
        logger.log("👋 Screen unfocused - cleaning up camera");
        setIsScreenFocused(false);
        setCameraPermissionGrantedDelayed(false);
        setIsCameraReady(false);

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

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      logger.log("🏁 Component unmounting - final cleanup");
      setIsLoading(false);
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

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady || isLoading) {
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
      }
    } catch (error) {
      logger.error("Failed to pick image", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh từ thư viện");
    }
  };

  const handleFlipCamera = () => {
    if (!isLoading && isCameraReady) {
      const newFacing = facing === "back" ? "front" : "back";
      logger.log("🔄 Flipping camera", { from: facing, to: newFacing });
      setFacing(newFacing);
    }
  };

  const toggleFlash = () => {
    if (!isLoading && isCameraReady) {
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

      const response = await fetch(imageUri);
      const blob = await response.blob();
      setAnalysisProgress(20);

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(",")[1]);
        };
      });
      setAnalysisProgress(40);

      const apiResponse = await fetch("http://192.168.1.52:8081/predict", {
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

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        logger.log("✅ Analysis successful", result);
        setAnalysisProgress(100);

        // Create local image from mask
        const maskFileUri = `${FileSystem.documentDirectory}mask_image.png`;
        await FileSystem.writeAsStringAsync(maskFileUri, result.mask, {
          encoding: "base64",
        });

        // Navigate to result screen
        setTimeout(() => {
          setIsLoading(false);
          setCapturedImage(null); // Reset captured image
          router.push({
            pathname: "/(tabs)/result",
            params: {
              imageUri: capturedImage,
              maskUri: maskFileUri,
              ratioThit: result.ratio_thit.toString(),
              ratioRuot: result.ratio_ruot.toString(),
            },
          });
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
          Alert.alert("Lỗi", `Máy chủ phản hồi với: ${apiResponse.status}`);
        }
        setIsLoading(false);
      }
    } catch (error) {
      logger.error("💥 Analysis failed", error);
      Alert.alert(
        "Lỗi",
        `Không thể kết nối đến máy chủ phân tích: ${error instanceof Error ? error.message : String(error)}`,
      );
      setIsLoading(false);
    } finally {
      setAnalysisProgress(0);
    }
  };

  const analyzeShrimpImage = () => {
    if (!capturedImage || isLoading) {
      return;
    }
    uploadImageForAnalysis(capturedImage);
  };

  const retakePhoto = () => {
    if (isLoading) {
      return;
    }

    try {
      setCapturedImage(null);
      setAnalysisProgress(0);
    } catch (error) {
      logger.error("Error in retakePhoto", error);
    }
  };

  // Permission checking screens
  if (!permission || !mediaLibraryPermission) {
    return (
      <ScreenWithTabBar>
        <LinearGradient colors={["#e4f3ff", "#b2dcfe"]} style={{ flex: 1 }}>
          <SafeAreaView className="flex-1 justify-center items-center">
            <View className="bg-white/90 p-8 rounded-3xl mx-8 items-center shadow-lg">
              <ActivityIndicator size="large" color="#a6d2fd" />
              <Text className="mt-4 text-lg font-semibold text-gray-700">
                Đang kiểm tra quyền...
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ScreenWithTabBar>
    );
  }

  if (!permission.granted || !mediaLibraryPermission.granted) {
    return (
      <ScreenWithTabBar>
        <LinearGradient colors={["#e4f3ff", "#b2dcfe"]} style={{ flex: 1 }}>
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
                Ứng dụng cần quyền truy cập camera và thư viện ảnh để phân tích
                sức khỏe tôm
              </Text>
              <TouchableOpacity
                className="bg-[#a6d2fd] py-4 px-8 rounded-2xl shadow-lg"
                onPress={() => {
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

  if (!cameraPermissionGrantedDelayed) {
    return (
      <ScreenWithTabBar>
        <View className="flex-1 justify-center items-center bg-black">
          <ActivityIndicator size="large" color="#a6d2fd" />
          <Text className="text-white mt-4 text-lg font-medium">
            Đang khởi tạo camera...
          </Text>
        </View>
      </ScreenWithTabBar>
    );
  }

  // Captured Image Preview Screen
  if (capturedImage) {
    return (
      <ScreenWithTabBar>
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-1 justify-center">
            <Image
              source={{ uri: capturedImage }}
              className="w-full h-full"
              resizeMode="contain"
            />

            {isLoading && (
              <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                <LinearGradient
                  colors={["rgba(0,0,0,0.85)", "rgba(0,0,0,0.95)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.loadingContainer}>
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
                            width: `${analysisProgress}%`,
                            backgroundColor: "#a6d2fd",
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View className="absolute bottom-8 w-full px-6">
            <View className="flex-row justify-center items-center gap-4">
              <TouchableOpacity
                className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg items-center"
                onPress={retakePhoto}
                disabled={isLoading}
                style={styles.controlButton}
              >
                <TablerIconComponent
                  name="arrow-left"
                  size={26}
                  color={isLoading ? "#9ca3af" : "#374151"}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>

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
            </View>
          </View>
        </SafeAreaView>
      </ScreenWithTabBar>
    );
  }

  // Camera view
  return (
    <ScreenWithTabBar style={{ paddingBottom: 0 }}>
      <StatusBar hidden={true} />
      <View className="flex-1">
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
            <Text className="text-white mt-4 text-lg">
              Đang tải camera...
            </Text>
          </View>
        )}

        {cameraPermissionGrantedDelayed && isScreenFocused && (
          <>
            <LinearGradient
              colors={["rgba(0,0,0,0.6)", "transparent"]}
              style={styles.topGradient}
              pointerEvents="none"
            />

            <View style={styles.topControls}>
              <TouchableOpacity
                className="bg-black/40 backdrop-blur-sm p-3 rounded-2xl"
                onPress={toggleFlash}
                disabled={isLoading || !isCameraReady}
                style={styles.topControlButton}
              >
                <Ionicons
                  name={flash === "on" ? "flash" : "flash-off"}
                  size={24}
                  color={isLoading || !isCameraReady ? "#9ca3af" : "white"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-black/40 backdrop-blur-sm p-3 rounded-2xl"
                onPress={handleFlipCamera}
                disabled={isLoading || !isCameraReady}
                style={styles.topControlButton}
              >
                <Ionicons
                  name="camera-reverse"
                  size={24}
                  color={isLoading || !isCameraReady ? "#9ca3af" : "white"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.detectionGuide}>
              <View style={styles.detectionFrame}>
                <View style={styles.frameCorner} />
                <View
                  style={[styles.frameCorner, styles.frameCornerTopRight]}
                />
                <View
                  style={[styles.frameCorner, styles.frameCornerBottomLeft]}
                />
                <View
                  style={[styles.frameCorner, styles.frameCornerBottomRight]}
                />

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

            {!isCameraReady && (
              <View style={styles.cameraStatus}>
                <View className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-2xl">
                  <Text className="text-white text-center font-medium">
                    📷 Camera đang khởi động...
                  </Text>
                </View>
              </View>
            )}

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.bottomGradient}
              pointerEvents="none"
            />
          </>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity
            className="items-center"
            onPress={pickImage}
            disabled={isLoading}
            style={styles.sideButton}
          >
            <View
              className="bg-white/95 backdrop-blur-sm h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg mb-2"
              style={styles.galleryButton}
            >
              <TablerIconComponent
                name="photo"
                size={28}
                color={isLoading ? "#9ca3af" : "#a6d2fd"}
                strokeWidth={2}
              />
            </View>
            <Text className="text-white text-xs font-medium">Thư viện</Text>
          </TouchableOpacity>

          <View className="items-center">
            <Animated.View
              style={[
                styles.cameraButtonContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <TouchableOpacity
                className="bg-white/10 h-24 w-24 rounded-full flex items-center justify-center border-4 border-white/30"
                onPress={takePicture}
                disabled={
                  isLoading ||
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
            <Text className="text-white text-xs font-bold mt-2">
              Chụp ảnh
            </Text>
          </View>

          <TouchableOpacity
            className="items-center"
            onPress={() => {
              Alert.alert(
                "🤖 Phân tích AI",
                "Công nghệ AI tiên tiến giúp:\n\n• Phân tích tỷ lệ cơ và ruột\n• Đánh giá sức khỏe tôm\n• Tối ưu chất lượng nuôi trồng\n\nKết quả chính xác trong vài giây!",
                [{ text: "Đã hiểu", style: "default" }],
              );
            }}
            disabled={isLoading}
            style={styles.sideButton}
          >
            <View
              className="bg-white/95 backdrop-blur-sm h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg mb-2"
              style={styles.infoButton}
            >
              <TablerIconComponent
                name="info-circle"
                size={28}
                color={isLoading ? "#9ca3af" : "#a6d2fd"}
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
    left: "auto" as any,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderLeftWidth: 0,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    top: "auto" as any,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: "auto" as any,
    left: "auto" as any,
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