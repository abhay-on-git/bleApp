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
import { wrap } from 'module';


// Dummy Device for testing the UI
// {
//   name: 'BLE Beacon A', // Default name or fallback to 'Unnamed device'
//   macAddress: '00:A0:C9:14:C8:29', // Example MAC address
//   rssi: -70, // Example RSSI value indicating signal strength
//   payloadDataHex: '1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f1a2b3c4d5e6f', // Example hexadecimal payload data
//   latitude: 37.7749, // Example latitude (San Francisco)
//   longitude: -122.4194, // Example longitude (San Francisco)
//   timestamp: new Date().toISOString() // Current time in ISO format
// }

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
    // const timestamp = new Date().toISOString();
    const timestamp = formatDateTime();

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
          payloadDataHex = payloadDataBuffer.toString('hex').toUpperCase();
        }

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
            };

            // Check if device already exists
            setDevices(prevDevices => {
              const deviceExists = prevDevices.some(dev => dev.macAddress === newDevice.macAddress);
              if (!deviceExists) {
                return [...prevDevices, newDevice];
              } else {
                // Optionally update existing device data
                return prevDevices.map(dev =>
                  dev.macAddress === newDevice.macAddress ? newDevice : dev
                );
              }
            });
          },
          error => {
            console.error('Location Error:', error);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
        );
      }
    });
  };

  function formatDateTime() {
    const date = new Date();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
  
    const formattedDate = [
      month.toString().padStart(2, '0'),
      day.toString().padStart(2, '0'),
      year
    ].join('/');
  
    const formattedTime = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  
    return `${formattedDate} ${formattedTime} ${ampm}`;
  }
  

  // Function to render the signal strength as a progress bar
  // const renderSignalStrengthMeter = rssi => {
  //   if (rssi == null) return null;

  //   const strength =
  //     rssi > -20
  //       ? 6
  //       : rssi > -40
  //         ? 5
  //         : rssi > -60
  //           ? 4
  //           : rssi > -80
  //             ? 3
  //             : rssi > -100
  //               ? 2
  //               : 1; // 4 bars for strong, 3 for medium, 2 for weak, 1 for very weak

  //   return (
  //     <View style={styles.signalStrengthContainer}>
  //       <Text style={styles.signalStrengthText}>Signal Strength:</Text>
  //       <View style={styles.signalBars}>
  //         {[...Array(6)].map((_, index) => (
  //           <View
  //             key={index}
  //             style={[
  //               styles.signalBar,
  //               {
  //                 backgroundColor: index < strength ? '#4CAF50' : '#E0E0E0',
  //               },
  //             ]}
  //           />
  //         ))}
  //       </View>
  //     </View>
  //   );
  // };

  // const renderDevice = ({ item }) => (
  //   <View style={styles.deviceContainer}>
  //     <Text style={styles.deviceName}>{item.name || 'Unnamed Device'}</Text>
  //     <Text style={styles.deviceId}>ID: {item.id}</Text>
  //     <Text>{item.rssi}</Text>
  //     {renderSignalStrengthMeter(item.rssi)}{' '}
  //     {/* Display the signal strength meter */}
  //   </View>
  // );

  const renderBleDevice = ({ item }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoContainer}>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Name</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.name || 'Unnamed Device'}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>MAC address</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.macAddress}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Payload Data</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.payloadDataHex}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Latitude</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.latitude}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Longitude</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoValue}>{item.longitude}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>Timestamp</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoRssi}>{item.timestamp}</Text>
        </View>
        <View style={styles.infoChild}>
          <Text style={styles.infoTitle}>RSSI</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.infoRssi}>{item.rssi} dBm</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>BLE Devices Scanned:</Text>
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          renderItem={renderBleDevice}
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

  infoCard: {
    flex: 1,
    // height:"auto",
    borderBottomWidth: 0.8,
    borderColor: 'black',
    padding: 9,
  },

  infoContainer: {
    flex: 1,
    width: '100%',
    marginVertical: 1,
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  infoChild: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  infoTitle: {
    fontSize: 13,
    color: '#333',
    fontWeight:'500',
    flex: 1,
    textAlign: 'left',
  },
  separator: {
    fontSize: 13,
    color: '#333',
    paddingHorizontal: 5,
  },
  infoValue: {
    paddingLeft: 6,
    fontSize: 13,
    fontWeight:'600',
    color: '#333',
    flex: 2,
    textAlign: 'left',
  },
  infoRssi: {
    paddingLeft: 6,
    fontSize: 13,
    fontWeight:'600',
    color: '#e5622f',
    flex: 2,
    textAlign: 'left',
  },






  container: {
    flex: 1,
    borderBottomColor: '#000',
    backgroundColor: '#FFFFFF',
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
