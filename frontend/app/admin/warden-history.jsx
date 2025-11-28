import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BACKEND = "http://10.49.102.21:5000";

export default function WardenHistory() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/admin/deleted-wardens`);
      setHistory(res.data || []);
    } catch (err) {
      console.error("❌ Error loading warden history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>🗂️ Deleted Wardens History</Text>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" />
      ) : history.length === 0 ? (
        <Text style={styles.empty}>No deleted warden records found.</Text>
      ) : (
        history.map((w) => (
          <View key={w.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person-outline" size={24} color="#4f46e5" />
              </View>

              <View style={{ marginLeft: 12 }}>
                <Text style={styles.name}>{w.name}</Text>
                <Text style={styles.email}>{w.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color="#64748b" />
              <Text style={styles.meta}>
                Deleted On:{" "}
                {w.deleted_at
                  ? new Date(w.deleted_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="key-outline" size={16} color="#64748b" />
              <Text style={styles.meta}>Warden ID: {w.warden_id}</Text>
            </View>
          </View>
        ))
      )}

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/admin/users")}
      >
        <Text style={styles.backBtnText}>← Back to Users</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ------------------------ STYLES ------------------------ */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
  },

  backSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  backSmallText: {
    color: "#4f46e5",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 13,
  },

  /* CARD */
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    elevation: 3,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 100,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  email: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  meta: {
    marginLeft: 6,
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#94a3b8",
    fontStyle: "italic",
    fontSize: 15,
  },

  backBtn: {
    marginTop: 24,
    backgroundColor: "#4f46e5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },

  backBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
