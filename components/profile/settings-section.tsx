import { ProfileSettings } from "@/types/profile";
import { StyleSheet, Switch, Text, View } from "react-native";

type SettingsSectionProps = {
  settings: ProfileSettings;
  onUpdate: (next: ProfileSettings) => void;
};

type SettingRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const SettingRow = ({ label, value, onValueChange }: SettingRowProps) => (
  <View style={styles.settingRow}>
    <Text style={styles.settingText}>{label}</Text>
    <Switch value={value} onValueChange={onValueChange} />
  </View>
);

export const SettingsSection = ({
  settings,
  onUpdate,
}: SettingsSectionProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Profile Settings</Text>

      <SettingRow
        label="Push alerts"
        value={settings.pushAlertsEnabled}
        onValueChange={(value) =>
          onUpdate({ ...settings, pushAlertsEnabled: value })
        }
      />
      <SettingRow
        label="Location alerts"
        value={settings.locationAlertsEnabled}
        onValueChange={(value) =>
          onUpdate({ ...settings, locationAlertsEnabled: value })
        }
      />
      <SettingRow
        label="Weekly safety summary"
        value={settings.weeklySummaryEnabled}
        onValueChange={(value) =>
          onUpdate({ ...settings, weeklySummaryEnabled: value })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingText: {
    fontSize: 15,
  },
});
