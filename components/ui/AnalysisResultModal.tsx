import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Modal } from './Modal';
import TablerIconComponent from '@/components/icon';
import { LinearGradient } from 'expo-linear-gradient';

interface AnalysisResult {
  mask: string;
  ratio_thit: number;
  ratio_ruot: number;
}

interface AnalysisResultModalProps {
  visible: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  onSave?: () => void;
  isSaving?: boolean;
}

const getHealthStatus = (muscleRatio: number, gutRatio: number) => {
  const muscleToGutRatio = muscleRatio / gutRatio;

  if (muscleToGutRatio >= 3.5) {
    return {
      status: 'Tuyệt vời',
      description: 'Tôm có sức khỏe rất tốt',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      icon: 'shield-check',
      gradient: ['#10b981', '#059669'],
    };
  } else if (muscleToGutRatio >= 2.5) {
    return {
      status: 'Bình thường',
      description: 'Cần theo dõi thêm',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      icon: 'alert-triangle',
      gradient: ['#f59e0b', '#d97706'],
    };
  } else {
    return {
      status: 'Cần cải thiện',
      description: 'Nên điều chỉnh chế độ nuôi',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      icon: 'alert-circle',
      gradient: ['#ef4444', '#dc2626'],
    };
  }
};

export function AnalysisResultModal({
  visible,
  onClose,
  result,
  onSave,
  isSaving = false,
}: AnalysisResultModalProps) {
  // Return early if not visible or no result
  if (!visible || !result) return null;

  const healthStatus = getHealthStatus(result.ratio_thit, result.ratio_ruot);
  const muscleToGutRatio = (result.ratio_thit / result.ratio_ruot).toFixed(2);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Kết quả phân tích"
      headerIcon="chart-dots"
      headerIconColor="#2563eb"
      closeOnBackdropPress={!isSaving}
    >
      <View className="px-6 pt-4">
        {/* Health Status Card */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{
            backgroundColor: healthStatus.bgColor,
            borderWidth: 2,
            borderColor: healthStatus.color,
          }}
        >
          <View className="flex-row items-center mb-4">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: healthStatus.color }}
            >
              <TablerIconComponent
                name={healthStatus.icon}
                size={28}
                color="white"
                strokeWidth={2.5}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-2xl font-bold mb-1"
                style={{ color: healthStatus.color }}
              >
                {healthStatus.status}
              </Text>
              <Text className="text-sm font-medium text-gray-700">
                {healthStatus.description}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-white/30 rounded-full overflow-hidden">
            <LinearGradient
              colors={healthStatus.gradient as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${Math.min((parseFloat(muscleToGutRatio) / 5) * 100, 100)}%`,
              }}
            />
          </View>
        </View>

        {/* Metrics Grid */}
        <View className="gap-3 mb-6">
          {/* Main Ratio Card */}
          <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-200">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-blue-500 items-center justify-center mr-3">
                  <TablerIconComponent
                    name="calculator"
                    size={20}
                    color="white"
                    strokeWidth={2.5}
                  />
                </View>
                <View>
                  <Text className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    Tỷ lệ chính
                  </Text>
                  <Text className="text-sm font-medium text-gray-700">
                    Muscle : Gut Ratio
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-4xl font-black text-blue-600">
                  {muscleToGutRatio}
                </Text>
                <Text className="text-sm font-bold text-blue-500">: 1</Text>
              </View>
            </View>
          </View>

          {/* Muscle Ratio Card */}
          <View className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-4 border border-red-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-xl bg-red-500 items-center justify-center mr-3">
                  <TablerIconComponent
                    name="meat"
                    size={24}
                    color="white"
                    strokeWidth={2}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium text-red-600 mb-1">
                    Muscle Ratio
                  </Text>
                  <Text className="text-base font-bold text-gray-900">
                    Tỷ lệ cơ
                  </Text>
                </View>
              </View>
              <View className="items-center bg-white/50 rounded-xl px-4 py-2">
                <Text className="text-3xl font-black text-red-600">
                  {(result.ratio_thit * 100).toFixed(1)}
                </Text>
                <Text className="text-xs font-bold text-red-500">%</Text>
              </View>
            </View>
          </View>

          {/* Gut Ratio Card */}
          <View className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-4 border border-orange-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-xl bg-orange-500 items-center justify-center mr-3">
                  <TablerIconComponent
                    name="circle-dot"
                    size={24}
                    color="white"
                    strokeWidth={2}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium text-orange-600 mb-1">
                    Gut Ratio
                  </Text>
                  <Text className="text-base font-bold text-gray-900">
                    Tỷ lệ ruột
                  </Text>
                </View>
              </View>
              <View className="items-center bg-white/50 rounded-xl px-4 py-2">
                <Text className="text-3xl font-black text-orange-600">
                  {(result.ratio_ruot * 100).toFixed(1)}
                </Text>
                <Text className="text-xs font-bold text-orange-500">%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg bg-blue-100 items-center justify-center mr-3">
              <TablerIconComponent name="bulb" size={18} color="#2563eb" />
            </View>
            <Text className="text-base font-bold text-gray-900">
              Khuyến nghị
            </Text>
          </View>
          <View className="space-y-2">
            {getRecommendations(parseFloat(muscleToGutRatio)).map((rec, index) => (
              <View key={index} className="flex-row items-start">
                <View className="w-5 h-5 rounded-full bg-blue-100 items-center justify-center mr-2 mt-0.5">
                  <TablerIconComponent name="check" size={14} color="#2563eb" />
                </View>
                <Text className="flex-1 text-sm text-gray-700 leading-5">{rec}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={onClose}
            disabled={isSaving}
            className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
            activeOpacity={0.7}
          >
            <Text className="text-gray-700 font-bold text-base">Đóng</Text>
          </TouchableOpacity>

          {onSave && (
            <TouchableOpacity
              onPress={onSave}
              disabled={isSaving}
              className="flex-1 bg-blue-500 py-4 rounded-2xl items-center"
              activeOpacity={0.7}
              style={{ opacity: isSaving ? 0.6 : 1 }}
            >
              <View className="flex-row items-center">
                <TablerIconComponent
                  name="device-floppy"
                  size={20}
                  color="white"
                  strokeWidth={2.5}
                />
                <Text className="text-white font-bold text-base ml-2">
                  {isSaving ? 'Đang lưu...' : 'Lưu kết quả'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getRecommendations(ratio: number): string[] {
  if (ratio >= 3.5) {
    return [
      'Duy trì chế độ dinh dưỡng hiện tại',
      'Tiếp tục theo dõi chất lượng nước',
      'Tăng cường kiểm tra sức khỏe định kỳ',
    ];
  } else if (ratio >= 2.5) {
    return [
      'Cải thiện chất lượng thức ăn',
      'Tăng cường kiểm soát chất lượng nước',
      'Theo dõi sát tình trạng sức khỏe',
      'Cân nhắc điều chỉnh mật độ nuôi',
    ];
  } else {
    return [
      'Cần cải thiện chế độ dinh dưỡng ngay',
      'Kiểm tra và xử lý nước ao',
      'Giảm mật độ tôm trong ao',
      'Tham khảo ý kiến chuyên gia',
      'Tăng cường sục khí',
    ];
  }
}