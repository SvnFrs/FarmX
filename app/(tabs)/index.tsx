import { Image, ScrollView, Text, View } from "react-native";
import "../../global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="bg-white"
      >
        <View className="flex-1 flex-col gap-10 px-10 -mx-8">
          <View className="flex flex-row items-center justify-between">
            <View className="flex-1">
              <FontAwesome size={28} name="user" />
            </View>

            <View className="flex-2 items-center">
              <Text className="text-2xl font-bold">Tin tức mới nhất</Text>
            </View>

            <View className="flex-1"></View>
          </View>

          {Array.from({ length: 10 }).map((_, index) => (
            <View className="flex flex-col gap-5" key={index}>
              <View className="flex flex-row justify-between items-center">
                <View className="flex flex-row items-center gap-3">
                  <FontAwesome size={36} name="user" />
                  <View className="flex flex-col gap-1">
                    <Text className="text-start text-lg font-semibold">
                      Nguyễn Văn
                    </Text>
                    <Text className="text-start text-sm">1 giờ trước</Text>
                  </View>
                </View>
                <Text className="text-end">
                  <FontAwesome size={28} name="bookmark" />
                </Text>
              </View>

              <Text className="text-start text-sm">
                Ngày 12/3, Phòng Cảnh sát Kinh Tế (CSKT) Công an tỉnh An Giang
                Phối hợp với Thanh tra Sở Nông nghiệp và Phát triển nông thôn để
                làm rõ công...
              </Text>

              <Image
                source={require("../../assets/images/cong-an.jpg")}
                className="w-full h-72 object-fill"
              />

              <View className="flex flex-col gap-5">
                <View className="flex flex-row justify-between items-center">
                  <View className="flex flex-row items-center gap-2">
                    <View className="flex flex-row">
                      <FontAwesome size={18} name="star" />
                      <FontAwesome size={18} name="heart" />
                    </View>
                    <Text className="text-xs">nguyenvan và 3 người khác</Text>
                  </View>

                  <Text className="text-xs">5 bình luận</Text>
                </View>
                <View className="flex flex-row justify-between items-center">
                  <View className="flex flex-row gap-2 items-center">
                    <FontAwesome size={20} name="heart" />
                    <Text className="text-sm">Thích</Text>
                  </View>

                  <View className="flex flex-row gap-2 items-center">
                    <FontAwesome size={20} name="comment" />
                    <Text className="text-sm">Bình luận</Text>
                  </View>

                  <View className="flex flex-row gap-2 items-center">
                    <FontAwesome size={20} name="share" />
                    <Text className="text-sm">Chia sẻ</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
