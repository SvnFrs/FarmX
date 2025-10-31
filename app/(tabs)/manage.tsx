import React, { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import TablerIconComponent from "@/components/icon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { storageUtils, type Farm, type Pond, type ScanRecord } from "@/utils/storage";

// Helper function to convert healthStatus to numeric score
const healthStatusToScore = (status: 'excellent' | 'good' | 'fair' | 'poor'): number => {
  switch (status) {
    case 'excellent': return 90;
    case 'good': return 75;
    case 'fair': return 50;
    case 'poor': return 25;
    default: return 0;
  }
};

// Helper function to get pond health status from scan history
const getPondHealthStatus = (pondId: string, scanHistory: ScanRecord[]): 'good' | 'warning' | 'danger' => {
  const recentScans = scanHistory.filter(s => s.pondId === pondId).slice(0, 5);
  if (recentScans.length === 0) return 'good';
  
  const avgScore = recentScans.reduce((acc, scan) => acc + healthStatusToScore(scan.healthStatus), 0) / recentScans.length;
  if (avgScore >= 70) return 'good';
  if (avgScore >= 50) return 'warning';
  return 'danger';
};

export default function Manage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'farms' | 'ponds' | 'analytics' | 'history'>('dashboard');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddPondModal, setShowAddPondModal] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');
  const [newPondName, setNewPondName] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedFarms = await storageUtils.getFarms();
    const loadedPonds = await storageUtils.getPonds();
    const loadedScans = await storageUtils.getScanHistory();
    
    setFarms(loadedFarms);
    setPonds(loadedPonds);
    setScanHistory(loadedScans);
  };

  const handleAddFarm = async () => {
    if (newFarmName.trim()) {
      const newFarm: Farm = {
        id: Date.now().toString(),
        name: newFarmName,
        location: newFarmLocation,
        pondCount: 0,
        totalArea: 0,
        createdDate: new Date().toISOString(),
      };
      await storageUtils.saveFarm(newFarm);
      setNewFarmName('');
      setNewFarmLocation('');
      setShowAddFarmModal(false);
      loadData();
    }
  };

  const handleAddPond = async () => {
    if (newPondName.trim() && selectedFarmId) {
      const newPond: Pond = {
        id: Date.now().toString(),
        farmId: selectedFarmId,
        name: newPondName,
        size: 0,
        shrimpCount: 0,
        lastScanDate: undefined,
      };
      await storageUtils.savePond(newPond);
      setNewPondName('');
      setSelectedFarmId('');
      setShowAddPondModal(false);
      loadData();
    }
  };

  // Calculate statistics
  const totalPonds = ponds.length;
  const totalScans = scanHistory.length;
  const activeFarms = farms.length;
  const avgHealthScore = scanHistory.length > 0
    ? (scanHistory.reduce((acc, scan) => acc + healthStatusToScore(scan.healthStatus), 0) / scanHistory.length).toFixed(1)
    : '0';

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Management</Text>
          <Text style={styles.headerSubtitle}>Farm & Pond Operations</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <TablerIconComponent name="settings" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
            { id: 'farms', label: 'Farms', icon: 'home' },
            { id: 'ponds', label: 'Ponds', icon: 'droplet' },
            { id: 'analytics', label: 'Analytics', icon: 'chart-bar' },
            { id: 'history', label: 'History', icon: 'history' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <TablerIconComponent 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.id ? '#2563eb' : '#6b7280'} 
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <View>
            <SectionHeader title="Overview" subtitle="Your farm at a glance" />
            
            <View style={styles.statsGrid}>
              <StatCard
                title="Active Farms"
                value={activeFarms.toString()}
                icon="home"
                iconColor="#2563eb"
                subtitle={`${totalPonds} ponds`}
              />
              <StatCard
                title="Total Scans"
                value={totalScans.toString()}
                icon="scan"
                iconColor="#10b981"
                subtitle="This month"
              />
              <StatCard
                title="Avg Health"
                value={avgHealthScore}
                icon="heart"
                iconColor="#f59e0b"
                subtitle="Out of 100"
              />
              <StatCard
                title="Alerts"
                value="3"
                icon="alert-triangle"
                iconColor="#ef4444"
                subtitle="Need attention"
              />
            </View>

            <SectionHeader title="Recent Activity" />
            {scanHistory.slice(0, 3).map((scan) => (
              <Card key={scan.id} style={styles.activityCard}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: '#dbeafe' }]}>
                    <TablerIconComponent name="scan" size={24} color="#2563eb" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Health Scan Completed</Text>
                    <Text style={styles.activitySubtitle}>
                      Farm: {farms.find(f => f.id === ponds.find(p => p.id === scan.pondId)?.farmId)?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.activityTime}>{new Date(scan.date).toLocaleString()}</Text>
                  </View>
                  <Badge 
                    label={scan.healthStatus}
                    variant={scan.healthStatus === 'excellent' || scan.healthStatus === 'good' ? 'success' : scan.healthStatus === 'fair' ? 'warning' : 'danger'}
                  />
                </View>
              </Card>
            ))}

            {scanHistory.length === 0 && (
              <Card>
                <View style={styles.emptyState}>
                  <TablerIconComponent name="scan" size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateText}>No scans yet</Text>
                  <Text style={styles.emptyStateSubtext}>Start scanning to see activity here</Text>
                </View>
              </Card>
            )}
          </View>
        )}

        {/* Farms Tab */}
        {activeTab === 'farms' && (
          <View>
            <SectionHeader 
              title="My Farms" 
              subtitle={`${activeFarms} ${activeFarms === 1 ? 'farm' : 'farms'}`}
              action={
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddFarmModal(true)}
                >
                  <TablerIconComponent name="plus" size={20} color="white" />
                </TouchableOpacity>
              }
            />

            {farms.map((farm) => {
              const farmPonds = ponds.filter(p => p.farmId === farm.id);
              return (
                <Card key={farm.id} style={styles.farmCard}>
                  <View style={styles.farmHeader}>
                    <View style={styles.farmIcon}>
                      <TablerIconComponent name="home" size={32} color="#2563eb" />
                    </View>
                    <View style={styles.farmInfo}>
                      <Text style={styles.farmName}>{farm.name}</Text>
                      <Text style={styles.farmLocation}>{farm.location}</Text>
                      <View style={styles.farmStats}>
                        <View style={styles.farmStat}>
                          <TablerIconComponent name="droplet" size={16} color="#6b7280" />
                          <Text style={styles.farmStatText}>{farmPonds.length} ponds</Text>
                        </View>
                        <View style={styles.farmStat}>
                          <TablerIconComponent name="calendar" size={16} color="#6b7280" />
                          <Text style={styles.farmStatText}>
                            {new Date(farm.createdDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.farmActions}>
                    <TouchableOpacity style={styles.farmActionButton}>
                      <Text style={styles.farmActionText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.farmActionButtonOutline}>
                      <TablerIconComponent name="edit" size={18} color="#2563eb" />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}

            {farms.length === 0 && (
              <Card>
                <View style={styles.emptyState}>
                  <TablerIconComponent name="home" size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateText}>No farms yet</Text>
                  <Text style={styles.emptyStateSubtext}>Add your first farm to get started</Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => setShowAddFarmModal(true)}
                  >
                    <Text style={styles.emptyStateButtonText}>Add Farm</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          </View>
        )}

        {/* Ponds Tab */}
        {activeTab === 'ponds' && (
          <View>
            <SectionHeader 
              title="All Ponds" 
              subtitle={`${totalPonds} ${totalPonds === 1 ? 'pond' : 'ponds'}`}
              action={
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddPondModal(true)}
                >
                  <TablerIconComponent name="plus" size={20} color="white" />
                </TouchableOpacity>
              }
            />

            {ponds.map((pond) => {
              const farm = farms.find(f => f.id === pond.farmId);
              const healthStatus = getPondHealthStatus(pond.id, scanHistory);
              return (
                <Card key={pond.id} style={styles.pondCard}>
                  <View style={styles.pondHeader}>
                    <View style={[styles.statusIndicator, { 
                      backgroundColor: healthStatus === 'good' ? '#10b981' : 
                                       healthStatus === 'warning' ? '#f59e0b' : '#ef4444' 
                    }]} />
                    <View style={styles.pondInfo}>
                      <Text style={styles.pondName}>{pond.name}</Text>
                      <Text style={styles.pondFarm}>{farm?.name || 'Unknown Farm'}</Text>
                    </View>
                    <Badge 
                      label={healthStatus}
                      variant={healthStatus === 'good' ? 'success' : 
                               healthStatus === 'warning' ? 'warning' : 'danger'}
                    />
                  </View>
                  <View style={styles.pondDetails}>
                    <View style={styles.pondDetail}>
                      <TablerIconComponent name="ruler" size={16} color="#6b7280" />
                      <Text style={styles.pondDetailText}>Size: {pond.size || 0} m²</Text>
                    </View>
                    <View style={styles.pondDetail}>
                      <TablerIconComponent name="arrow-down" size={16} color="#6b7280" />
                      <Text style={styles.pondDetailText}>Shrimp: {pond.shrimpCount || 0}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.scanPondButton}>
                    <TablerIconComponent name="scan" size={18} color="white" />
                    <Text style={styles.scanPondButtonText}>Scan Now</Text>
                  </TouchableOpacity>
                </Card>
              );
            })}

            {ponds.length === 0 && (
              <Card>
                <View style={styles.emptyState}>
                  <TablerIconComponent name="droplet" size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateText}>No ponds yet</Text>
                  <Text style={styles.emptyStateSubtext}>Add ponds to your farms</Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => setShowAddPondModal(true)}
                  >
                    <Text style={styles.emptyStateButtonText}>Add Pond</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          </View>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <View>
            <SectionHeader title="Analytics" subtitle="Performance insights" />
            
            <Card style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Health Score Trends</Text>
              <View style={styles.chartPlaceholder}>
                <TablerIconComponent name="chart-line" size={64} color="#d1d5db" />
                <Text style={styles.chartPlaceholderText}>
                  Charts will be displayed here
                </Text>
              </View>
            </Card>

            <Card style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Scan Frequency</Text>
              <View style={styles.chartPlaceholder}>
                <TablerIconComponent name="chart-bar" size={64} color="#d1d5db" />
                <Text style={styles.chartPlaceholderText}>
                  Bar chart visualization
                </Text>
              </View>
            </Card>

            <Card style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Key Metrics</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{scanHistory.length}</Text>
                  <Text style={styles.metricLabel}>Total Scans</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{avgHealthScore}</Text>
                  <Text style={styles.metricLabel}>Avg Health</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {scanHistory.filter(s => healthStatusToScore(s.healthStatus) >= 75).length}
                  </Text>
                  <Text style={styles.metricLabel}>Healthy</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {scanHistory.filter(s => healthStatusToScore(s.healthStatus) < 50).length}
                  </Text>
                  <Text style={styles.metricLabel}>At Risk</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View>
            <SectionHeader 
              title="Scan History" 
              subtitle={`${totalScans} total scans`}
              action={
                <TouchableOpacity>
                  <TablerIconComponent name="filter" size={20} color="#2563eb" />
                </TouchableOpacity>
              }
            />

            {scanHistory.map((scan) => {
              const pond = ponds.find(p => p.id === scan.pondId);
              const farm = farms.find(f => f.id === pond?.farmId);
              
              return (
                <Card key={scan.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyIcon}>
                      <TablerIconComponent name="scan" size={24} color="#2563eb" />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle}>
                        {farm?.name || 'Unknown'} - {pond?.name || 'Unknown Pond'}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(scan.date).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.historyScore}>{healthStatusToScore(scan.healthStatus)}</Text>
                  </View>
                  <View style={styles.historyMetrics}>
                    <View style={styles.historyMetric}>
                      <Text style={styles.historyMetricLabel}>Muscle-Gut Ratio</Text>
                      <Text style={styles.historyMetricValue}>{scan.muscleGutRatio?.toFixed(2) || 'N/A'}</Text>
                    </View>
                    {scan.recommendations && scan.recommendations.length > 0 && (
                      <Text style={styles.historyNotes}>Notes: {scan.recommendations[0]}</Text>
                    )}
                  </View>
                </Card>
              );
            })}

            {scanHistory.length === 0 && (
              <Card>
                <View style={styles.emptyState}>
                  <TablerIconComponent name="history" size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateText}>No scan history</Text>
                  <Text style={styles.emptyStateSubtext}>Your scan records will appear here</Text>
                </View>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Farm Modal */}
      <Modal
        visible={showAddFarmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddFarmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Farm</Text>
              <TouchableOpacity onPress={() => setShowAddFarmModal(false)}>
                <TablerIconComponent name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Farm Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter farm name"
              value={newFarmName}
              onChangeText={setNewFarmName}
            />
            
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location"
              value={newFarmLocation}
              onChangeText={setNewFarmLocation}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowAddFarmModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonSave}
                onPress={handleAddFarm}
              >
                <Text style={styles.modalButtonSaveText}>Add Farm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Pond Modal */}
      <Modal
        visible={showAddPondModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPondModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Pond</Text>
              <TouchableOpacity onPress={() => setShowAddPondModal(false)}>
                <TablerIconComponent name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Select Farm *</Text>
            <View style={styles.pickerContainer}>
              {farms.map((farm) => (
                <TouchableOpacity
                  key={farm.id}
                  style={[
                    styles.pickerOption,
                    selectedFarmId === farm.id && styles.pickerOptionSelected
                  ]}
                  onPress={() => setSelectedFarmId(farm.id)}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    selectedFarmId === farm.id && styles.pickerOptionTextSelected
                  ]}>
                    {farm.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.inputLabel}>Pond Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pond name"
              value={newPondName}
              onChangeText={setNewPondName}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => setShowAddPondModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonSave}
                onPress={handleAddPond}
              >
                <Text style={styles.modalButtonSaveText}>Add Pond</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  settingsButton: {
    padding: 8,
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScroll: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmCard: {
    marginBottom: 16,
  },
  farmHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  farmIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  farmLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  farmStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  farmStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  farmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  farmActionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  farmActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  farmActionButtonOutline: {
    width: 44,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pondCard: {
    marginBottom: 12,
  },
  pondHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pondInfo: {
    flex: 1,
  },
  pondName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pondFarm: {
    fontSize: 14,
    color: '#6b7280',
  },
  pondDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  pondDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pondDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  scanPondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 6,
  },
  scanPondButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsCard: {
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  historyCard: {
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  historyIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  historyScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  historyMetrics: {
    gap: 8,
  },
  historyMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  historyNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
  },
  pickerContainer: {
    gap: 8,
    marginBottom: 16,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  pickerOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  pickerOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
