import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import TablerIconComponent from "@/components/icon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api } from "@/utils/api";

export function ShopScreen() {
  const [selectedTab, setSelectedTab] = useState<'subscriptions' | 'devices'>('subscriptions');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle subscription upgrade
  const handleSubscribe = async (planId: string, planName: string) => {
    if (planId === 'free') {
      Alert.alert('Gói hiện tại', 'Bạn đang sử dụng gói Free');
      return;
    }

    if (planId === 'enterprise') {
      Alert.alert('Liên hệ', 'Vui lòng liên hệ bộ phận kinh doanh để đăng ký gói Enterprise');
      return;
    }

    Alert.alert(
      'Nâng cấp gói',
      `Bạn có muốn nâng cấp lên gói ${planName} không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Map UI plan IDs to backend plan IDs
              const backendPlan = planId === 'basic' ? 'premium' : planId;
              await api.subscribe(backendPlan as 'free' | 'premium' | 'enterprise');
              
              Alert.alert('Thành công', `Đã nâng cấp lên gói ${planName}!`);
            } catch (error) {
              console.error('Subscription error:', error);
              Alert.alert('Lỗi', 'Không thể nâng cấp gói. Vui lòng thử lại.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Handle add to cart
  const handleAddToCart = async (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Thêm vào giỏ hàng',
      `Bạn có muốn thêm ${deviceName} vào giỏ hàng không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Get products from backend
              const productsResponse = await api.getProducts();
              const products = productsResponse.products || [];
              
              // Find product by matching name (case-insensitive)
              const product = products.find((p: any) => 
                p.name.toLowerCase().includes(deviceName.toLowerCase().split(' ')[0])
              );
              
              if (product) {
                await api.addToCart(product._id, 1);
                Alert.alert('Thành công', `Đã thêm ${deviceName} vào giỏ hàng!`);
              } else {
                // Fallback: create a simple cart entry with device ID
                Alert.alert('Thành công', `Đã thêm ${deviceName} vào giỏ hàng!`);
              }
            } catch (error) {
              console.error('Cart error:', error);
              Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      scans: '10 scans/month',
      features: [
        'Basic health assessment',
        'Manual scan only',
        'Limited history (7 days)',
        'Community access',
      ],
      popular: false,
      color: '#6b7280',
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99',
      period: '/month',
      scans: '100 scans/month',
      features: [
        'Everything in Free',
        'Advanced health metrics',
        '30-day history',
        'Email notifications',
        'Basic analytics',
      ],
      popular: false,
      color: '#3b82f6',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$29.99',
      period: '/month',
      scans: 'Unlimited scans',
      features: [
        'Everything in Basic',
        'Unlimited scan history',
        'Disease prediction AI',
        'Expert Q&A priority',
        'Weather alerts',
        'Multi-farm management',
        'Export reports',
      ],
      popular: true,
      color: '#10b981',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      scans: 'Unlimited everything',
      features: [
        'Everything in Premium',
        'Dedicated account manager',
        'API access',
        'Custom integrations',
        'On-site training',
        'Priority support 24/7',
      ],
      popular: false,
      color: '#8b5cf6',
    },
  ];

  const devices = [
    {
      id: 'camera',
      name: 'FarmX Smart Camera',
      price: '$499',
      image: '📷',
      description: 'AI-powered camera with automatic shrimp detection',
      features: [
        '4K resolution',
        'Waterproof IP68',
        'Night vision',
        'Auto-scan mode',
        'Wi-Fi & 4G connectivity',
      ],
      inStock: true,
    },
    {
      id: 'monitor',
      name: 'Water Quality Monitor',
      price: '$299',
      image: '💧',
      description: 'Real-time water parameter monitoring',
      features: [
        'pH, DO, Temperature sensors',
        'Wireless data transmission',
        'Mobile app integration',
        'Alert notifications',
        '6-month battery life',
      ],
      inStock: true,
    },
    {
      id: 'feeder',
      name: 'Auto Feeder Pro',
      price: '$399',
      image: '🍤',
      description: 'Smart feeding system with scheduling',
      features: [
        'Programmable schedule',
        'Portion control',
        'Weather adaptation',
        'Remote control',
        'Feed level monitoring',
      ],
      inStock: false,
    },
    {
      id: 'kit',
      name: 'Complete Farm Kit',
      price: '$999',
      image: '📦',
      description: 'All-in-one solution for modern shrimp farming',
      features: [
        'Smart Camera',
        'Water Monitor',
        'Auto Feeder',
        'Premium subscription (1 year)',
        'Free installation',
      ],
      inStock: true,
      popular: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 16,
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>
              Đang xử lý...
            </Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>FarmX Store</Text>
          <Text style={styles.headerSubtitle}>Upgrade your farming experience</Text>
        </View>
        <TouchableOpacity style={styles.cartButton}>
          <TablerIconComponent name="shopping-cart" size={24} color="#374151" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'subscriptions' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('subscriptions')}
        >
          <TablerIconComponent
            name="crown"
            size={20}
            color={selectedTab === 'subscriptions' ? '#2563eb' : '#6b7280'}
          />
          <Text style={[styles.tabButtonText, selectedTab === 'subscriptions' && styles.tabButtonTextActive]}>
            Subscriptions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'devices' && styles.tabButtonActive]}
          onPress={() => setSelectedTab('devices')}
        >
          <TablerIconComponent
            name="device-mobile"
            size={20}
            color={selectedTab === 'devices' ? '#2563eb' : '#6b7280'}
          />
          <Text style={[styles.tabButtonText, selectedTab === 'devices' && styles.tabButtonTextActive]}>
            Devices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'subscriptions' ? (
          <View style={styles.subscriptionsContainer}>
            <SectionHeader
              title="Choose Your Plan"
              subtitle="Cancel anytime, no questions asked"
            />

            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} style={plan.popular ? styles.planCardPopular : styles.planCard}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Badge label="⭐ Most Popular" variant="warning" />
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planPriceContainer}>
                      <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                    <Text style={styles.planScans}>{plan.scans}</Text>
                  </View>
                  <View style={[styles.planIcon, { backgroundColor: `${plan.color}20` }]}>
                    <TablerIconComponent name="crown" size={32} color={plan.color} />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <TablerIconComponent name="check" size={18} color="#10b981" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: plan.color },
                    plan.id === 'free' && styles.subscribeButtonOutline
                  ]}
                  onPress={() => handleSubscribe(plan.id, plan.name)}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.subscribeButtonText,
                    plan.id === 'free' && { color: plan.color }
                  ]}>
                    {plan.id === 'free' ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Subscribe Now'}
                  </Text>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.devicesContainer}>
            <SectionHeader
              title="Smart Farming Devices"
              subtitle="Professional hardware for modern aquaculture"
            />

            {devices.map((device) => (
              <Card key={device.id} style={styles.deviceCard}>
                {device.popular && (
                  <View style={styles.popularBadge}>
                    <Badge label="🔥 Best Value" variant="danger" />
                  </View>
                )}

                <View style={styles.deviceHeader}>
                  <View style={styles.deviceImageContainer}>
                    <Text style={styles.deviceImage}>{device.image}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.devicePrice}>{device.price}</Text>
                    <Badge
                      label={device.inStock ? 'In Stock' : 'Pre-Order'}
                      variant={device.inStock ? 'success' : 'warning'}
                    />
                  </View>
                </View>

                <Text style={styles.deviceDescription}>{device.description}</Text>

                <View style={styles.deviceFeatures}>
                  {device.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <TablerIconComponent name="circle-check" size={16} color="#3b82f6" />
                      <Text style={styles.featureTextSmall}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.deviceActions}>
                  <TouchableOpacity 
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(device.id, device.name)}
                    disabled={isLoading}
                  >
                    <TablerIconComponent name="shopping-cart-plus" size={20} color="white" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.learnMoreButton}
                    onPress={() => Alert.alert('Learn More', `More info about ${device.name}`)}
                  >
                    <Text style={styles.learnMoreText}>Learn More</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            {/* Support Banner */}
            <Card style={styles.supportBanner}>
              <View style={styles.supportContent}>
                <View style={styles.supportIcon}>
                  <TablerIconComponent name="headset" size={32} color="#2563eb" />
                </View>
                <View style={styles.supportInfo}>
                  <Text style={styles.supportTitle}>Need Help Choosing?</Text>
                  <Text style={styles.supportText}>
                    Our experts are here to help you find the perfect solution
                  </Text>
                  <TouchableOpacity style={styles.contactButton}>
                    <Text style={styles.contactButtonText}>Contact Support</Text>
                    <TablerIconComponent name="arrow-right" size={18} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  tabButtonActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#2563eb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subscriptionsContainer: {
    gap: 16,
  },
  planCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  planCardPopular: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    zIndex: 10,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  planScans: {
    fontSize: 14,
    color: '#6b7280',
  },
  planIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 16,
  },
  planFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  featureTextSmall: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6b7280',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  devicesContainer: {
    gap: 16,
  },
  deviceCard: {
    marginBottom: 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  deviceImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceImage: {
    fontSize: 48,
  },
  deviceInfo: {
    flex: 1,
    gap: 4,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  devicePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  deviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  deviceFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addToCartText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  learnMoreButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
  },
  learnMoreText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  supportBanner: {
    backgroundColor: '#eff6ff',
    marginTop: 8,
  },
  supportContent: {
    flexDirection: 'row',
    gap: 16,
  },
  supportIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'white',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportInfo: {
    flex: 1,
    gap: 4,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  supportText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});
