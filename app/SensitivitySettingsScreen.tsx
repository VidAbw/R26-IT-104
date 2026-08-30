// app/SensitivitySettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../hooks/useAlerts';
import { CustomSlider } from '../components/CustomSlider';

export default function SensitivitySettingsScreen() {
  const { config, configLoading, updateConfig, fetchConfig } = useAlerts();

  // Local state for interactive editing
  const [audioConfidence, setAudioConfidence] = useState<number>(0.75);
  const [visionConfidence, setVisionConfidence] = useState<number>(0.70);
  const [cooldown, setCooldown] = useState<number>(10);
  const [rmsDb, setRmsDb] = useState<number>(70);
  const [autoSuppression, setAutoSuppression] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state with fetched pipeline config
  useEffect(() => {
    if (config) {
      setAudioConfidence(config.audio_confidence_threshold ?? 0.75);
      setVisionConfidence(config.vision_confidence_threshold ?? 0.70);
      setCooldown(config.cooldown_seconds ?? 10);
      setRmsDb(config.audio_rms_threshold_db ?? 70);
      setAutoSuppression(config.enable_auto_suppression ?? true);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      await updateConfig({
        audio_confidence_threshold: audioConfidence,
        vision_confidence_threshold: visionConfidence,
        cooldown_seconds: cooldown,
        audio_rms_threshold_db: rmsDb,
        enable_auto_suppression: autoSuppression,
      });

      setSuccessMessage('Threshold configuration updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.title}>System Sensitivity Settings</Text>
          <Text style={styles.subtitle}>
            Tune AI cutoff thresholds (\theta) and alert cooldown parameters for your home.
          </Text>
        </View>

        {/* Success / Error Banners */}
        {successMessage && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#047857" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#B91C1C" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {configLoading && !saving ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 24 }} />
        ) : (
          <>
            {/* 1. Audio Threat Confidence Cutoff */}
            <CustomSlider
              label="Audio Threat Confidence Cutoff"
              value={audioConfidence}
              min={0.5}
              max={0.95}
              step={0.05}
              unit=""
              onValueChange={setAudioConfidence}
              description="Minimum probability required to flag vocal aggression, screams, or distress crying."
            />

            {/* 2. Vision Hazard Cutoff */}
            <CustomSlider
              label="Vision Fall / Hazard Cutoff"
              value={visionConfidence}
              min={0.5}
              max={0.95}
              step={0.05}
              unit=""
              onValueChange={setVisionConfidence}
              description="Minimum AI confidence required to flag child falls, physical impacts, or hazardous zones."
            />

            {/* 3. Cooldown Throttling Window */}
            <CustomSlider
              label="Alert Cooldown Period"
              value={cooldown}
              min={15}
              max={120}
              step={5}
              unit="s"
              onValueChange={setCooldown}
              description="Throttling window in seconds to suppress duplicate alerts for continuous events."
            />

            {/* 4. Acoustic Intensity Cutoff (dB) */}
            <CustomSlider
              label="Acoustic Decibel Threshold"
              value={rmsDb}
              min={50}
              max={100}
              step={2}
              unit=" dB"
              onValueChange={setRmsDb}
              description="Minimum volume level in decibels required to trigger high-decibel audio alerts."
            />

            {/* 5. Auto Suppression Toggle */}
            <View style={styles.toggleCard}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Intelligent Alert Suppression</Text>
                <Text style={styles.toggleSubtitle}>
                  Automatically suppress duplicate alerts during cooldown windows and parent voice matches.
                </Text>
              </View>
              <Switch
                value={autoSuppression}
                onValueChange={setAutoSuppression}
                trackColor={{ false: '#D1D5DB', true: '#818CF8' }}
                thumbColor={autoSuppression ? '#4F46E5' : '#F3F4F6'}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledBtn]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Sensitivity Settings</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  successBanner: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 13,
  },
  toggleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
