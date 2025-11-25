// frontend/app/warden/student-profiles/[id].jsx  (StudentDetails.jsx)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";

export default function StudentDetails() {
  const params = useLocalSearchParams(); // 👈 NEW (detects update flag)
  const { id } = params;
  const router = useRouter();

  const [student, setStudent] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [newRemark, setNewRemark] = useState("");
  const [loading, setLoading] = useState(true);

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
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 3200);
  };
  /* -------------------------------------------------- */

  /* ----------- SHOW TOAST AFTER EDIT PAGE SAVES ----------- */
  useEffect(() => {
    if (params.updated === "1") {
      setTimeout(() => {
        showToast("Student details updated successfully!", "success");
      }, 250); // delay ensures it appears visibly

      router.setParams({ updated: undefined }); // clear message
    }
  }, [params.updated]);

  // Fetch all sections
  const fetchAllData = async () => {
    try {
      const stuRes = await axios.get(`${BACKEND}/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudent(stuRes.data || {});

      try {
        const compRes = await axios.get(
          `${BACKEND}/api/complaints/student/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComplaints(compRes.data || []);
      } catch {
        setComplaints([]);
      }

      try {
        const remRes = await axios.get(`${BACKEND}/api/remarks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRemarks(remRes.data || []);
      } catch {
        setRemarks([]);
      }
    } catch {
      console.log("❌ Failed loading student data");
    } finally {
      setLoading(false);
    }
  };

  const addRemark = async () => {
    if (!newRemark.trim()) {
      showToast("Enter a remark first.", "warning");
      return;
    }
    try {
      const res = await axios.post(
        `${BACKEND}/api/remarks/${id}`,
        { remark: newRemark },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRemarks((prev) => [res.data, ...prev]);
      setNewRemark("");

      showToast("Remark added.", "success");
    } catch {
      showToast("Could not save remark.", "error");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading student details...</Text>
      </View>
    );
  }

  if (!student?.id) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#64748b" }}>
          No student profile found for this record.
        </Text>
      </View>
    );
  }

  const formattedDOB = student.dob
    ? new Date(student.dob).toISOString().split("T")[0]
    : "N/A";

  return (
    <View style={{ flex: 1 }}>
      {/* FLOATING TOAST (always visible even on scroll) */}
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

      {/* MAIN PAGE SCROLL */}
      <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>{student.name}</Text>
            <Text style={styles.subTitle}>{student.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              router.push(`/warden/student-profile/edit/${student.id}`)
            }
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* STUDENT DETAILS */}
        <View style={[styles.sectionCard, styles.shadowCard]}>
          <Text style={styles.sectionHeader}>📋 Student Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Hostel ID</Text>
            <Text style={styles.value}>{student.hostel_id || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>USN</Text>
            <Text style={styles.value}>{student.usn || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>{student.dept_branch || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Year</Text>
            <Text style={styles.value}>{student.year || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Room No</Text>
            <Text
              style={[
                styles.roomBadge,
                {
                  backgroundColor: student.room_no?.startsWith("E")
                    ? "#3b82f6"
                    : student.room_no?.startsWith("W")
                    ? "#10b981"
                    : "#9ca3af",
                },
              ]}
            >
              {student.room_no || "Unallocated"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{student.phone_number || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{student.gender || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>DOB</Text>
            <Text style={styles.value}>{formattedDOB}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{student.address || "N/A"}</Text>
          </View>

          {/* Parents */}
          <View style={styles.parentContainer}>
            <Text style={styles.parentTitle}>👨 Father's Details</Text>
            <Text style={styles.parentInfo}>
              Name: {student.father_name || "N/A"}
            </Text>
            <Text style={styles.parentInfo}>
              Phone: {student.father_number || "N/A"}
            </Text>

            <Text style={[styles.parentTitle, { marginTop: 10 }]}>
              👩 Mother's Details
            </Text>
            <Text style={styles.parentInfo}>
              Name: {student.mother_name || "N/A"}
            </Text>
            <Text style={styles.parentInfo}>
              Phone: {student.mother_number || "N/A"}
            </Text>
          </View>
        </View>

        {/* COMPLAINTS */}
        <View style={[styles.sectionCard, styles.shadowCard]}>
          <Text style={styles.sectionHeader}>⚠️ Complaints</Text>

          {complaints.length === 0 ? (
            <Text style={styles.emptyText}>No complaints registered.</Text>
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              snapToInterval={296}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
            >
              {complaints.map((c) => {
                let bgColor = "#fef9c3";
                let textColor = "#854d0e";

                if (c.status === "resolved") {
                  bgColor = "#bbf7d0";
                  textColor = "#065f46";
                } else if (c.status === "in-progress") {
                  bgColor = "#fde68a";
                  textColor = "#92400e";
                } else if (c.status === "denied") {
                  bgColor = "#fecaca";
                  textColor = "#991b1b";
                }

                return (
                  <View key={c.id} style={styles.complaintCard}>
                    <Text style={styles.complaintTitle}>{c.title}</Text>
                    <Text style={styles.complaintDesc} numberOfLines={3}>
                      {c.description}
                    </Text>

                    <View style={styles.dateRow}>
                      <Text style={styles.dateText}>
                        Raised: {new Date(c.created_at).toLocaleDateString()}
                      </Text>
                      <Text style={styles.dateText}>
                        Updated:{" "}
                        {c.updated_at
                          ? new Date(c.updated_at).toLocaleDateString()
                          : "—"}
                      </Text>
                    </View>

                    <View
                      style={[styles.statusBadge, { backgroundColor: bgColor }]}
                    >
                      <Text style={[styles.statusText, { color: textColor }]}>
                        {c.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* REMARKS */}
        <View style={[styles.sectionCard, styles.shadowCard]}>
          <Text style={styles.sectionHeader}>🗒️ Warden Remarks</Text>

          <View style={styles.remarkInputRow}>
            <TextInput
              style={styles.remarkInput}
              placeholder="Write a remark..."
              placeholderTextColor="#94a3b8"
              value={newRemark}
              onChangeText={setNewRemark}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addRemark}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {remarks.length === 0 ? (
            <Text style={styles.emptyText}>No remarks yet.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={274}
              decelerationRate="fast"
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {remarks.map((r) => (
                <View key={r.id} style={styles.remarkCard}>
                  <Text style={styles.remarkText} numberOfLines={4}>
                    {r.remark}
                  </Text>
                  <Text style={styles.remarkDate}>
                    🕒{" "}
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    • {r.warden_name || "Warden"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* BACK BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/warden/student-profile")}
        >
          <Ionicons name="arrow-back-circle-outline" size={20} color="#fff" />
          <Text style={styles.backText}>Back to Student Profiles</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ------------------------------ STYLES ------------------------------ */
const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },

  toast: {
    position: "absolute",
    top: 16,
    left: "50%",
    width: 320,
    marginLeft: -160,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
    zIndex: 9999,
  },
  toastIcon: { fontSize: 18, marginRight: 8 },
  toastText: { fontWeight: "700", fontSize: 14, color: "#0f172a" },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#64748b", fontSize: 14 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0b5cff",
  },
  subTitle: { fontSize: 13, color: "#475569" },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editBtnText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 5,
    fontSize: 13,
  },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  shadowCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 14,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 20, // keeps spacing consistent
  },

  label: {
    width: 120, // fixed width for labels (aligned left)
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
  },

  value: {
    flexShrink: 1,
    color: "#0f172a",
    fontWeight: "500",
    fontSize: 14,
  },

  roomBadge: {
    color: "#fff",
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    textAlign: "center",
    fontSize: 12,
    minWidth: 70,
  },

  parentContainer: {
    marginTop: 10,
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  parentTitle: { fontSize: 15, fontWeight: "700", color: "#0b5cff" },
  parentInfo: { fontSize: 13, color: "#334155" },

  complaintCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginRight: 16,
    width: 280,
    height: 175,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    justifyContent: "space-between",
  },
  complaintTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  complaintDesc: {
    fontSize: 13.5,
    color: "#475569",
    marginBottom: 8,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  dateText: { fontSize: 12, color: "#64748b" },

  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: { fontWeight: "700", fontSize: 12.5 },

  remarkInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  remarkInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
  remarkCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginRight: 14,
    width: 260,
    height: 130,
    elevation: 3,
  },
  remarkText: { fontSize: 13.5, color: "#0f172a", lineHeight: 18 },
  remarkDate: { fontSize: 12, color: "#64748b", marginTop: 6 },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  backText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
});
