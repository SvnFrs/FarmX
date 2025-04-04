import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  StatusBar,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import ViewShot from "react-native-view-shot";
import "../../global.css";
import TablerIconComponent from "@/components/icon";
import ScreenWithTabBar from "@/components/layout/ScreenWithTabBar";

const windowHeight = Dimensions.get("window").height;

export default function CameraScreen() {
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

  // Animated value for the scanning effect
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const scanningAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    if (!mediaLibraryPermission) {
      requestMediaLibraryPermission();
    }
  }, []);

  // Start scanning animation when loading begins, stop when it ends
  useEffect(() => {
    if (isLoading) {
      startScanningAnimation();
    } else {
      stopScanningAnimation();
    }

    return () => {
      stopScanningAnimation();
    };
  }, [isLoading]);

  // Convert base64 to local image URI when analysis result is set
  useEffect(() => {
    if (analysisResult?.mask) {
      createLocalImageFromBase64(analysisResult.mask);
    }
  }, [analysisResult]);

  // Get the actual layout of the displayed image for scanning animation
  const onImageLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setImageLayout({ x, y, width, height });
  };

  // Animation function to create the scanning effect that starts from top and moves downward
  const startScanningAnimation = () => {
    // Reset the animation value
    scanLinePosition.setValue(0);

    // Create the animation sequence that properly scans down and up
    scanningAnimation.current = Animated.loop(
      Animated.sequence([
        // Move the line from top to bottom
        Animated.timing(scanLinePosition, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Small pause at the bottom
        Animated.delay(100),
        // Move the line from bottom to top
        Animated.timing(scanLinePosition, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Small pause at the top
        Animated.delay(100),
      ]),
    );

    // Start the animation
    scanningAnimation.current.start();
  };

  const stopScanningAnimation = () => {
    if (scanningAnimation.current) {
      scanningAnimation.current.stop();
      scanningAnimation.current = null;
    }
  };

  const createLocalImageFromBase64 = async (base64: string) => {
    try {
      const fileUri = FileSystem.cacheDirectory + "mask_image.png";
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setMaskImageUri(fileUri);
    } catch (error) {
      console.error("Error creating local image:", error);
    }
  };

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

  const pickImage = async () => {
    try {
      // No permissions request is necessary for launching the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from gallery");
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
      setIsLoading(true);

      // Read the image and convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Convert blob to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data:image/jpeg;base64, prefix
          resolve(base64data.split(",")[1]);
        };
      });

      console.log("Sending request to backend...");

      // Send to your API with the expected JSON format
      const apiResponse = await fetch("http://192.168.1.6:8081/predict", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: base64,
        }),
      });

      console.log("Response status:", apiResponse.status);

      // Handle the response
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log("Response data:", JSON.stringify(result));

        // Store the result and show the modal
        setAnalysisResult(result);
        setShowResultModal(true);
      } else {
        const errorText = await apiResponse.text();
        console.error("Error response:", errorText);

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
      console.error("Upload error:", error);
      Alert.alert(
        "Error",
        `Failed to connect to analysis server: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveMaskImage = async () => {
    if (!maskImageUri) return;

    try {
      const asset = await MediaLibrary.createAssetAsync(maskImageUri);
      await MediaLibrary.createAlbumAsync("ShrimpAnalysis", asset, false);
      return true;
    } catch (error) {
      console.error("Error saving mask image:", error);
      return false;
    }
  };

  // Function to save both the mask image and the composite overlay
  const saveImages = async () => {
    if (!maskImageUri || !capturedImage) return;

    try {
      setIsSaving(true);

      // First save the mask image
      const maskSaved = await saveMaskImage();

      // Then capture and save the composite view
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("ShrimpAnalysis", asset, false);

        Alert.alert(
          "Success",
          `${maskSaved ? "Mask image and overlay" : "Overlay"} saved to your gallery`,
        );
      } else {
        if (maskSaved) {
          Alert.alert("Partial Success", "Only mask image was saved");
        } else {
          Alert.alert("Error", "Failed to save images");
        }
      }
    } catch (error) {
      console.error("Error saving images:", error);
      Alert.alert("Error", "Failed to save images");
    } finally {
      setIsSaving(false);
    }
  };

  const analyzeShrimpImage = () => {
    if (!capturedImage) return;
    uploadImageForAnalysis(capturedImage);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setMaskImageUri(null);
    setShowResultModal(false);
  };

  const closeResultModal = () => {
    setShowResultModal(false);
  };

  if (!permission || !mediaLibraryPermission) {
    return (
      <ScreenWithTabBar>
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
          <Text>Requesting camera permissions...</Text>
        </SafeAreaView>
      </ScreenWithTabBar>
    );
  }

  if (!permission.granted || !mediaLibraryPermission.granted) {
    return (
      <ScreenWithTabBar>
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
      </ScreenWithTabBar>
    );
  }

  if (capturedImage) {
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

              {/* Scanning line effect - only shown during loading */}
              {isLoading && imageLayout.height > 0 && (
                <>
                  {/* Semi-transparent overlay to indicate processing */}
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: "rgba(0,0,0,0.2)" },
                    ]}
                  />

                  {/* Animated scanning line contained within the image boundaries */}
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        position: "absolute",
                        width: imageLayout.width,
                        left: imageLayout.x,
                        transform: [
                          {
                            translateY: scanLinePosition.interpolate({
                              inputRange: [0, 1],
                              outputRange: [
                                imageLayout.y, // Top of the image
                                imageLayout.y + imageLayout.height - 2, // Bottom of the image (minus line height)
                              ],
                            }),
                          },
                        ],
                      },
                    ]}
                  />

                  {/* Loading text overlay */}
                  <View style={styles.loadingTextContainer}>
                    <Text style={styles.loadingText}>Analyzing image...</Text>
                  </View>
                </>
              )}
            </View>

            {/* Analysis Results information panel */}
            {showResultModal && (
              <View className="absolute top-10 left-0 right-0 bg-black/60 p-4 mx-4 rounded-lg">
                <TouchableOpacity
                  className="absolute top-2 right-2"
                  onPress={closeResultModal}
                >
                  <TablerIconComponent
                    name="x"
                    size={24}
                    color="white"
                    strokeWidth={2}
                  />
                </TouchableOpacity>

                <Text className="text-white text-xl font-bold mb-2">
                  Analysis Results
                </Text>
                <View className="flex-row justify-between">
                  <Text className="text-white text-lg">
                    Meat Ratio: {analysisResult?.ratio_thit.toFixed(2) || 0}
                  </Text>
                  <Text className="text-white text-lg">
                    Gut: {analysisResult?.ratio_ruot.toFixed(2) || 0}
                  </Text>
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

  return (
    <ScreenWithTabBar style={{ paddingBottom: 0 }}>
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
          <View className="flex-1 top-32 items-center">
            <View className="border-2 border-sky-400 border-dotted rounded-lg w-4/5 h-2/5 opacity-70">
              <View className="absolute -top-8 w-full">
                <Text className="text-white text-center bg-black/50 p-1 rounded">
                  Position shrimp within frame
                </Text>
              </View>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Bottom button row with camera and gallery buttons */}
      <View className="absolute bottom-40 left-0 right-0 flex-row justify-between items-center space-x-6 px-5">
        {/* Gallery button */}
        <TouchableOpacity
          className="bg-white h-14 w-14 rounded-full flex items-center justify-center shadow-lg border border-gray-300"
          onPress={pickImage}
        >
          <View className="bg-saltpan-400 h-10 w-10 rounded-full flex items-center justify-center">
            <TablerIconComponent
              name="library-photo"
              size={24}
              color="white"
              strokeWidth={2}
            />
          </View>
        </TouchableOpacity>

        {/* Camera button */}
        <TouchableOpacity
          className="bg-white h-20 w-20 rounded-full flex items-center justify-center shadow-lg border border-gray-300"
          onPress={takePicture}
        >
          <View className="bg-sky-500 h-16 w-16 rounded-full flex items-center justify-center">
            <TablerIconComponent
              name="camera"
              size={30}
              color="white"
              strokeWidth={2}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-transparent h-14 w-14 rounded-full flex items-center justify-center shadow-lg"
          onPress={pickImage}
        ></TouchableOpacity>
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
  scanLine: {
    height: 2,
    backgroundColor: "#00bcd4", // Bright teal color
    shadowColor: "#00bcd4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingTextContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
