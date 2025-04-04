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
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="bg-white"
      >
        <View className="flex-1 flex-col gap-10 px-10 -mx-8">
          <View className="flex-row justify-between items-center bg-gray-200 rounded-3xl px-4 py-4">
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
            <View className="flex flex-row gap-5">
              <Text className="text-2xl font-bold text-start">
                Danh mục sản phẩm
              </Text>

              <FontAwesome size={28} name="user" />
            </View>

            <View className="my-3 flex-row flex-wrap justify-start">
              <View className="flex flex-col gap-2 w-1/3 p-1">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-4">
                  <Image
                    source={require("../../assets/images/food.jpg")}
                    className="w-20 h-20 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Cá cảnh - Tép cảnh</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-4">
                  <Image
                    source={require("../../assets/images/food.jpg")}
                    className="w-20 h-20 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Cá cảnh - Tép cảnh</Text>
              </View>

              <View className="flex flex-col gap-2 w-1/3 p-1">
                <TouchableOpacity className="flex-row items-center justify-center rounded-3xl px-4 py-4">
                  <Image
                    source={require("../../assets/images/food.jpg")}
                    className="w-20 h-20 object-fill"
                  />
                </TouchableOpacity>

                <Text className="text-sm">Cá cảnh - Tép cảnh</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
