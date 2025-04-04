import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import "../../global.css";
import { SafeAreaView } from "react-native-safe-area-context";
import TablerIconComponent from "@/components/icon";
import { useState } from "react";
import { StatusBar } from "react-native";

type ReactionType = "like" | "heart" | null;

interface Post {
  id: number;
  author: string;
  time: string;
  content: string;
  reaction: ReactionType;
}

export default function Index() {
  const [posts, setPosts] = useState<Post[]>(
    Array.from({ length: 10 }).map((_, index) => ({
      id: index,
      author: "Nguyễn Văn",
      time: "1 giờ trước",
      content:
        "Ngày 12/3, Phòng Cảnh sát Kinh Tế (CSKT) Công an tỉnh An Giang Phối hợp với Thanh tra Sở Nông nghiệp và Phát triển nông thôn để làm rõ công...",
      reaction: null,
    })),
  );

  const toggleLike = (postId: number) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, reaction: post.reaction === "like" ? null : "like" }
          : post,
      ),
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="bg-white"
      >
        <View className="flex-1 flex-col gap-10 px-10 -mx-8">
          <View className="flex flex-row items-center justify-between">
            <View className="flex-1">
              <TablerIconComponent name="user" size={24} />
            </View>

            <View className="flex-2 items-center">
              <Text className="text-2xl font-bold">Tin tức mới nhất</Text>
            </View>

            <View className="flex-1"></View>
          </View>

          {posts.map((post) => (
            <View className="flex flex-col gap-5" key={post.id}>
              <View className="flex flex-row justify-between items-center">
                <View className="flex flex-row items-center gap-3">
                  <TablerIconComponent name="user" size={24} />
                  <View className="flex flex-col">
                    <Text className="text-start text-lg font-semibold">
                      {post.author}
                    </Text>
                    <Text className="text-start text-sm">{post.time}</Text>
                  </View>
                </View>
                <Text className="text-end">
                  <TablerIconComponent name="dots" size={24} />
                </Text>
              </View>

              <Text className="text-start text-sm">{post.content}</Text>

              <Image
                source={require("../../assets/images/cong-an.jpg")}
                className="w-full h-72 object-fill"
              />

              <View className="flex flex-col gap-5">
                <View className="flex flex-row justify-between items-center">
                  <View className="flex flex-row items-center gap-1">
                    <View className="flex flex-row">
                      {post.reaction === "like" && (
                        <TablerIconComponent
                          name="thumb-up"
                          size={18}
                          color="#1877F2"
                        />
                      )}
                      {post.reaction === "heart" && (
                        <TablerIconComponent
                          name="heart"
                          size={18}
                          color="#FF0000"
                        />
                      )}
                      {post.reaction === null && (
                        <TablerIconComponent
                          name="thumb-up"
                          size={18}
                          color="#000000"
                        />
                      )}
                    </View>
                    <Text className="text-xs">
                      {post.reaction === "like" ? "Bạn" : "Chưa ai cả"}
                    </Text>
                  </View>

                  <Text className="text-xs">Chưa có bình luận</Text>
                </View>
                <View className="flex flex-row justify-between items-center px-3">
                  <TouchableOpacity
                    className="flex flex-row gap-2 items-center"
                    onPress={() => toggleLike(post.id)}
                  >
                    <TablerIconComponent
                      name="thumb-up"
                      size={18}
                      color={post.reaction === "like" ? "#1877F2" : undefined}
                    />
                    <Text
                      className={`text-sm ${post.reaction === "like" ? "text-[#1877F2]" : ""}`}
                    >
                      Thích
                    </Text>
                  </TouchableOpacity>

                  <View className="flex flex-row gap-2 items-center">
                    <TablerIconComponent name="message" size={18} />
                    <Text className="text-sm">Bình luận</Text>
                  </View>

                  <View className="flex flex-row gap-2 items-center">
                    <TablerIconComponent name="share-3" size={18} />
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
