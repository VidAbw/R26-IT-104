import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProtectivaTheme } from '../constants/theme';

export type ProtectivaNavTab =
  | 'overview'
  | 'voice_monitoring'
  | 'nanny_camera'
  | 'legal_guidance'
  | 'alerts_history'
  | 'emergency_support'
  | 'resources'
  | 'settings';

interface ProtectivaSidebarProps {
  activeTab: ProtectivaNavTab;
  onSelectTab: (tab: ProtectivaNavTab) => void;
  alertCount?: number;
}

export const ProtectivaSidebar: React.FC<ProtectivaSidebarProps> = ({
  activeTab,
  onSelectTab,
  alertCount = 0,
}) => {
  const menuItems: { id: ProtectivaNavTab; label: string; icon: keyof typeof Ionicons.glyphMap; badge?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid-outline' },
    { id: 'voice_monitoring', label: 'Voice Monitoring', icon: 'mic-outline' },
    { id: 'nanny_camera', label: 'Nanny Camera', icon: 'videocam-outline' },
    { id: 'legal_guidance', label: 'Legal Guidance', icon: 'scale-outline' },
    { id: 'alerts_history', label: 'Alerts & History', icon: 'notifications-outline', badge: alertCount > 0 },
    { id: 'emergency_support', label: 'Emergency Support', icon: 'call-outline' },
    { id: 'resources', label: 'Resources', icon: 'book-outline' },
    { id: 'settings', label: 'Settings', icon: 'settings-outline' },
  ];

  return (
    <View style={styles.sidebarContainer}>
      <View style={styles.navList}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onSelectTab(item.id)}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={isActive ? ProtectivaTheme.primaryDark : ProtectivaTheme.textSecondary}
                style={{ marginRight: 12 }}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              {item.badge && <View style={styles.alertRedDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Promo Card */}
      <View style={styles.sidebarPromoCard}>
        <View style={styles.promoIconRow}>
          <Image
            source={require('../assets/images/pacifier (1).png')}
            style={styles.promoPacifierIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.promoTitle}>Protect. Support. Empower.</Text>
        <Text style={styles.promoSubtitle}>
          Together, we create a safer tomorrow for every child.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: ProtectivaTheme.border,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: '#E6F4F1',
  },
  navLabel: {
    fontSize: 14,
    color: ProtectivaTheme.textSecondary,
    fontWeight: '500',
  },
  navLabelActive: {
    color: ProtectivaTheme.primaryDark,
    fontWeight: '700',
  },
  alertRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    position: 'absolute',
    right: 14,
    top: 12,
  },
  sidebarPromoCard: {
    backgroundColor: '#E6F4F1',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCEADF',
  },
  promoIconRow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: ProtectivaTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promoPacifierIcon: {
    width: 28,
    height: 28,
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ProtectivaTheme.primaryDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 11,
    color: ProtectivaTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },
});
