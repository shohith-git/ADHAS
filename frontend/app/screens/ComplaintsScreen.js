import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";

const API_URL = "http://localhost:5000/api/complaints"; // Change 'localhost' to your computer's IP if testing on a real device

export default function ComplaintsScreen() {
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ user_id: "", title: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setComplaints(res.data);
    } catch (err) {
      Alert.alert("Error", "Could not fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!form.user_id || !form.title || !form.description) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    try {
      setLoading(true);
      await axios.post(API_URL, form);
      Alert.alert("Success", "Complaint submitted!");
      setForm({ user_id: "", title: "", description: "" });
      fetchComplaints();
    } catch (err) {
      Alert.alert("Error", "Could not submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Submit a Complaint</Text>
      <TextInput
        style={styles.input}
        placeholder="User ID"
        value={form.user_id}
        onChangeText={(text) => handleChange("user_id", text)}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={form.title}
        onChangeText={(text) => handleChange("title", text)}
      />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Description"
        value={form.description}
        onChangeText={(text) => handleChange("description", text)}
        multiline
      />
      <Button title="Submit" onPress={handleSubmit} disabled={loading} />

      <Text style={styles.heading}>All Complaints</Text>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.complaintItem}>
            <Text style={styles.complaintTitle}>{item.title}</Text>
            <Text>User: {item.user_id}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
        refreshing={loading}
        onRefresh={fetchComplaints}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "bold", marginVertical: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  complaintItem: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  complaintTitle: { fontWeight: "bold" },
});
