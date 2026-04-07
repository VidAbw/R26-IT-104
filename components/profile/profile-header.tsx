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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#d8e7f5",
  },
  initialsAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1b4d7b",
  },
  label: {
    fontSize: 13,
    color: "#444",
    marginBottom: 6,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  hintBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eef7ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pickImageButton: {
    backgroundColor: "#1d4f7a",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  pickImageButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  hintText: {
    color: "#2c5f89",
    fontSize: 12,
  },
});
