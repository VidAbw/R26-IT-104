import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProtectivaTheme } from '../constants/theme';
import { useDiscreetMode } from '../contexts/DiscreetModeContext';

interface ProtectivaHeaderProps {
  isMobile?: boolean;
  onToggleMobileMenu?: () => void;
  unreadAlertCount?: number;
  onPressAlerts?: () => void;
  onLogout?: () => void;
}

export const ProtectivaHeader: React.FC<ProtectivaHeaderProps> = ({
  isMobile = false,
  onToggleMobileMenu,
  unreadAlertCount = 0,
  onPressAlerts,
  onLogout,
}) => {
  const { isDiscreetMode, setIsDiscreetMode, handleQuickEscape } = useDiscreetMode();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {isMobile && (
          <TouchableOpacity style={styles.menuButton} onPress={onToggleMobileMenu}>
            <Ionicons name="menu-outline" size={26} color={ProtectivaTheme.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={styles.logoRow}>
          <View style={styles.shieldIconContainer}>
            <Image
              source={require('../assets/images/pacifier.png')}
              style={styles.pacifierLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.logoTextCol}>
            <Text style={styles.brandTitle}>Protectiva</Text>
            {!isMobile && (
              <Text style={styles.brandSubtitle}>Child Protection & Guardian Support</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        {!isMobile && (
          <>
            <View style={styles.discreetRow}>
              <Text style={styles.discreetLabel}>Discreet Mode</Text>
              <Ionicons name="information-circle-outline" size={16} color={ProtectivaTheme.textSecondary} style={{ marginRight: 6 }} />
              <Switch
                value={isDiscreetMode}
                onValueChange={setIsDiscreetMode}
                trackColor={{ false: '#E2E8F0', true: ProtectivaTheme.primary }}
                thumbColor="#FFFFFF"
                style={{ transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [] }}
              />
            </View>

            <TouchableOpacity style={styles.quickEscapeBtn} onPress={handleQuickEscape}>
              <Ionicons name="walk-outline" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.quickEscapeText}>Quick Escape</Text>
            </TouchableOpacity>

            <View style={styles.userBadgeRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>G</Text>
              </View>
              <View style={styles.userTextCol}>
                <Text style={styles.userName}>Guardian</Text>
                <Text style={styles.userRole}>Guardian Account</Text>
              </View>
              {onLogout && (
                <TouchableOpacity onPress={onLogout} style={{ marginLeft: 8 }}>
                  <Ionicons name="log-out-outline" size={18} color={ProtectivaTheme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {isMobile && (
          <TouchableOpacity style={styles.bellButton} onPress={onPressAlerts}>
            <Ionicons name="notifications-outline" size={24} color={ProtectivaTheme.textPrimary} />
            {unreadAlertCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ProtectivaTheme.border,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    borderWidth: 1.5,
    borderColor: ProtectivaTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pacifierLogo: {
    width: 22,
    height: 22,
    tintColor: ProtectivaTheme.primaryDark,
  },
  logoTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProtectivaTheme.primaryDark,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: ProtectivaTheme.textSecondary,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  discreetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  discreetLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: ProtectivaTheme.textPrimary,
    marginRight: 4,
  },
  quickEscapeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProtectivaTheme.quickEscapeRed,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quickEscapeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  userBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: ProtectivaTheme.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  userTextCol: {
    justifyContent: 'center',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: ProtectivaTheme.textPrimary,
  },
  userRole: {
    fontSize: 10,
    color: ProtectivaTheme.textSecondary,
  },
  bellButton: {
    position: 'relative',
    padding: 6,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
