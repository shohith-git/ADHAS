import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 50) / 2; // two cards per row

export default function StudentProfileGrid() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // ✅ Fetch students
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];

      // Sort: E-block → W-block → Unallocated
      const sorted = data.sort((a, b) => {
        const ra = a.room_no || "";
        const rb = b.room_no || "";
        if (!ra) return 1;
        if (!rb) return -1;

        const blockA = ra[0].toUpperCase();
        const blockB = rb[0].toUpperCase();
        if (blockA !== blockB) return blockA.localeCompare(blockB);

        const numA = parseInt(ra.slice(1)) || 0;
        const numB = parseInt(rb.slice(1)) || 0;
        return numA - numB;
      });

      setStudents(sorted);
    } catch (err) {
      console.error("❌ Error fetching students:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const getAccent = (room) => {
    if (!room) return "#94a3b8"; // grey for unallocated
    const block = room[0].toUpperCase();
    return block === "E" ? "#3b82f6" : "#10b981"; // blue for East, green for West
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 15 }}>
      <Text style={styles.pageTitle}>🎓 Student Profiles</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#475569" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Id, Name, Room Number."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      ) : students.length === 0 ? (
        <Text style={styles.emptyText}>No students found.</Text>
      ) : (
        <View style={styles.grid}>
          {students
            .filter((s) => {
              const q = searchQuery.toLowerCase();
              return (
                s.name?.toLowerCase().includes(q) ||
                String(s.hostel_id || "")
                  .toLowerCase()
                  .includes(q) ||
                s.room_no?.toLowerCase().includes(q)
              );
            })

            .map((s) => {
              const accent = getAccent(s.room_no);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.card, { borderTopColor: accent }]}
                  onPress={() => router.push(`/warden/student-profile/${s.id}`)}
                >
                  {/* Header Accent */}
                  <View
                    style={[styles.cardHeader, { backgroundColor: accent }]}
                  />

                  {/* Profile Picture */}
                  {s.profile_photo ? (
                    <Image
                      source={{ uri: s.profile_photo }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        { backgroundColor: accent + "20" },
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={40}
                        color={accent}
                      />
                    </View>
                  )}

                  {/* Info */}
                  <Text style={styles.name}>{s.name}</Text>
                  <Text style={styles.meta}>
                    Hostel ID: {s.hostel_id || "—"}
                  </Text>

                  <Text style={styles.meta}>USN: {s.usn || "N/A"}</Text>
                  <Text style={styles.meta}>Email: {s.email || "N/A"}</Text>
                  <Text style={styles.meta}>
                    Dept: {s.dept_branch || "N/A"}
                  </Text>
                  <View style={[styles.roomBadge, { backgroundColor: accent }]}>
                    <Text style={styles.roomText}>
                      {s.room_no ? s.room_no : "Unallocated"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>
      )}

      {/* ✅ Back to Dashboard Button */}
      <TouchableOpacity
        style={styles.dashboardBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Ionicons name="home-outline" size={18} color="#fff" />
        <Text style={styles.dashboardText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ------------------------------ STYLES ------------------------------ */
const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 18,
    marginLeft: 5,
  },
  centered: { alignItems: "center", marginVertical: 40 },
  loadingText: { marginTop: 8, color: "#64748b", fontSize: 14 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    marginLeft: 8,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: CARD_WIDTH,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  cardHeader: {
    width: "100%",
    height: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 33,
    marginBottom: 6,
  },
  avatarPlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  meta: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  roomBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  roomText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 40,
    fontSize: 15,
  },

  /* ✅ Dashboard Button */
  dashboardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b5cff",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
  },
  dashboardText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
});
