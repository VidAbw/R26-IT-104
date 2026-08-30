// components/CustomSlider.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onValueChange: (val: number) => void;
  description?: string;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onValueChange,
  description,
}) => {
  const handleDecrement = () => {
    const newVal = Math.max(min, Number((value - step).toFixed(2)));
    onValueChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = Math.min(max, Number((value + step).toFixed(2)));
    onValueChange(newVal);
  };

  // Percentage progress for the track bar
  const progressPercent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
        </Text>
      </View>

      {description && <Text style={styles.descriptionText}>{description}</Text>}

      {/* Visual Track Bar & Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.stepBtn, value <= min && styles.disabledBtn]}
          onPress={handleDecrement}
          disabled={value <= min}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={20} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.trackBackground}>
          <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />
        </View>

        <TouchableOpacity
          style={[styles.stepBtn, value >= max && styles.disabledBtn]}
          onPress={handleIncrement}
          disabled={value >= max}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
  },
  descriptionText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  trackBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
});
