import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminStudentProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const BACKEND = "http://10.49.102.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [student, setStudent] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  /* ---- Fetch Student ---- */
  const fetchStudent = async () => {
    const res = await axios.get(`${BACKEND}/api/students/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStudent(res.data);
  };

  /* ---- Fetch Remarks ---- */
  const fetchRemarks = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/remarks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRemarks(res.data || []);
    } catch {
      setRemarks([]);
    }
  };

  /* ---- Fetch Complaints ---- */
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/complaints/student/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data || []);
    } catch {
      setComplaints([]);
    }
  };

  const loadAll = async () => {
    await Promise.all([fetchStudent(), fetchRemarks(), fetchComplaints()]);
    setLoading(false);
  };

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  /* ---- Loading Screen ---- */
  if (loading || !student) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10, color: "#6366f1" }}>
          Fetching student profile…
        </Text>
      </View>
    );
  }

  /* -------------------------------------- */
  /*                 UI                     */
  /* -------------------------------------- */

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* HEADER SECTION */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" color="#fff" size={32} />
        </View>

        <View style={{ marginLeft: 16 }}>
          <Text style={styles.headerName}>{student.name}</Text>
          <Text style={styles.headerEmail}>{student.email}</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabsRow}>
        <TabButton
          label="Details"
          active={activeTab === "details"}
          onPress={() => setActiveTab("details")}
        />
        <TabButton
          label={`Remarks (${remarks.length})`}
          active={activeTab === "remarks"}
          onPress={() => setActiveTab("remarks")}
        />
        <TabButton
          label={`Complaints (${complaints.length})`}
          active={activeTab === "complaints"}
          onPress={() => setActiveTab("complaints")}
        />
      </View>

      {/* Tabs Content */}
      {activeTab === "details" && <DetailsTab student={student} />}

      {activeTab === "remarks" && <RemarksTab remarks={remarks} />}

      {activeTab === "complaints" && <ComplaintsTab complaints={complaints} />}

      {/* BACK BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/admin/users")}
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ========================================================= */
/*                     DETAILS TAB                           */
/* ========================================================= */

function DetailsTab({ student }) {
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        <Ionicons name="information-circle" size={18} color="#4f46e5" /> Student
        Details
      </Text>

      <DetailRow label="Hostel ID" value={student.hostel_id} />
      <DetailRow label="USN" value={student.usn} />
      <DetailRow label="Department" value={student.dept_branch} />
      <DetailRow label="Year" value={student.year} />
      <DetailRow label="Batch" value={student.batch} />
      <DetailRow label="Room" value={student.room_no || "Unallocated"} />
      <DetailRow label="Phone" value={student.phone_number} />
      <DetailRow label="Gender" value={student.gender} />
      <DetailRow label="DOB" value={formatDate(student.dob)} />
      <DetailRow label="Joined" value={formatDate(student.created_at)} />

      <View style={{ marginTop: 12 }}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.valueText}>{student.address || "N/A"}</Text>
      </View>

      {/* PARENTS */}
      <View style={styles.parentBlock}>
        <Text style={styles.parentHeader}>👨 Father</Text>
        <Text style={styles.parentItem}>
          Name: {student.father_name || "N/A"}
        </Text>
        <Text style={styles.parentItem}>
          Phone: {student.father_number || "N/A"}
        </Text>

        <Text style={[styles.parentHeader, { marginTop: 10 }]}>👩 Mother</Text>
        <Text style={styles.parentItem}>
          Name: {student.mother_name || "N/A"}
        </Text>
        <Text style={styles.parentItem}>
          Phone: {student.mother_number || "N/A"}
        </Text>
      </View>
    </View>
  );
}

/* ========================================================= */
/*                     REMARKS TAB                           */
/* ========================================================= */

function RemarksTab({ remarks }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        <Ionicons name="chatbubble-ellipses" size={18} color="#4f46e5" />{" "}
        Remarks
      </Text>

      {remarks.length === 0 ? (
        <Text style={styles.emptyText}>No remarks recorded.</Text>
      ) : (
        remarks.map((r) => (
          <View key={r.id} style={styles.remarkCard}>
            <Text style={styles.remarkText}>{r.remark}</Text>
            <Text style={styles.remarkMeta}>
              {new Date(r.created_at).toLocaleString("en-IN")}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

/* ========================================================= */
/*                    COMPLAINTS TAB                         */
/* ========================================================= */

function ComplaintsTab({ complaints }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>
        <Ionicons name="alert-circle" size={18} color="#4f46e5" /> Complaints
      </Text>

      {complaints.length === 0 ? (
        <Text style={styles.emptyText}>No complaints found.</Text>
      ) : (
        complaints.map((c) => (
          <View key={c.id} style={styles.complaintCard}>
            <Text style={styles.complaintTitle}>{c.title}</Text>
            <Text style={styles.complaintDesc}>{c.description}</Text>
            <Text style={styles.complaintMeta}>
              {new Date(c.created_at).toLocaleDateString()} •{" "}
              {c.status?.toUpperCase()}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

/* ========================================================= */
/*                     SMALL COMPONENTS                      */
/* ========================================================= */

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text
        style={[styles.tabButtonText, active && styles.tabButtonTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ========================================================= */
/*                        STYLES                             */
/* ========================================================= */

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f4f6ff",
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* HEADER CARD */
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    margin: 15,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },

  headerName: { fontSize: 20, fontWeight: "800", color: "#111827" },
  headerEmail: { color: "#6b7280" },

  /* TABS */
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginBottom: 12,
    backgroundColor: "#e7eafe",
    padding: 6,
    borderRadius: 10,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: "#4f46e5",
  },
  tabButtonText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#4f46e5",
  },
  tabButtonTextActive: { color: "#fff" },

  /* SECTIONS */
  sectionCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 16,
    borderRadius: 14,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1f2937",
  },

  /* DETAILS */
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  label: {
    width: 120,
    color: "#6b7280",
    fontWeight: "700",
  },

  value: {
    flex: 1,
    color: "#111827",
    fontWeight: "600",
  },

  valueText: {
    marginTop: 5,
    color: "#111827",
    fontWeight: "600",
  },

  /* PARENT BLOCK */
  parentBlock: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    marginTop: 14,
    borderRadius: 10,
  },
  parentHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4f46e5",
  },
  parentItem: {
    marginTop: 3,
    fontWeight: "500",
    color: "#1f2937",
  },

  /* REMARKS CARD */
  remarkCard: {
    padding: 12,
    backgroundColor: "#f9fafb",
    borderLeftWidth: 4,
    borderLeftColor: "#4f46e5",
    borderRadius: 10,
    marginBottom: 12,
  },
  remarkText: { fontWeight: "600", color: "#1f2937" },
  remarkMeta: { marginTop: 6, fontSize: 12, color: "#6b7280" },

  /* COMPLAINT CARD */
  complaintCard: {
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  complaintTitle: { fontSize: 15, fontWeight: "700", color: "#1f2937" },
  complaintDesc: { color: "#6b7280", marginVertical: 6 },
  complaintMeta: { marginTop: 5, color: "#4f46e5", fontWeight: "700" },

  emptyText: { textAlign: "center", color: "#9ca3af" },

  /* BACK BUTTON */
  backBtn: {
    backgroundColor: "#4f46e5",
    marginTop: 10,
    marginHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
  },
});
