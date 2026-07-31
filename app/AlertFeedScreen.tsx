// app/AlertFeedScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../hooks/useAlerts';
import { AlertCard } from '../components/AlertCard';
import { EmergencyAlertModal } from '../components/EmergencyAlertModal';
import { AlertStatus } from '../types/alerts';

export default function AlertFeedScreen() {
  const {
    alerts,
    activeEmergency,
    loading,
    refreshing,
    error,
    refresh,
    acknowledgeAlert,
    dismissEmergencyModal,
  } = useAlerts();

  const [selectedFilter, setSelectedFilter] = useState<'all' | AlertStatus>('all');

  // Filter alerts based on pill selection
  const filteredAlerts = alerts.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.status === selectedFilter;
  });

  const activeCount = alerts.filter((a) => a.status === 'triggered').length;
  const suppressedCount = alerts.filter((a) => a.status === 'suppressed').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'acknowledged').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Sticky High-Priority Emergency Pop-up Modal */}
      <EmergencyAlertModal
        alert={activeEmergency}
        onAcknowledge={acknowledgeAlert}
        onDismiss={dismissEmergencyModal}
      />

      <View style={styles.container}>
        {/* Header Title */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Child Safety Monitoring</Text>
            <Text style={styles.headerSubtitle}>Real-Time Emergency Telemetry Feed</Text>
          </View>

          <TouchableOpacity style={styles.refreshIconBtn} onPress={refresh}>
            <Ionicons name="refresh" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Counter Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.activeStatBox]}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Emergencies</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="shield-checkmark" size={20} color="#059669" />
            <Text style={styles.statNumber}>{acknowledgedCount}</Text>
            <Text style={styles.statLabel}>Acknowledged</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="options" size={20} color="#6B7280" />
            <Text style={styles.statNumber}>{suppressedCount}</Text>
            <Text style={styles.statLabel}>Suppressed</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterBar}>
          {(['all', 'triggered', 'acknowledged', 'suppressed'] as const).map((filter) => {
            const isActive = selectedFilter === filter;
            const labelMap = {
              all: 'All Logs',
              triggered: 'Active (Emergency)',
              acknowledged: 'Acknowledged',
              suppressed: 'Suppressed',
            };

            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.activeFilterPill]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isActive && styles.activeFilterPillText]}>
                  {labelMap[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feed List */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Connecting to real-time telemetry stream...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredAlerts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AlertCard alert={item} onAcknowledge={acknowledgeAlert} />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#4F46E5']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-checkmark-outline" size={56} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Alert Events</Text>
                <Text style={styles.emptySubtitle}>
                  All safety systems operational. No active threats or hazard alerts logged.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeStatBox: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  activeFilterPill: {
    backgroundColor: '#4F46E5',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeFilterPillText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
});
