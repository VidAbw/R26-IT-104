import { ChildProfile, SafetyLevel } from "@/types/profile";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type ChildrenSectionProps = {
  childrenProfiles: ChildProfile[];
  onAddChild: (child: Omit<ChildProfile, "id" | "createdAt">) => void;
  onDeleteChild: (childId: string) => void;
};

const SAFETY_LEVELS: SafetyLevel[] = ["low", "medium", "high"];

export const ChildrenSection = ({
  childrenProfiles,
  onAddChild,
  onDeleteChild,
}: ChildrenSectionProps) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [notes, setNotes] = useState("");
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>("medium");

  const addChild = () => {
    const trimmedName = name.trim();
    const parsedAge = Number(age);

    if (!trimmedName || !Number.isFinite(parsedAge) || parsedAge <= 0) {
      return;
    }

    onAddChild({
      name: trimmedName,
      age: parsedAge,
      safetyLevel,
      photoUri: photoUri.trim(),
      notes: notes.trim(),
    });

    setName("");
    setAge("");
    setPhotoUri("");
    setNotes("");
    setSafetyLevel("medium");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Children Profiles</Text>

      {childrenProfiles.length === 0 ? (
        <Text style={styles.emptyState}>
          No child profiles yet. Add your first one below.
        </Text>
      ) : (
        childrenProfiles.map((child) => (
          <View key={child.id} style={styles.childCard}>
            <View>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childMeta}>Age: {child.age}</Text>
              <Text style={styles.childMeta}>
                Safety Level: {child.safetyLevel.toUpperCase()}
              </Text>
              {child.notes ? (
                <Text style={styles.childMeta}>Notes: {child.notes}</Text>
              ) : null}
            </View>
            <Pressable onPress={() => onDeleteChild(child.id)}>
              <Text style={styles.deleteText}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.formWrap}>
        <Text style={styles.formTitle}>Add Child</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Child name"
        />

        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="Age"
          keyboardType="number-pad"
        />

        <TextInput
          style={styles.input}
          value={photoUri}
          onChangeText={setPhotoUri}
          placeholder="Photo URL (optional)"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes (optional)"
          multiline
        />

        <View style={styles.levelRow}>
          {SAFETY_LEVELS.map((level) => (
            <Pressable
              key={level}
              style={[
                styles.levelPill,
                safetyLevel === level && styles.levelPillActive,
              ]}
              onPress={() => setSafetyLevel(level)}
            >
              <Text
                style={[
                  styles.levelText,
                  safetyLevel === level && styles.levelTextActive,
                ]}
              >
                {level.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.addBtn} onPress={addChild}>
          <Text style={styles.addBtnText}>Add Child Profile</Text>
        </Pressable>
      </View>
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
  emptyState: {
    color: "#555",
    marginBottom: 12,
  },
  childCard: {
    backgroundColor: "#f5f9fe",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  childName: {
    fontSize: 16,
    fontWeight: "700",
  },
  childMeta: {
    fontSize: 13,
    color: "#444",
    marginTop: 2,
  },
  deleteText: {
    color: "#a41616",
    fontWeight: "700",
  },
  formWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ececec",
    paddingTop: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  levelPill: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  levelPillActive: {
    backgroundColor: "#1e3a5f",
    borderColor: "#1e3a5f",
  },
  levelText: {
    color: "#1e293b",
    fontWeight: "600",
  },
  levelTextActive: {
    color: "#fff",
  },
  addBtn: {
    backgroundColor: "#1d4f7a",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
