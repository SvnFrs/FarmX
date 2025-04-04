import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import TablerIconComponent from "@/components/icon";

export default function Shop() {
  return (
    <SafeAreaView className="flex-1 bg-white mb-28" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="bg-white"
      >
        <View className="flex-1 flex-col gap-5 px-10 -mx-8">
          <View className="flex-row justify-between items-center bg-gray-200 rounded-3xl px-4 py-2">
            <View className="flex-1 flex-row items-center gap-2">
              <TablerIconComponent name="user" size={24} />

              <TextInput
                className="flex-1 mx-1 text-base"
                placeholder="Bạn muốn tìm gì?"
                placeholderTextColor={"gray"}
                style={{
                  textAlignVertical: "center",
                  paddingVertical: 0,
                  height: 24, // Match the icon height
                }}
              />
            </View>

            <TouchableOpacity className="flex-row items-center mr-1">
              <Ionicons name="search-sharp" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <View className="py-2">
            <Text className="text-3xl font-bold text-start">
              Mua hàng online
            </Text>
          </View>

          <View className="flex-1 flex-col">
            <View className="flex flex-row items-center gap-3">
              <Text className="text-2xl font-bold text-start">
                Danh mục sản phẩm
              </Text>

              <TablerIconComponent name="arrow-right" size={24} />
            </View>

            <View className="my-3 flex-row flex-wrap justify-start">
              <View className="flex flex-col gap-2 w-1/3 p-1 items-center">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                  <Image
                    source={require("../../assets/images/shop/ca-canh.png")}
                    className="w-20 h-20 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Cá cảnh - Tép cảnh</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1 items-center">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                  <Image
                    source={require("../../assets/images/shop/tang-trong.png")}
                    className="w-20 h-20 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Tăng trọng</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1 items-center">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                  <Image
                    source={require("../../assets/images/shop/vitamin.png")}
                    className="w-20 h-20 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Vitamin tiêu hóa</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1 items-center">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                  <Image
                    source={require("../../assets/images/shop/diet-khuan.png")}
                    className="w-20 h-20 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Diệt khuẩn tảo</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1 items-center">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                  <Image
                    source={require("../../assets/images/shop/tom-the.png")}
                    className="w-16 h-16 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Tôm thẻ giống</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1 items-center">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                  <Image
                    source={require("../../assets/images/shop/xet-nghiem.png")}
                    className="w-16 h-16 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Gói xét nghiệm LAB</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1 items-center">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                  <Image
                    source={require("../../assets/images/shop/ho-tro.png")}
                    className="w-16 h-16 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Hỗ trợ miễn dịch</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1 items-center">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                  <Image
                    source={require("../../assets/images/shop/xu-ly.png")}
                    className="w-16 h-16 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Xử lý </Text>
              </View>
            </View>

            <View className="flex flex-row items-center gap-3 pt-2">
              <Text className="text-2xl font-bold text-start">
                Ưu đãi giảm giá
              </Text>

              <TablerIconComponent name="arrow-right" size={24} />
            </View>

            <View className="flex flex-row gap-2 w-full p-1 items-center">
              <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-2">
                <Image
                  source={require("../../assets/images/shop/ho-tro.png")}
                  className="w-20 h-20 object-fill"
                />
              </TouchableOpacity>

              <View className="flex flex-col">
                <Text className="text-base font-bold">Giảm 20% đơn hàng</Text>
                <Text className="text-sm">Hỗ trợ miễn dịch</Text>

                <View className="flex flex-row items-center gap-2 mt-2">
                  <TablerIconComponent name="square-plus" size={24} />
                  <Text className="text-sm">Ưu đãi hết hạn trong 23p</Text>
                  <TablerIconComponent name="direction-sign" size={24} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
