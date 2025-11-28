import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BACKEND = "http://10.49.102.21:5000";

export default function WardenProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [warden, setWarden] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ---------------- LOAD WARDEN ---------------- */
  const loadWarden = async () => {
    console.log("[WardenProfile] loadWarden start", { id });
    try {
      const res = await axios.get(`${BACKEND}/api/admin/users`);
      const data = res.data || [];
      const w = data.find((x) => String(x.id) === String(id));
      if (!w) {
        Alert.alert("Not Found", "No warden found.");
        return router.push("/admin/users");
      }

      setWarden(w);
      setName(w.name || "");
      setEmail(w.email || "");
    } catch (err) {
      Alert.alert("Error", "Unable to load warden details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarden();
  }, [id]);

  /* ---------------- SAVE CHANGES ---------------- */
  const saveChanges = async () => {
    if (!name || !email) {
      Alert.alert("Fields Missing", "Name and email are required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        email,
        ...(password.length > 0 ? { password } : {}),
      };

      await axios.put(`${BACKEND}/api/admin/warden/${id}`, payload);

      Alert.alert("Success", "Warden updated.");
      setPassword("");
      loadWarden();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- DO DELETE (REAL CALL) ---------------- */
  const doDelete = async () => {
    console.log("[WardenProfile] doDelete invoked", { id });

    try {
      setDeleting(true);

      const res = await axios.delete(`${BACKEND}/api/admin/warden/${id}`);
      console.log("[WardenProfile] axios delete response", res.data);

      Alert.alert("Deleted", "Warden has been removed.");
      router.push("/admin/users");
    } catch (err) {
      console.error("[WardenProfile] delete error", err);
      Alert.alert("Error", "Failed to delete warden.");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- DELETE CONFIRM HANDLER ---------------- */
  const confirmAndDelete = async () => {
    console.log("[WardenProfile] confirmAndDelete invoked");

    if (Platform.OS === "web") {
      const ok = window.confirm(
        "Are you sure? This will remove the warden and move record to history."
      );
      if (!ok) return;
      return doDelete();
    }

    // Mobile
    Alert.alert("Delete Warden", "Are you sure? This will delete the warden.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => doDelete(),
      },
    ]);
  };

  if (loading || !warden) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* HEADER CARD */}
        <View style={styles.headerCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>

          <View style={{ marginLeft: 16 }}>
            <Text style={styles.headerName}>{warden.name}</Text>
            <Text style={styles.headerEmail}>{warden.email}</Text>
            <Text style={styles.roleBadge}>Warden</Text>
          </View>
        </View>

        {/* FORM */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit Warden Details</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>New Password (optional)</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { paddingRight: 42 }]}
            />

            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#475569"
              />
            </Pressable>
          </View>

          <Pressable onPress={saveChanges} style={[styles.btn, styles.saveBtn]}>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.btnText}>{saving ? "Saving..." : "Save"}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/users")}
            style={[styles.btn, styles.backBtn]}
          >
            <Ionicons name="arrow-back" size={18} color="#4f46e5" />
            <Text style={[styles.btnText, { color: "#4f46e5" }]}>Back</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* DELETE BUTTON */}
      <Pressable onPress={confirmAndDelete} style={styles.floatingDelete}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteText}>
          {deleting ? "Deleting..." : "Delete Warden"}
        </Text>
      </Pressable>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#eef2ff" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 18,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 100,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
  },

  headerName: { fontSize: 20, fontWeight: "800", color: "#111827" },
  headerEmail: { fontSize: 14, color: "#6b7280", marginTop: 2 },

  roleBadge: {
    marginTop: 6,
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "700",
    alignSelf: "flex-start",
  },

  formCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },

  label: { fontWeight: "700", marginTop: 12, color: "#475569" },

  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 10,
    borderColor: "#e2e8f0",
    borderWidth: 1,
    marginTop: 6,
  },

  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },

  saveBtn: { backgroundColor: "#4f46e5" },
  backBtn: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    borderWidth: 1,
  },

  floatingDelete: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: "#dc2626",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 10,
    zIndex: 999,
  },

  deleteText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
  btnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },

  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
});
