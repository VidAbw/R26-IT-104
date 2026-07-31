// components/AlertCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertLog } from '../types/alerts';

interface AlertCardProps {
  alert: AlertLog;
  onAcknowledge: (alertId: string) => Promise<any>;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge }) => {
  const [acknowledging, setAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    try {
      setAcknowledging(true);
      await onAcknowledge(alert.id);
    } catch (err) {
      console.error('Failed to acknowledge alert from card:', err);
    } finally {
      setAcknowledging(false);
    }
  };

  const isTriggered = alert.status === 'triggered';
  const isAcknowledged = alert.status === 'acknowledged';
  const isSuppressed = alert.status === 'suppressed';

  // Status Badge Colors
  const getBadgeStyle = () => {
    if (isTriggered) return { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C', label: 'ACTIVE EMERGENCY' };
    if (isAcknowledged) return { bg: '#D1FAE5', border: '#10B981', text: '#047857', label: 'ACKNOWLEDGED' };
    return { bg: '#F3F4F6', border: '#9CA3AF', text: '#4B5563', label: 'SUPPRESSED' };
  };

  const getIconName = (eventType: string) => {
    const type = eventType.toLowerCase();
    if (type.includes('fall')) return 'body-outline';
    if (type.includes('hit')) return 'warning-outline';
    if (type.includes('aggression') || type.includes('scream')) return 'mic-outline';
    if (type.includes('cry')) return 'sad-outline';
    return 'alert-circle-outline';
  };

  const badge = getBadgeStyle();
  const confidencePercent = Math.round((alert.confidence || 0) * 100);
  const formattedTime = alert.timestamp
    ? new Date(alert.timestamp).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const meta = alert.metadata || {};

  return (
    <View style={[styles.card, isTriggered && styles.triggeredCard]}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: badge.bg }]}>
          <Ionicons name={getIconName(alert.event_type)} size={22} color={badge.text} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.eventTypeTitle}>
            {alert.event_type.replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.timestampText}>{formattedTime}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Main Content Details */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Confidence:</Text>
          <Text style={styles.detailValue}>{confidencePercent}%</Text>
        </View>

        {meta.rms_db !== undefined && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Intensity:</Text>
            <Text style={styles.detailValue}>{meta.rms_db.toFixed(1)} dB</Text>
          </View>
        )}

        {meta.camera_id && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Camera:</Text>
            <Text style={styles.detailValue}>{meta.camera_id}</Text>
          </View>
        )}
      </View>

      {/* Suppression Reason Log */}
      {isSuppressed && meta.suppression_reason && (
        <View style={styles.suppressionBox}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.suppressionText}>{meta.suppression_reason}</Text>
        </View>
      )}

      {/* Inline Acknowledge CTA Button for Active Triggered Alerts */}
      {isTriggered && (
        <TouchableOpacity
          style={[styles.ackBtn, acknowledging && styles.disabledBtn]}
          onPress={handleAcknowledge}
          disabled={acknowledging}
          activeOpacity={0.8}
        >
          {acknowledging ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.ackBtnText}>Acknowledge Alert</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  triggeredCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  eventTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  timestampText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  suppressionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 6,
  },
  suppressionText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  ackBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  ackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
