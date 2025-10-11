// File: frontend/components/AttendanceScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Location from "expo-location";
import axios from "axios";

export default function AttendanceScreen() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      // Request Camera permission
      const cameraStatus = await BarCodeScanner.requestPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");

      // Request Location permission
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(locationStatus.status === "granted");
    })();
  }, []);

  // Function to handle scanned QR code
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    Alert.alert("QR Code Scanned", data);

    try {
      const location = await Location.getCurrentPositionAsync({});
      await axios.post("http://localhost:5000/api/attendance", {
        student_id: 1, // Replace with logged-in student ID dynamically later
        method: "QR",
        location: `${location.coords.latitude},${location.coords.longitude}`,
      });
      Alert.alert("Success", "Attendance marked successfully!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to mark attendance");
    }
  };

  if (hasCameraPermission === null || hasLocationPermission === null) {
    return <Text>Requesting camera and location permissions...</Text>;
  }
  if (!hasCameraPermission || !hasLocationPermission) {
    return <Text>No access to camera or location</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={{ flex: 1 }}
      />
      {scanned && (
        <Button title={"Tap to Scan Again"} onPress={() => setScanned(false)} />
      )}

      {/* GPS-only attendance button */}
      <Button
        title="Mark Attendance via GPS"
        onPress={async () => {
          try {
            const location = await Location.getCurrentPositionAsync({});
            await axios.post("http://localhost:5000/api/attendance", {
              student_id: 1, // replace with logged-in student ID
              method: "GPS",
              location: `${location.coords.latitude},${location.coords.longitude}`,
            });
            Alert.alert("Success", "Attendance marked via GPS!");
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to mark GPS attendance");
          }
        }}
      />
    </View>
  );
}
