// frontend/app/warden/rooms.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRoomId, setEditRoomId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    fromRoom: "",
    toRoom: "",
    floor: "",
    eastSharing: "",
    westSharing: "",
  });

  const [manualForm, setManualForm] = useState({
    room_number: "",
    floor: "",
    side: "",
    sharing: "",
  });

  // -------------------- TOAST ENGINE --------------------
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
  // ------------------------------------------------------

  const BACKEND = "http://172.29.206.21:5000";

  const fetchRooms = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${BACKEND}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch {
      showToast("Unable to load rooms.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const autoGenerateRooms = async () => {
    if (
      !form.fromRoom ||
      !form.toRoom ||
      !form.floor ||
      !form.eastSharing ||
      !form.westSharing
    ) {
      showToast("Fill all fields.", "warning");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${BACKEND}/api/rooms/auto-generate`,
        {
          fromRoom: parseInt(form.fromRoom),
          toRoom: parseInt(form.toRoom),
          floor: parseInt(form.floor),
          eastSharing: parseInt(form.eastSharing),
          westSharing: parseInt(form.westSharing),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(`Generated rooms successfully.`, "success");
      fetchRooms();
    } catch {
      showToast(`Failed to generate rooms.`, "error");
    }
  };

  const addRoom = async () => {
    if (
      !manualForm.room_number ||
      !manualForm.floor ||
      !manualForm.side ||
      !manualForm.sharing
    ) {
      showToast("Enter all fields.", "warning");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(`${BACKEND}/api/rooms`, manualForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast(`Room ${manualForm.room_number} added.`, "success");
      fetchRooms();
    } catch {
      showToast(`Unable to add room.`, "error");
    }
  };

  const handleEdit = (room) => {
    setEditRoomId(room.id);
    setEditForm(room);
  };

  const saveEdit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.put(`${BACKEND}/api/rooms/${editRoomId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast(`Updated successfully.`, "success");
      setEditRoomId(null);
      fetchRooms();
    } catch {
      showToast(`Failed to update room.`, "error");
    }
  };

  const deleteRoom = async (id) => {
    const selected = rooms.find((r) => r.id === id);

    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${BACKEND}/api/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast(`Room ${selected?.room_number} deleted.`, "success");
      fetchRooms();
    } catch {
      showToast(`Error deleting room.`, "error");
    }
  };

  const deleteAllRooms = async () => {
    if (rooms.length === 0) {
      showToast("No rooms to delete.", "warning");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${BACKEND}/api/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("All rooms deleted.", "success");
      fetchRooms();
    } catch {
      showToast("Failed to delete all rooms.", "error");
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading rooms...</Text>
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      {/* Floating toast UI */}
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

      <ScrollView style={styles.page}>
        <Text style={styles.pageTitle}>🏠 Room Management</Text>

        <View style={styles.formRow}>
          <FormAutoGenerate
            form={form}
            setForm={setForm}
            autoGenerateRooms={autoGenerateRooms}
          />

          <FormAddRoom
            manualForm={manualForm}
            setManualForm={setManualForm}
            addRoom={addRoom}
          />
        </View>

        <WingList
          rooms={rooms}
          wing="east"
          editRoomId={editRoomId}
          editForm={editForm}
          setEditForm={setEditForm}
          handleEdit={handleEdit}
          saveEdit={saveEdit}
          deleteRoom={deleteRoom}
          setEditRoomId={setEditRoomId}
          showToast={showToast}
        />

        <WingList
          rooms={rooms}
          wing="west"
          editRoomId={editRoomId}
          editForm={editForm}
          setEditForm={setEditForm}
          handleEdit={handleEdit}
          saveEdit={saveEdit}
          deleteRoom={deleteRoom}
          setEditRoomId={setEditRoomId}
          showToast={showToast}
        />

        <View style={{ marginTop: 20 }}>
          <Button
            title="🗑️ Delete All Rooms"
            color="red"
            onPress={deleteAllRooms}
          />
        </View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/warden-dashboard")}
        >
          <Text style={styles.backBtnText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ---------------- WING LIST COMPONENT ---------------- */
function WingList({
  rooms,
  wing,
  editRoomId,
  editForm,
  setEditForm,
  handleEdit,
  saveEdit,
  deleteRoom,
  setEditRoomId,
  showToast,
}) {
  return (
    <>
      <Text style={[styles.subHeader, { marginTop: 20 }]}>
        {wing === "east" ? "🧭 East Wing" : "🌇 West Wing"}
      </Text>

      <View style={styles.grid}>
        {rooms
          .filter((r) => r.side?.toLowerCase() === wing)
          .map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              editRoomId={editRoomId}
              editForm={editForm}
              setEditForm={setEditForm}
              handleEdit={handleEdit}
              saveEdit={saveEdit}
              deleteRoom={deleteRoom}
              setEditRoomId={setEditRoomId}
              showToast={showToast} // FIXED
            />
          ))}
      </View>
    </>
  );
}

/* ---------------- FORM: AUTO GENERATE ---------------- */
function FormAutoGenerate({ form, setForm, autoGenerateRooms }) {
  return (
    <View style={[styles.formCard, styles.shadowCard]}>
      <Text style={styles.formHeader}>
        ⚙️ <Text style={{ color: "#0b5cff" }}>Auto Generate Rooms</Text>
      </Text>

      {[
        ["From Room:", "fromRoom", "Eg:101"],
        ["To Room:", "toRoom", "Eg:120"],
        ["Floor:", "floor", "Eg:2"],
        ["East Sharing:", "eastSharing", "Eg:2"],
        ["West Sharing:", "westSharing", "Eg:3"],
      ].map(([label, key, placeholder]) => (
        <View key={key} style={styles.inputBlock}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.inputModern}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            value={form[key]}
            onChangeText={(t) => setForm({ ...form, [key]: t })}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.buttonGradient, { marginTop: 10 }]}
        onPress={autoGenerateRooms}
      >
        <Text style={styles.buttonText}>⚡ Generate Rooms</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- FORM: ADD SINGLE ROOM ---------------- */
function FormAddRoom({ manualForm, setManualForm, addRoom }) {
  return (
    <View style={[styles.formCard, styles.shadowCard]}>
      <Text style={styles.formHeader}>
        🏠 <Text style={{ color: "#0b5cff" }}>Add Single Room</Text>
      </Text>

      {[
        ["Room Number:", "room_number", "Eg:E101"],
        ["Floor:", "floor", "Eg:2"],
        ["Side (East/West):", "side", "Eg:East"],
        ["Sharing:", "sharing", "Eg:2"],
      ].map(([label, key, placeholder]) => (
        <View key={key} style={styles.inputBlock}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.inputModern}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            value={manualForm[key]}
            onChangeText={(t) => setManualForm({ ...manualForm, [key]: t })}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.buttonGradient, { marginTop: 10 }]}
        onPress={addRoom}
      >
        <Text style={styles.buttonText}>➕ Add Room</Text>
      </TouchableOpacity>
    </View>
  );
}

/* -------------- ROOM CARD ---------------- */
function RoomCard({
  room,
  editRoomId,
  editForm,
  setEditForm,
  handleEdit,
  saveEdit,
  deleteRoom,
  setEditRoomId,
  showToast, // FIXED
}) {
  const full = room.occupied >= room.sharing;

  return (
    <View style={[styles.card, full ? styles.fullRoom : styles.availableRoom]}>
      {editRoomId === room.id ? (
        <>
          <Text style={styles.editLabel}>Room Number:</Text>
          <TextInput
            style={styles.input}
            value={editForm.room_number}
            onChangeText={(t) => setEditForm({ ...editForm, room_number: t })}
          />

          <Text style={styles.editLabel}>Floor:</Text>
          <TextInput
            style={styles.input}
            value={String(editForm.floor)}
            onChangeText={(t) => setEditForm({ ...editForm, floor: t })}
          />

          <Text style={styles.editLabel}>Side:</Text>
          <TextInput
            style={styles.input}
            value={editForm.side}
            onChangeText={(t) => setEditForm({ ...editForm, side: t })}
          />

          <Text style={styles.editLabel}>Sharing:</Text>
          <TextInput
            style={styles.input}
            value={String(editForm.sharing)}
            onChangeText={(t) => setEditForm({ ...editForm, sharing: t })}
          />

          <View style={styles.dualBtnRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveText}>💾 Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                showToast(
                  `Cancelled editing ${editForm.room_number}.`,
                  "warning"
                );
                setEditForm({});
                setEditRoomId(null);
              }}
            >
              <Text style={styles.cancelText}>❌ Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.roomNumber}>{room.room_number}</Text>
          <Text style={styles.roomDetail}>
            Floor {room.floor} • {room.side}
          </Text>
          <Text style={styles.occupancy}>
            Sharing: {room.sharing} | Occupied: {room.occupied}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={() => handleEdit(room)}
              style={styles.editBtn}
            >
              <Text style={styles.btnText}>✏️ Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => deleteRoom(room.id)}
              style={styles.delBtn}
            >
              <Text style={styles.btnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

/* ------------------------------ STYLES ------------------------------ */
const { width } = Dimensions.get("window");
const cardWidth = width / 3 - 30;

const styles = StyleSheet.create({
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
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 9999,
  },
  toastIcon: { fontSize: 18, marginRight: 8 },
  toastText: { fontWeight: "700", fontSize: 15, color: "#0f172a" },

  page: { backgroundColor: "#f9fafb", padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 10,
  },

  subHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    backgroundColor: "#f8fafc",
  },

  inputBlock: { marginBottom: 10 },

  label: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
    marginTop: 6,
  },

  editLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 4,
    marginBottom: 2,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: cardWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
  },

  availableRoom: { backgroundColor: "#e0f2fe" },
  fullRoom: { backgroundColor: "#fee2e2" },

  roomNumber: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  roomDetail: { color: "#475569", marginVertical: 3 },
  occupancy: { color: "#334155", fontWeight: "600" },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  dualBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },

  editBtn: {
    backgroundColor: "#93c5fd",
    padding: 6,
    borderRadius: 6,
    width: "48%",
    alignItems: "center",
  },

  delBtn: {
    backgroundColor: "#fca5a5",
    padding: 6,
    borderRadius: 6,
    width: "48%",
    alignItems: "center",
  },

  btnText: { fontWeight: "600", color: "#0f172a" },

  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },

  saveText: { color: "#fff", fontWeight: "700" },

  cancelBtn: {
    backgroundColor: "#cbd5e1",
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },

  cancelText: { color: "#1e293b", fontWeight: "700" },

  backBtn: {
    marginTop: 25,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  backBtnText: { color: "#fff", fontWeight: "700" },

  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  formCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    elevation: 3,
  },

  shadowCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 5,
  },

  formHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
  },

  inputModern: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
  },

  buttonGradient: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.4,
  },
});
