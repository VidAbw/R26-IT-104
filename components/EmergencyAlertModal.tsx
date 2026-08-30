// components/EmergencyAlertModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertLog } from '../types/alerts';

interface EmergencyAlertModalProps {
  alert: AlertLog | null;
  onAcknowledge: (alertId: string) => Promise<any>;
  onDismiss: () => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  alert,
  onAcknowledge,
  onDismiss,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!alert) return null;

  const handleAcknowledge = async () => {
    try {
      setSubmitting(true);
      await onAcknowledge(alert.id);
    } catch (err) {
      console.error('Failed to acknowledge emergency alert:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Format event title nicely
  const getEventTitle = (eventType: string) => {
    const formatted = eventType.replace(/_/g, ' ').toUpperCase();
    if (formatted.includes('FALL')) return '⚠️ CRITICAL DETECTED: FALL HAZARD';
    if (formatted.includes('HIT')) return '🚨 EMERGENCY: IMPACT / HIT DETECTED';
    if (formatted.includes('AGGRESSION') || formatted.includes('SCREAM'))
      return '🔊 THREAT: VOCAL AGGRESSION / SCREAMING';
    if (formatted.includes('CRY')) return '👶 ATTENTION: DISTRESS CRYING DETECTED';
    return `🚨 EMERGENCY ALERT: ${formatted}`;
  };

  const confidencePercent = Math.round((alert.confidence || 0) * 100);
  const formattedTime = alert.timestamp
    ? new Date(alert.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Just now';

  const metadata = alert.metadata || {};

  return (
    <Modal
      transparent
      animationType="slide"
      visible={!!alert}
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Top Warning Banner Header */}
          <View style={styles.headerBanner}>
            <Ionicons name="warning" size={32} color="#FFFFFF" />
            <Text style={styles.headerTitle}>SAFETY EMERGENCY ALERT</Text>
          </View>

          {/* Main Body Details */}
          <View style={styles.contentBody}>
            {/* Event Category Tag */}
            <Text style={styles.eventTitle}>{getEventTitle(alert.event_type)}</Text>

            {/* Badges Row */}
            <View style={styles.badgeRow}>
              <View style={styles.confidenceBadge}>
                <Ionicons name="shield-half-outline" size={16} color="#FFFFFF" />
                <Text style={styles.confidenceText}>{confidencePercent}% Confidence</Text>
              </View>
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={16} color="#333333" />
                <Text style={styles.timeText}>{formattedTime}</Text>
              </View>
            </View>

            {/* Metadata Information Cards */}
            <View style={styles.metadataBox}>
              {metadata.rms_db !== undefined && (
                <View style={styles.metaRow}>
                  <Ionicons name="volume-high" size={18} color="#D97706" />
                  <Text style={styles.metaLabel}>Acoustic Intensity:</Text>
                  <Text style={styles.metaValue}>{metadata.rms_db.toFixed(1)} dB</Text>
                </View>
              )}

              {metadata.device_info && (
                <View style={styles.metaRow}>
                  <Ionicons name="hardware-chip" size={18} color="#4F46E5" />
                  <Text style={styles.metaLabel}>Device / Zone:</Text>
                  <Text style={styles.metaValue}>{metadata.device_info}</Text>
                </View>
              )}

              {metadata.camera_id && (
                <View style={styles.metaRow}>
                  <Ionicons name="videocam" size={18} color="#059669" />
                  <Text style={styles.metaLabel}>Camera Source:</Text>
                  <Text style={styles.metaValue}>{metadata.camera_id}</Text>
                </View>
              )}

              {metadata.bounding_box && (
                <View style={styles.metaRow}>
                  <Ionicons name="scan" size={18} color="#DC2626" />
                  <Text style={styles.metaLabel}>Bounding Box:</Text>
                  <Text style={styles.metaValue}>
                    [{metadata.bounding_box.x_min.toFixed(2)}, {metadata.bounding_box.y_min.toFixed(2)}]
                  </Text>
                </View>
              )}
            </View>

            {/* Accessible CTA Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.acknowledgeButton, submitting && styles.disabledBtn]}
                onPress={handleAcknowledge}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                    <Text style={styles.acknowledgeBtnText}>ACKNOWLEDGE ALERT</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismiss}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={20} color="#4B5563" />
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 25,
  },
  headerBanner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  contentBody: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  confidenceBadge: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  timeBadge: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  timeText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
  metadataBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  actionRow: {
    gap: 10,
  },
  acknowledgeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acknowledgeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dismissButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  dismissBtnText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
