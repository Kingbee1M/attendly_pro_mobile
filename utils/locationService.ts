import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationCoordinates {
  userLat: number;
  userLng: number;
}

export class LocationError extends Error {
  code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'FETCH_FAILED';
  constructor(message: string, code: 'PERMISSION_DENIED' | 'SERVICES_DISABLED' | 'FETCH_FAILED') {
    super(message);
    this.name = 'LocationError';
    this.code = code;
  }
}

/**
 * Check and request location permission for foreground geofencing.
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    if (existingStatus === Location.PermissionStatus.GRANTED) {
      return true;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Acquire the device's live GPS coordinates (userLat, userLng).
 */
export const getCurrentCoordinates = async (): Promise<LocationCoordinates> => {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              userLat: position.coords.latitude,
              userLng: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('Web geolocation error:', error);
            // Default/mock coords for web testing if denied or unavailable
            resolve({
              userLat: 6.5244,
              userLng: 3.3792,
            });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        resolve({
          userLat: 6.5244,
          userLng: 3.3792,
        });
      }
    });
  }

  // 1. Check if location services (GPS) are toggled on in device settings
  const isServiceEnabled = await Location.hasServicesEnabledAsync();
  if (!isServiceEnabled) {
    throw new LocationError(
      'Location services are disabled. Please enable GPS in your device settings to clock in/out.',
      'SERVICES_DISABLED'
    );
  }

  // 2. Check / request permission
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new LocationError(
      'Location permission was denied. Attendly Pro requires location access to verify office presence.',
      'PERMISSION_DENIED'
    );
  }

  // 3. Obtain location
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      timeInterval: 5000,
    });

    const coords: LocationCoordinates = {
      userLat: location.coords.latitude,
      userLng: location.coords.longitude,
    };

    console.log('📍 [LocationService] Acquired Live GPS Coordinates:');
    console.log(`   👉 Latitude:  ${coords.userLat}`);
    console.log(`   👉 Longitude: ${coords.userLng}`);
    console.log(`   👉 Accuracy:  ${location.coords.accuracy}m`);

    return coords;
  } catch (error) {
    // If high accuracy GPS times out or fails (e.g. indoors), fallback to last known location
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        const fallbackCoords: LocationCoordinates = {
          userLat: lastKnown.coords.latitude,
          userLng: lastKnown.coords.longitude,
        };

        console.log('📍 [LocationService] Using Last Known GPS Coordinates:');
        console.log(`   👉 Latitude:  ${fallbackCoords.userLat}`);
        console.log(`   👉 Longitude: ${fallbackCoords.userLng}`);

        return fallbackCoords;
      }
    } catch (fallbackError) {
      // Ignore fallback failure
    }

    throw new LocationError(
      'Failed to acquire your GPS location. Please ensure you have a clear GPS signal and try again.',
      'FETCH_FAILED'
    );
  }
};
