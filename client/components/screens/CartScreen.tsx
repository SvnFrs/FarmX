import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import TablerIconComponent from "@/components/icon";
import { Card } from "@/components/ui/Card";
import { api } from "@/utils/api";

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    inStock: boolean;
  };
  qty: number;
  itemTotal: number;
}

interface CartData {
  items: CartItem[];
  total: number;
}

export function CartScreen() {
  const [cart, setCart] = useState<CartData>({ items: [], total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setIsRefreshing(true);
      const cartData = await api.getCart();
      setCart(cartData.cart || { items: [], total: 0 });
    } catch (error) {
      console.error("Load cart error:", error);
      Alert.alert("Lỗi", "Không thể tải giỏ hàng");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemoveItem(productId);
      return;
    }

    try {
      setIsLoading(true);
      await api.addToCart(productId, newQty);
      await loadCart();
    } catch (error) {
      console.error("Update quantity error:", error);
      Alert.alert("Lỗi", "Không thể cập nhật số lượng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    Alert.alert("Xóa sản phẩm", "Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);
            await api.removeFromCart(productId);
            await loadCart();
            Alert.alert("Thành công", "Đã xóa sản phẩm khỏi giỏ hàng");
          } catch (error) {
            console.error("Remove item error:", error);
            Alert.alert("Lỗi", "Không thể xóa sản phẩm");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      Alert.alert("Giỏ hàng trống", "Vui lòng thêm sản phẩm vào giỏ hàng");
      return;
    }

    Alert.alert(
      "Xác nhận thanh toán",
      `Tổng tiền: $${cart.total.toFixed(2)}\n\nBạn có muốn tiếp tục thanh toán?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Thanh toán",
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await api.checkout();
              Alert.alert(
                "Thành công",
                "Đơn hàng đã được đặt thành công!",
                [
                  {
                    text: "OK",
                    onPress: () => loadCart(), // Reload cart after checkout
                  },
                ]
              );
            } catch (error) {
              console.error("Checkout error:", error);
              Alert.alert("Lỗi", "Không thể thanh toán. Vui lòng thử lại.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearCart = async () => {
    if (cart.items.length === 0) return;

    Alert.alert("Xóa toàn bộ giỏ hàng", "Bạn có chắc muốn xóa tất cả sản phẩm?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa tất cả",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);
            await api.clearCart();
            await loadCart();
            Alert.alert("Thành công", "Đã xóa toàn bộ giỏ hàng");
          } catch (error) {
            console.error("Clear cart error:", error);
            Alert.alert("Lỗi", "Không thể xóa giỏ hàng");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "VND") {
      return `${price.toLocaleString("vi-VN")}₫`;
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Đang xử lý...</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        {cart.items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart} disabled={isLoading}>
            <TablerIconComponent name="trash" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={loadCart} />
        }
      >
        {cart.items.length === 0 ? (
          // Empty State
          <View style={styles.emptyContainer}>
            <TablerIconComponent name="shopping-cart-off" size={80} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptySubtitle}>
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </Text>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            <View style={styles.itemsContainer}>
              {cart.items.map((item) => (
                <Card key={item.product._id} style={styles.cartItem}>
                  <View style={styles.itemContent}>
                    {/* Product Icon */}
                    <View style={styles.productIcon}>
                      <TablerIconComponent name="package" size={32} color="#2563eb" />
                    </View>

                    {/* Product Info */}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product.name}</Text>
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.product.description}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {formatPrice(item.product.price, item.product.currency)}
                      </Text>
                      {!item.product.inStock && (
                        <Text style={styles.outOfStock}>Hết hàng</Text>
                      )}
                    </View>

                    {/* Remove Button */}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.product._id)}
                      disabled={isLoading}
                    >
                      <TablerIconComponent name="x" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Quantity Controls */}
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Số lượng:</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleUpdateQuantity(item.product._id, item.qty - 1)}
                        disabled={isLoading}
                      >
                        <TablerIconComponent name="minus" size={16} color="#6b7280" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleUpdateQuantity(item.product._id, item.qty + 1)}
                        disabled={isLoading}
                      >
                        <TablerIconComponent name="plus" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemTotal}>
                      {formatPrice(item.itemTotal, item.product.currency)}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>

            {/* Cart Summary */}
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Tổng cộng</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính:</Text>
                <Text style={styles.summaryValue}>${cart.total.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
                <Text style={styles.summaryValueFree}>Miễn phí</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.totalLabel}>Tổng tiền:</Text>
                <Text style={styles.totalValue}>${cart.total.toFixed(2)}</Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Checkout Button */}
      {cart.items.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.checkoutButton, isLoading && styles.checkoutButtonDisabled]}
            onPress={handleCheckout}
            disabled={isLoading}
          >
            <TablerIconComponent name="credit-card" size={20} color="#ffffff" />
            <Text style={styles.checkoutButtonText}>
              Thanh toán (${cart.total.toFixed(2)})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingBox: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  itemsContainer: {
    gap: 12,
  },
  cartItem: {
    padding: 16,
  },
  itemContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  productIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },
  outOfStock: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  quantityLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    minWidth: 24,
    textAlign: "center",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  summaryCard: {
    marginTop: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  summaryValueFree: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  summaryTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563eb",
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
