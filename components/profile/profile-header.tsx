import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type ProfileHeaderProps = {
  displayName: string;
  photoUri?: string;
  editableName: string;
  editablePhotoUri: string;
  onChangeName: (name: string) => void;
  onChangePhotoUri: (uri: string) => void;
};

const getInitials = (name: string): string => {
  const chunks = name.trim().split(" ").filter(Boolean);
  if (chunks.length === 0) return "P";

  return chunks
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || "")
    .join("");
};

export const ProfileHeader = ({
  displayName,
  photoUri,
  editableName,
  editablePhotoUri,
  onChangeName,
  onChangePhotoUri,
}: ProfileHeaderProps) => {
  const showPhoto = Boolean(photoUri);

  const pickImageFromDevice = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo library access to choose an image.",
      );
      return;
    }

    const pickResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!pickResult.canceled) {
      onChangePhotoUri(pickResult.assets[0]?.uri || "");
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        {showPhoto ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.initialsAvatar]}>
            <Text style={styles.initials}>{getInitials(displayName)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>Parent Name</Text>
      <TextInput
        style={styles.input}
        value={editableName}
        onChangeText={onChangeName}
        placeholder="Enter your name"
      />

      <Text style={styles.label}>Photo URL</Text>
      <TextInput
        style={styles.input}
        value={editablePhotoUri}
        onChangeText={onChangePhotoUri}
        placeholder="https://..."
        autoCapitalize="none"
      />

      <Pressable style={styles.pickImageButton} onPress={pickImageFromDevice}>
        <Text style={styles.pickImageButtonText}>Choose From Device</Text>
      </Pressable>

      <Pressable style={styles.hintBadge}>
        <Text style={styles.hintText}>Tip: add your own profile photo URL</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E6F4F1",
    borderWidth: 2,
    borderColor: "#0D9488",
  },
  initialsAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F766E",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
    fontSize: 14,
    color: "#0F172A",
  },
  hintBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E6F4F1",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pickImageButton: {
    backgroundColor: "#0F766E",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  pickImageButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  hintText: {
    color: "#0D9488",
    fontSize: 12,
    fontWeight: "500",
  },
});
