import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import TablerIconComponent from "@/components/icon";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import { AnalysisResultModal } from "@/components/ui/AnalysisResultModal";
import { PondSelectorModal } from "@/components/ui/PondSelectorModal";
import ScreenWithTabBar from "@/components/layout/ScreenWithTabBar";
import { api } from "@/utils/api";

export function ResultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Parse the analysis result from params
  const imageUri = params.imageUri as string;
  const maskUri = params.maskUri as string;
  const ratioThit = parseFloat(params.ratioThit as string);
  const ratioRuot = parseFloat(params.ratioRuot as string);

  const [showMaskOverlay, setShowMaskOverlay] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPondSelector, setShowPondSelector] = useState(false);
  const [isSavingToPond, setIsSavingToPond] = useState(false);

  const maskToggleAnim = useRef(new Animated.Value(1)).current;
  const viewShotRef = useRef<ViewShot>(null);

  const muscleToGutRatio = (ratioThit / ratioRuot).toFixed(2);

  // Animate mask toggle
  useEffect(() => {
    Animated.timing(maskToggleAnim, {
      toValue: showMaskOverlay ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showMaskOverlay]);

  const getHealthStatus = () => {
    const ratio = parseFloat(muscleToGutRatio);
    if (ratio >= 3.5) {
      return {
        label: "Tuyệt vời",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        icon: "shield-check",
      };
    } else if (ratio >= 2.5) {
      return {
        label: "Bình thường",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
        icon: "alert-triangle",
      };
    } else {
      return {
        label: "Cần cải thiện",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
        icon: "alert-circle",
      };
    }
  };

  const healthStatus = getHealthStatus();

  const analysisResult = {
    mask: maskUri,
    ratio_thit: ratioThit,
    ratio_ruot: ratioRuot,
  };

  const saveImages = async () => {
    try {
      setIsSaving(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Từ chối quyền",
          "Không thể lưu ảnh mà không có quyền truy cập thư viện phương tiện"
        );
        return;
      }

      // Save the mask image
      if (maskUri) {
        const maskAsset = await MediaLibrary.createAssetAsync(maskUri);
        await MediaLibrary.createAlbumAsync("ShrimpAnalysis", maskAsset, false);
      }

      // Capture and save the combined view
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync("ShrimpAnalysis", asset, false);

        Alert.alert(
          "Thành công",
          "Kết quả phân tích đã được lưu vào thư viện của bạn"
        );
      }
    } catch (error) {
      console.error("Failed to save images", error);
      Alert.alert("Lỗi", "Không thể lưu ảnh");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    router.back();
  };

  const handleSaveToPond = async (pondId: string, pondName: string, farmName: string) => {
    try {
      setIsSavingToPond(true);
      
      // Create scan result in backend
      await api.createScan({
        metrics: {
          ratio_thit: ratioThit,
          ratio_ruot: ratioRuot,
          muscle_gut_ratio: parseFloat(muscleToGutRatio),
        },
        healthScore: ratioThit >= 70 ? 80 : ratioThit >= 50 ? 60 : 40,
        diseasePrediction: {
          disease: healthStatus.label,
          confidence: 85,
          recommendations: [
            `Tỷ lệ thịt/ruột: ${muscleToGutRatio}:1`,
            `Sức khỏe: ${healthStatus.label}`,
          ],
        },
        imageUrl: imageUri,
        saveToPondId: pondId,
        deviceId: 'mobile_camera',
      });
      
      Alert.alert(
        'Thành công',
        `Kết quả đã được lưu vào ao "${pondName}" thuộc nông trại "${farmName}"`,
        [
          {
            text: 'Xem chi tiết',
            onPress: () => router.push('/(tabs)/manage'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to save scan to pond:', error);
      Alert.alert('Lỗi', 'Không thể lưu kết quả vào ao');
    } finally {
      setIsSavingToPond(false);
    }
  };

  return (
    <ScreenWithTabBar>
      <SafeAreaView className="flex-1 bg-black" edges={['top']}>
        {/* Background Image Layer */}
        <View style={StyleSheet.absoluteFill}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "jpg", quality: 0.9 }}
            style={{ flex: 1 }}
          >
            {/* Image Display */}
            <View style={{ flex: 1 }}>
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />

              {/* Mask Overlay */}
              {maskUri && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { opacity: maskToggleAnim },
                  ]}
                  pointerEvents="none"
                >
                  <Image
                    source={{ uri: maskUri }}
                    style={[
                      StyleSheet.absoluteFill,
                      { opacity: 0.7, width: "100%", height: "100%" },
                    ]}
                    resizeMode="contain"
                  />
                </Animated.View>
              )}

              {/* Overlay Gradient for better text readability */}
              <LinearGradient
                colors={["rgba(0,0,0,0.7)", "transparent", "transparent", "rgba(0,0,0,0.8)"]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </View>
          </ViewShot>
        </View>

        {/* Interactive Controls Layer */}
        <View style={{ flex: 1 }} pointerEvents="box-none">
          {/* Top Controls */}
          <View style={styles.topControls} pointerEvents="box-none">
            <TouchableOpacity
              className="bg-black/70 backdrop-blur-md px-4 py-3 rounded-2xl"
              onPress={() => setShowMaskOverlay(!showMaskOverlay)}
              style={styles.maskToggleButton}
              activeOpacity={0.8}
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
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Main Ratio Display - Center of screen */}
          <View style={styles.centerRatio} pointerEvents="box-none">
            <View className="bg-black/80 backdrop-blur-xl px-8 py-6 rounded-3xl border-2 border-white/20" pointerEvents="none">
              <View className="items-center mb-4">
                <Text className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-2">
                  Muscle : Gut Ratio
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-6xl font-black">
                    {muscleToGutRatio}
                  </Text>
                  <Text className="text-white/80 text-2xl font-bold ml-2">: 1</Text>
                </View>
              </View>

              {/* Health Status Badge */}
              <View
                className="flex-row items-center justify-center px-6 py-3 rounded-2xl"
                style={{ backgroundColor: healthStatus.bgColor }}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: healthStatus.color }}
                >
                  <TablerIconComponent
                    name={healthStatus.icon}
                    size={18}
                    color="white"
                    strokeWidth={2.5}
                  />
                </View>
                <Text
                  className="text-lg font-bold"
                  style={{ color: healthStatus.color }}
                >
                  {healthStatus.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Action Bar */}
          <View style={styles.bottomActions} pointerEvents="box-none">
            <View className="bg-black/80 backdrop-blur-xl rounded-3xl px-6 py-4 w-full border border-white/10">
              <View className="flex-row items-center justify-between gap-3">
                {/* Retake Button */}
                <TouchableOpacity
                  className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl"
                  onPress={handleRetake}
                  disabled={isSaving || isSavingToPond}
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <TablerIconComponent
                    name="arrow-left"
                    size={24}
                    color="white"
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>

                {/* View Details Button */}
                <TouchableOpacity
                  className="flex-1 bg-blue-500 py-4 rounded-2xl flex-row items-center justify-center"
                  onPress={() => setShowResultModal(true)}
                  disabled={isSaving || isSavingToPond}
                  style={styles.primaryButton}
                  activeOpacity={0.7}
                >
                  <TablerIconComponent
                    name="chart-dots"
                    size={22}
                    color="white"
                    strokeWidth={2.5}
                  />
                  <Text className="text-white font-bold text-base ml-2">
                    Chi tiết
                  </Text>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                  className="bg-green-500 p-4 rounded-2xl"
                  onPress={saveImages}
                  disabled={isSaving || isSavingToPond}
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <TablerIconComponent
                      name="device-floppy"
                      size={24}
                      color="white"
                      strokeWidth={2.5}
                    />
                  )}
                </TouchableOpacity>
                
                {/* Save to Pond Button */}
                <TouchableOpacity
                  className="bg-blue-600 p-4 rounded-2xl"
                  onPress={() => setShowPondSelector(true)}
                  disabled={isSaving || isSavingToPond}
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  {isSavingToPond ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <TablerIconComponent
                      name="droplet-plus"
                      size={24}
                      color="white"
                      strokeWidth={2.5}
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick Stats Row */}
              <View className="flex-row justify-around mt-4 pt-4 border-t border-white/10">
                <View className="items-center">
                  <Text className="text-white/60 text-xs font-medium mb-1">
                    Muscle
                  </Text>
                  <Text className="text-white text-lg font-bold">
                    {(ratioThit * 100).toFixed(1)}%
                  </Text>
                </View>
                <View className="w-px h-10 bg-white/20" />
                <View className="items-center">
                  <Text className="text-white/60 text-xs font-medium mb-1">
                    Gut
                  </Text>
                  <Text className="text-white text-lg font-bold">
                    {(ratioRuot * 100).toFixed(1)}%
                  </Text>
                </View>
                <View className="w-px h-10 bg-white/20" />
                <View className="items-center">
                  <Text className="text-white/60 text-xs font-medium mb-1">
                    Status
                  </Text>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: healthStatus.bgColor }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: healthStatus.color }}
                    >
                      {healthStatus.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Modals - Outside the interactive layer */}
        <AnalysisResultModal
          visible={showResultModal}
          onClose={() => setShowResultModal(false)}
          result={analysisResult}
          onSave={saveImages}
          isSaving={isSaving}
        />
        
        <PondSelectorModal
          visible={showPondSelector}
          onClose={() => setShowPondSelector(false)}
          onSelectPond={handleSaveToPond}
        />
      </SafeAreaView>
    </ScreenWithTabBar>
  );
}

const styles = StyleSheet.create({
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 60,
    alignItems: "flex-start",
  },
  maskToggleButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  centerRatio: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  bottomActions: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  actionButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  primaryButton: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
});