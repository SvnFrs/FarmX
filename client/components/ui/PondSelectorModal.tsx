/**
 * Pond Selector Modal
 * Allows user to select a pond to save scan results
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import TablerIconComponent from '@/components/icon';
import { api, type Farm, type Pond } from '@/utils/api';

interface PondSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPond: (pondId: string, pondName: string, farmName: string) => void;
}

export function PondSelectorModal({ visible, onClose, onSelectPond }: PondSelectorModalProps) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all farms
      const farmsResponse = await api.getFarms();
      const apiFarms = farmsResponse.farms || [];
      setFarms(apiFarms);
      
      // Fetch ponds for all farms
      const allPonds: Pond[] = [];
      for (const farm of apiFarms) {
        try {
          const pondsResponse = await api.getPonds(farm._id);
          if (pondsResponse.ponds) {
            allPonds.push(...pondsResponse.ponds);
          }
        } catch (error) {
          console.error(`Failed to fetch ponds for farm ${farm._id}:`, error);
        }
      }
      setPonds(allPonds);
    } catch (error: any) {
      console.error('Failed to load farms and ponds:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách ao');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPond = (pond: Pond) => {
    const farm = farms.find(f => f._id === pond.farm);
    onSelectPond(pond._id, pond.name, farm?.name || 'Unknown Farm');
    onClose();
  };

  // Group ponds by farm
  const pondsByFarm = farms.map(farm => ({
    farm,
    ponds: ponds.filter(p => p.farm === farm._id),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '80%',
          paddingTop: 24,
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>
              Chọn ao để lưu kết quả
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: '#f1f5f9',
                padding: 8,
                borderRadius: 12,
              }}
            >
              <TablerIconComponent name="x" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={{ marginTop: 16, color: '#64748b' }}>Đang tải...</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: '90%' }}>
              {pondsByFarm.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <TablerIconComponent name="home-off" size={48} color="#cbd5e1" strokeWidth={1.5} />
                  <Text style={{ marginTop: 16, color: '#64748b', textAlign: 'center' }}>
                    Chưa có nông trại và ao nào.{'\n'}Vui lòng tạo nông trại trước.
                  </Text>
                </View>
              ) : (
                pondsByFarm.map(({ farm, ponds: farmPonds }) => (
                  <View key={farm._id} style={{ marginBottom: 24 }}>
                    {/* Farm Header */}
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      backgroundColor: '#f8fafc',
                    }}>
                      <TablerIconComponent name="home" size={20} color="#64748b" strokeWidth={2} />
                      <Text style={{
                        marginLeft: 8,
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#475569',
                      }}>
                        {farm.name}
                      </Text>
                      {farm.location && (
                        <Text style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8' }}>
                          • {farm.location}
                        </Text>
                      )}
                    </View>

                    {/* Ponds */}
                    {farmPonds.length === 0 ? (
                      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 14, fontStyle: 'italic' }}>
                          Chưa có ao nào trong nông trại này
                        </Text>
                      </View>
                    ) : (
                      farmPonds.map(pond => (
                        <TouchableOpacity
                          key={pond._id}
                          onPress={() => handleSelectPond(pond)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: '#f1f5f9',
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{
                              backgroundColor: '#dbeafe',
                              padding: 10,
                              borderRadius: 12,
                              marginRight: 12,
                            }}>
                              <TablerIconComponent name="droplet" size={24} color="#3b82f6" strokeWidth={2} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#1e293b',
                                marginBottom: 2,
                              }}>
                                {pond.name}
                              </Text>
                              {pond.area && (
                                <Text style={{ fontSize: 12, color: '#64748b' }}>
                                  Diện tích: {pond.area} m²
                                </Text>
                              )}
                            </View>
                          </View>
                          <TablerIconComponent name="chevron-right" size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
