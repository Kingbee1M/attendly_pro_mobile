import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'attendly_device_id';

/**
 * Generate a random UUID fallback if native identifiers are unavailable.
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Retrieve the saved device ID from SecureStore (or AsyncStorage),
 * or generate/acquire a stable hardware-backed device ID and persist it.
 */
export const getOrGenerateDeviceId = async (): Promise<string> => {
  try {
    // 1. Try reading from SecureStore first (encrypted on-device storage)
    if (Platform.OS !== 'web') {
      try {
        const secureDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (secureDeviceId && secureDeviceId.trim().length > 0) {
          return secureDeviceId.trim();
        }
      } catch (err) {
        // SecureStore might fail in some rare contexts, fallback to AsyncStorage
      }
    }

    // 2. Try reading from AsyncStorage as fallback
    try {
      const asyncDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (asyncDeviceId && asyncDeviceId.trim().length > 0) {
        // Sync to SecureStore if possible
        if (Platform.OS !== 'web') {
          SecureStore.setItemAsync(DEVICE_ID_KEY, asyncDeviceId.trim()).catch(() => {});
        }
        return asyncDeviceId.trim();
      }
    } catch (err) {
      // Ignore and proceed to hardware ID detection
    }

    // 3. Acquire hardware/OS-level identifier
    let deviceId: string | null = null;

    if (Platform.OS === 'android') {
      // Android SSAID - 64-bit hex string unique to each combination of app-signing key, user, and device
      try {
        deviceId = Application.getAndroidId();
      } catch (e) {
        deviceId = null;
      }
    } else if (Platform.OS === 'ios') {
      // iOS IDFV - identifier for vendor, unique per vendor on the device
      try {
        deviceId = await Application.getIosIdForVendorAsync();
      } catch (e) {
        deviceId = null;
      }
    }

    // 4. Fallback if hardware identifier is null, empty, or web
    if (!deviceId || deviceId.trim().length === 0) {
      const prefix = Platform.OS === 'web' ? 'web_' : `${Platform.OS}_`;
      deviceId = `${prefix}${generateUUID()}`;
    }

    deviceId = deviceId.trim();

    // 5. Persist permanently
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
      }
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    } catch (err) {
      // Failed to save, still return the generated ID
    }

    return deviceId;
  } catch (error) {
    // Ultimate fallback
    const fallbackId = `fallback_${generateUUID()}`;
    return fallbackId;
  }
};

/**
 * Get device diagnostic metadata for logging/attendance context
 */
export const getDeviceMetadata = () => {
  return {
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    platform: Platform.OS,
  };
};
