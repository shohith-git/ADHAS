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
  Animated,
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
  const BACKEND = "http://172.29.206.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* ------------------ TOAST SYSTEM ------------------ */
  const [toastMessage, setToastMessage] = useState("");
  const [toastIcon, setToastIcon] = useState("ℹ️");
  const toastAnim = React.useRef(new Animated.Value(0)).current;

  const showToast = (msg = "", type = "info") => {
    if (!msg) return;

    const icon =
      type === "success"
        ? "✔️"
        : type === "error"
        ? "❌"
        : type === "warning"
        ? "⚠️"
        : "ℹ️";

    setToastIcon(icon);
    setToastMessage(msg);

    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, 3000);
  };
  /* -------------------------------------------------- */

  // Fetch students
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
      showToast("Unable to fetch student data.", "error");
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

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      String(s.hostel_id || "")
        .toLowerCase()
        .includes(q) ||
      s.room_no?.toLowerCase().includes(q)
    );
  });

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 15 }}>
      {/* TOAST UI */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          {
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-40, 0],
                }),
              },
              {
                scale: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.toastIcon}>{toastIcon}</Text>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      {/* Title */}
      <Text style={styles.pageTitle}>🎓 Student Profiles</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#475569" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Id, Name, Room Number."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={(t) => {
            setSearchQuery(t);
            if (t.length === 0) showToast("Search cleared.", "info");
          }}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              showToast("Search cleared.", "info");
            }}
          >
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
      ) : filteredStudents.length === 0 ? (
        <>
          <Text style={styles.emptyText}>No matching students found.</Text>
          {showToast("No results match your search.", "warning")}
        </>
      ) : (
        <View style={styles.grid}>
          {filteredStudents.map((s) => {
            const accent = getAccent(s.room_no);
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.card, { borderTopColor: accent }]}
                onPress={() => {
                  showToast(`Opening profile for ${s.name}`, "success");
                  router.push(`/warden/student-profile/${s.id}`);
                }}
              >
                {/* Accent Bar */}
                <View
                  style={[styles.cardHeader, { backgroundColor: accent }]}
                />

                {/* Profile Photo */}
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
                    <Ionicons name="person-outline" size={40} color={accent} />
                  </View>
                )}

                {/* Info */}
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.meta}>Hostel ID: {s.hostel_id || "—"}</Text>
                <Text style={styles.meta}>USN: {s.usn || "N/A"}</Text>
                <Text style={styles.meta}>Email: {s.email || "N/A"}</Text>
                <Text style={styles.meta}>Dept: {s.dept_branch || "N/A"}</Text>

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

      {/* Back to Dashboard */}
      <TouchableOpacity
        style={styles.dashboardBtn}
        onPress={() => {
          showToast("Returning to dashboard…", "info");
          router.push("/warden-dashboard");
        }}
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

  /* Toast */
  toast: {
    position: "absolute",
    top: 16,
    left: "50%",
    width: 340,
    marginLeft: -170,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 9999,
  },
  toastIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  toastText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#0f172a",
  },

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

  /* Dashboard Button */
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
