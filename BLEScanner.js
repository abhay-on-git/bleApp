import React, { useEffect, useState } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Buffer } from 'buffer';
import {
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform,
  Alert,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const BLEScanner = () => {
  const [bleManager] = useState(new BleManager());
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestPermissions().then(granted => {
        if (granted) startScan();
      });
    } else {
      startScan(); // Start scanning directly on iOS
    }

    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  // Function to request permissions on Android
  async function requestPermissions() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allPermissionsGranted = Object.values(granted).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!allPermissionsGranted) {
        Alert.alert(
          'Permissions required',
          'Bluetooth and Location permissions are needed to scan for devices.',
        );
        return false;
      }
    }
    return true;
  }

  // Function to start scanning for BLE devices
  const startScan = () => {
    console.log('Starting BLE scan...');
    const timestamp = new Date().toISOString();

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('BLE Scan Error:', error);
        return;
      }

      // Filter for Google devices based on the device name or ID
      if (device && (device.name?.includes('Google') || device.id.startsWith('00:00:00'))) {
        const macAddress = device.id;
        const rssi = device.rssi;
        let payloadDataHex = null;
        if (device.manufacturerData) {
          const payloadDataBuffer = Buffer.from(device.manufacturerData, 'base64');
          payloadDataHex = payloadDataBuffer.toString('hex');
        }

        // const payloadData = device.manufacturerData || device.serviceData;

        // If you want to capture location from the mobile device:
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            const newDevice = {
              name: device.name || 'Unnamed device',
              macAddress,
              rssi,
              payloadDataHex, // Decode if necessary
              latitude,
              longitude,
              timestamp
            }
            setDevices([...devices , newDevice])
            console.log(
              'Found Google device:',
              {
                name: device.name || 'Unnamed device',
                macAddress,
                rssi,
                payloadDataHex, // Decode if necessary
                latitude,
                longitude,
                timestamp
              }
            );
          },
          error => console.error('Location Error:', error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
        );
      }
    });
  };


  // Function to render the signal strength as a progress bar
  const renderSignalStrengthMeter = rssi => {
    if (rssi == null) return null;

    const strength =
      rssi > -20
        ? 6
        : rssi > -40
          ? 5
          : rssi > -60
            ? 4
            : rssi > -80
              ? 3
              : rssi > -100
                ? 2
                : 1; // 4 bars for strong, 3 for medium, 2 for weak, 1 for very weak

    return (
      <View style={styles.signalStrengthContainer}>
        <Text style={styles.signalStrengthText}>Signal Strength:</Text>
        <View style={styles.signalBars}>
          {[...Array(6)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.signalBar,
                {
                  backgroundColor: index < strength ? '#4CAF50' : '#E0E0E0',
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderDevice = ({ item }) => (
    <View style={styles.deviceContainer}>
      <Text style={styles.deviceName}>{item.name || 'Unnamed Device'}</Text>
      <Text style={styles.deviceId}>ID: {item.id}</Text>
      <Text>{item.rssi}</Text>
      {renderSignalStrengthMeter(item.rssi)}{' '}
      {/* Display the signal strength meter */}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>BLE Devices Scanned:</Text>
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          renderItem={renderDevice}
          ListEmptyComponent={
            <Text style={styles.noDevices}>No Google devices found.</Text>
          }
        />
        {/* <Button title="Rescan for Devices" onPress={startScan} /> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F4F8',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  noDevices: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#999',
  },
  deviceContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'column',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deviceId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  signalStrengthContainer: {
    marginTop: 8,
  },
  signalStrengthText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  signalBar: {
    width: 15,
    height: 10,
    borderRadius: 3,
    marginRight: 5,
  },
});

export default BLEScanner;
