import React, { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/css/colorsIndex';
import { getUserInfo } from '@/hooks/config';
import { baseUrl } from '@/shared/baseUrl';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import {
  getLoggedInUserAttendance,
  handleAttendance,
  reset,
} from '@/features/Attendance/attendanceSlice';

import { getOrGenerateDeviceId } from '@/utils/deviceService';
import {
  getCurrentCoordinates,
  requestLocationPermission,
  LocationError,
} from '@/utils/locationService';
import { RootState } from '@/utils/store';
import { useCurrentDate } from '@/Context/DateProvider';

const BarCodeCamera = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  // ---------------------------------------------------------
  // ATTENDANCE STATE (REDUX DERIVED)
  // ---------------------------------------------------------
  const {
    data,
    handleAttendanceisError,
    handleAttendanceisSuccess,
    handleAttendanceisLoading,
    handleAttendancemessage,
  } = useAppSelector((state: RootState) => state.attendance);

  const day = !data?.data?.data?.data ? [] : data?.data?.data?.data;
  const entry = day[0];
  const clockIn = entry?.clockIn;
  const clockOut = entry?.clockOut;

  // Primary dynamic boolean used across UI
  const isClockedIn = Boolean(clockIn && !clockOut);

  // Dynamic text helpers
  const actionLabel = isClockedIn ? 'Clock Out' : 'Clock In';
  const actionProgressLabel = isClockedIn ? 'Clocking Out' : 'Clocking In';

  // ---------------------------------------------------------
  // USER / ATTENDANCE STATE
  // ---------------------------------------------------------
  const [userId, setUserId] = useState<string | null>(null);

  // ---------------------------------------------------------
  // QR / TOKEN STATE
  // ---------------------------------------------------------
  const [scanned, setScanned] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');

  // ---------------------------------------------------------
  // DEVICE / LOCATION STATE
  // ---------------------------------------------------------
  const [deviceId, setDeviceId] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [isAcquiringLocation, setIsAcquiringLocation] = useState(false);
  const [actionStepMessage, setActionStepMessage] = useState('');

  // ---------------------------------------------------------
  // MODAL STATE
  // ---------------------------------------------------------
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    type: 'success',
    title: '',
    message: '',
  });

  const triggerModal = (
    type: 'success' | 'error',
    title: string,
    message: string,
    onConfirm?: () => void,
  ) => {
    setModalConfig({ type, title, message, onConfirm });
    setModalVisible(true);
  };

  const handleModalDismiss = () => {
    setModalVisible(false);
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
  };

  // ---------------------------------------------------------
  // INITIALIZE USER + DEVICE + REDUX DATA
  // ---------------------------------------------------------
  useEffect(() => {
    const initData = async () => {
      try {
        const generatedDeviceId = await getOrGenerateDeviceId();
        setDeviceId(generatedDeviceId);

        const user: any = await getUserInfo();
        if (!user) return;

        const id = user?.data?.user?.id;
        if (!id) return;

        setUserId(id);

        // Populate Redux attendance state directly
        dispatch(getLoggedInUserAttendance(id));
      } catch (error) {
        console.error('[BarCodeCamera] Initialization error:', error);
      }
    };

    initData();
  }, [dispatch]);

  // ---------------------------------------------------------
  // REQUEST CAMERA + LOCATION PERMISSIONS
  // ---------------------------------------------------------
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        if (Platform.OS === 'web') {
          setHasCameraPermission(true);
          setHasLocationPermission(true);
          return;
        }

        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        const cameraGranted = cameraStatus === 'granted';
        setHasCameraPermission(cameraGranted);

        const locationGranted = await requestLocationPermission();
        setHasLocationPermission(locationGranted);

        if (locationGranted) {
          try {
            await getCurrentCoordinates();
          } catch (error) {
            console.warn('[BarCodeCamera] Could not pre-fetch coordinates:', error);
          }
        }
      } catch (error) {
        setHasCameraPermission(false);
        setHasLocationPermission(false);
      }
    };

    requestPermissions();
  }, []);

  // ---------------------------------------------------------
  // ATTENDANCE SUCCESS
  // ---------------------------------------------------------
  useEffect(() => {
    if (!handleAttendanceisSuccess) return;

    setIsAcquiringLocation(false);
    setActionStepMessage('');

    triggerModal(
      'success',
      `${actionLabel} Recorded`,
      handleAttendancemessage || `${actionLabel} was successfully recorded.`,
      () => {
        if (userId) {
          dispatch(getLoggedInUserAttendance(userId));
        }
        navigation.goBack();
      },
    );

    dispatch(reset());
  }, [
    handleAttendanceisSuccess,
    handleAttendancemessage,
    userId,
    dispatch,
    navigation,
    actionLabel,
  ]);

  // ---------------------------------------------------------
  // ATTENDANCE ERROR
  // ---------------------------------------------------------
  useEffect(() => {
    if (!handleAttendanceisError) return;

    setIsAcquiringLocation(false);
    setActionStepMessage('');

    triggerModal(
      'error',
      `${actionLabel} Failed`,
      handleAttendancemessage || `Failed to save record. Please try again.`,
    );

    dispatch(reset());
  }, [handleAttendanceisError, handleAttendancemessage, dispatch, actionLabel]);

  // ---------------------------------------------------------
  // BARCODE SCANNED
  // ---------------------------------------------------------
  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    if (!data) return;
    setScanned(true);
    setToken(data);
  };

  // ---------------------------------------------------------
  // CLOCK IN / CLOCK OUT ACTION
  // ---------------------------------------------------------
  const handleClockAction = async () => {
    const activeToken = Platform.OS === 'web' ? manualToken.trim() : token?.trim();

    if (!activeToken) {
      triggerModal(
        'error',
        'Missing QR Code',
        'Please scan a valid QR code or enter the QR code token.',
      );
      return;
    }

    if (!userId) {
      triggerModal(
        'error',
        'User Error',
        'Unable to retrieve your user information. Please log in again.',
      );
      return;
    }

    try {
      setIsAcquiringLocation(true);
      setActionStepMessage('Verifying device...');

      let currentDeviceId = deviceId;
      if (!currentDeviceId) {
        currentDeviceId = await getOrGenerateDeviceId();
        setDeviceId(currentDeviceId);
      }

      setActionStepMessage('Acquiring GPS location...');
      let userLat: number | undefined;
      let userLng: number | undefined;

      if (Platform.OS !== 'web') {
        if (!hasLocationPermission) {
          throw new LocationError(
            'Location permission is required to verify your attendance.',
            'PERMISSION_DENIED',
          );
        }
        const coords = await getCurrentCoordinates();
        userLat = coords.userLat;
        userLng = coords.userLng;
      } else {
        try {
          const coords = await getCurrentCoordinates();
          userLat = coords.userLat;
          userLng = coords.userLng;
        } catch (locationError) {
          console.warn('[BarCodeCamera] Web location unavailable:', locationError);
        }
      }

      setActionStepMessage(`Submitting ${actionProgressLabel.toLowerCase()}...`);

      const payload: {
        token: string;
        userId: string;
        deviceId: string;
        userLat?: number;
        userLng?: number;
      } = {
        token: activeToken,
        userId,
        deviceId: currentDeviceId,
      };

      if (typeof userLat === 'number' && typeof userLng === 'number') {
        payload.userLat = userLat;
        payload.userLng = userLng;
      }

      dispatch(handleAttendance(payload));
    } catch (error: any) {
      setIsAcquiringLocation(false);
      setActionStepMessage('');

      if (error instanceof LocationError) {
        if (error.code === 'PERMISSION_DENIED') {
          triggerModal(
            'error',
            'Location Permission Required',
            error.message || 'Please enable location permission to verify your attendance.',
            () => {
              if (Platform.OS !== 'web') {
                Linking.openSettings();
              }
            },
          );
        } else {
          triggerModal(
            'error',
            'Location Error',
            error.message || 'Unable to determine your current location.',
          );
        }
        return;
      }

      triggerModal(
        'error',
        `${actionLabel} Error`,
        error?.message || 'An unexpected error occurred while processing your attendance.',
      );
    }
  };

  const handleClose = () => navigation.goBack();

  const handleRescan = () => {
    if (isSubmitting) return;
    setScanned(false);
    setToken(null);
  };

  const isSubmitting = handleAttendanceisLoading || isAcquiringLocation;

  // ---------------------------------------------------------
  // STATUS MODAL
  // ---------------------------------------------------------
  const renderStatusModal = () => (
    <Modal
      transparent
      animationType="fade"
      visible={modalVisible}
      onRequestClose={handleModalDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View
            style={[
              styles.modalIconBg,
              modalConfig.type === 'success' ? styles.iconBgSuccess : styles.iconBgError,
            ]}
          >
            <Ionicons
              name={
                modalConfig.type === 'success'
                  ? 'checkmark-circle-outline'
                  : 'alert-circle-outline'
              }
              size={36}
              color={modalConfig.type === 'success' ? '#16a34a' : '#dc2626'}
            />
          </View>

          <Text style={styles.modalTitle}>{modalConfig.title}</Text>
          <Text style={styles.modalMessage}>{modalConfig.message}</Text>

          <TouchableOpacity
            style={[
              styles.modalButton,
              modalConfig.type === 'success' ? styles.btnSuccess : styles.btnError,
            ]}
            onPress={handleModalDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.modalButtonText}>
              {modalConfig.type === 'success' ? 'Done' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ---------------------------------------------------------
  // WEB VIEW
  // ---------------------------------------------------------
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {renderStatusModal()}

        <TouchableOpacity style={styles.closeButtonWeb} onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#374151" />
        </TouchableOpacity>

        <View style={styles.webCard}>
          <View style={styles.iconHeader}>
            <Ionicons name="qr-code-outline" size={32} color={colors.accent_blue} />
          </View>

          <Text style={styles.webTitle}>{actionLabel}</Text>

          <Text style={styles.webSubtitle}>
            Enter the token from the dashboard to {isClockedIn ? 'end your shift' : 'record your attendance'}.
          </Text>

          <TextInput
            style={styles.webInput}
            placeholder="Paste QR token here..."
            placeholderTextColor="#9ca3af"
            value={manualToken}
            onChangeText={(text) => {
              setManualToken(text);
              setToken(text);
            }}
            editable={!isSubmitting}
          />

          {actionStepMessage ? (
            <View style={styles.statusStepContainer}>
              <ActivityIndicator size="small" color={colors.accent_blue} />
              <Text style={styles.statusStepText}>{actionStepMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!manualToken.trim() || isSubmitting) && styles.disabledButton,
            ]}
            onPress={handleClockAction}
            disabled={!manualToken.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------
  // PERMISSION STATES
  // ---------------------------------------------------------
  if (hasCameraPermission === null || hasLocationPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={colors.accent_blue} />
        <Text style={styles.permissionText}>
          Requesting Camera & Location Permissions...
        </Text>
      </View>
    );
  }

  if (!hasCameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.deniedIconBg}>
          <Ionicons name="camera-outline" size={36} color={colors.accent_blue} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to scan attendance QR codes at your work location.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasLocationPermission) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.deniedIconBg}>
          <Ionicons name="location-outline" size={36} color={colors.accent_blue} />
        </View>
        <Text style={styles.permissionTitle}>Location Access Required</Text>
        <Text style={styles.permissionText}>
          Your location is required to verify that you are within the approved office geofence.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Linking.openSettings()}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------------------------------------------------------
  // CAMERA / QR SCANNER
  // ---------------------------------------------------------
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar backgroundColor="#050505" barStyle="light-content" translucent={false} />

      {renderStatusModal()}

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417'],
        }}
      >
        <View style={styles.overlay}>
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.headerTag}>ATTENDANCE</Text>
              <Text style={styles.headerTitle}>{actionProgressLabel}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButtonFloating}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#1f2937" />
            </TouchableOpacity>
          </View>

          {/* SCANNER FRAME */}
          <View style={styles.scannerFrameContainer}>
            <View style={[styles.scannerFrame, scanned && styles.scannerFrameSuccess]}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {!scanned && (
                <Text style={styles.scanInstruction}>
                  Align QR code inside frame
                </Text>
              )}
            </View>
          </View>

          {/* BOTTOM SECTION */}
          <View
            style={[
              styles.bottomSection,
              {
                paddingBottom:
                  Platform.OS === 'android'
                    ? Math.max(insets.bottom, 48) + 12
                    : Math.max(insets.bottom, 18),
              },
            ]}
          >
            {scanned ? (
              <View style={styles.resultCard}>
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.successBadgeText}>Code Scanned</Text>
                </View>

                <Text style={styles.cardTitle}>Ready to {actionLabel}</Text>

                <Text style={styles.cardSubtitle}>
                  Your device ID and GPS location will be verified against the office geofence before your attendance is recorded.
                </Text>

                {actionStepMessage ? (
                  <View style={styles.statusStepContainer}>
                    <ActivityIndicator size="small" color={colors.accent_blue} />
                    <Text style={styles.statusStepText}>{actionStepMessage}</Text>
                  </View>
                ) : (
                  <View style={styles.verificationInfo}>
                    <View style={styles.verificationRow}>
                      <Ionicons name="phone-portrait-outline" size={17} color="#6b7280" />
                      <Text style={styles.verificationText}>Device verification</Text>
                      <Ionicons name="checkmark-circle" size={17} color="#16a34a" />
                    </View>

                    <View style={styles.verificationRow}>
                      <Ionicons name="location-outline" size={17} color="#6b7280" />
                      <Text style={styles.verificationText}>GPS verification</Text>
                      <Ionicons name="checkmark-circle" size={17} color="#16a34a" />
                    </View>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={handleRescan}
                    style={styles.secondaryButton}
                    activeOpacity={0.7}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#374151" />
                    <Text style={styles.secondaryButtonText}>Rescan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { flex: 1 },
                      isSubmitting && styles.disabledButton,
                    ]}
                    onPress={handleClockAction}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>{actionLabel}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.hintContainer}>
                <Ionicons
                  name="scan-outline"
                  size={20}
                  color="#ffffff"
                  style={{ opacity: 0.8 }}
                />
                <Text style={styles.hintText}>
                  Point your camera at the office QR code
                </Text>
              </View>
            )}
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

export default BarCodeCamera;

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  // =========================================================
  // GLOBAL / CAMERA
  // =========================================================

  mainContainer: {
    flex: 1,
    backgroundColor: '#050505',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'space-between',
  },

  // =========================================================
  // TOP BAR
  // =========================================================

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 18,
    paddingBottom: 10,
  },

  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.8,
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },

  closeButtonFloating: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.94)',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  // =========================================================
  // SCANNER
  // =========================================================

  scannerFrameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },

  scannerFrame: {
    width: 270,
    height: 270,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  scannerFrameSuccess: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.08)',
  },

  scanInstruction: {
    position: 'absolute',
    bottom: -48,

    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.accent_blue,
  },

  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },

  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },

  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },

  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },

  // =========================================================
  // CAMERA BOTTOM SECTION
  // =========================================================

  bottomSection: {
    paddingHorizontal: 16,
  },

  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    alignSelf: 'center',

    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',

    paddingVertical: 11,
    paddingHorizontal: 17,

    borderRadius: 24,

    marginBottom: 2,
  },

  hintText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },

  // =========================================================
  // RESULT CARD
  // =========================================================

  resultCard: {
    backgroundColor: '#ffffff',

    borderRadius: 24,

    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },

  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    alignSelf: 'flex-start',

    backgroundColor: '#ecfdf3',

    borderWidth: 1,
    borderColor: '#bbf7d0',

    paddingVertical: 6,
    paddingHorizontal: 10,

    borderRadius: 20,

    marginBottom: 12,
  },

  successBadgeText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },

  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',

    marginTop: 6,
    marginBottom: 16,

    lineHeight: 19,
  },

  // =========================================================
  // VERIFICATION STATUS
  // =========================================================

  verificationInfo: {
    backgroundColor: '#f8fafc',

    borderWidth: 1,
    borderColor: '#e5e7eb',

    borderRadius: 14,

    paddingVertical: 4,
    paddingHorizontal: 12,

    marginBottom: 16,
  },

  verificationRow: {
    minHeight: 42,

    flexDirection: 'row',
    alignItems: 'center',

    borderBottomWidth: 1,
    borderBottomColor: '#edf0f2',
  },

  verificationRowLast: {
    borderBottomWidth: 0,
  },

  verificationText: {
    flex: 1,

    marginLeft: 9,

    fontSize: 13,
    fontWeight: '500',

    color: '#4b5563',
  },

  // =========================================================
  // ACTION BUTTONS
  // =========================================================

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  primaryButton: {
    height: 48,

    backgroundColor: colors.accent_blue,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 18,

    shadowColor: colors.accent_blue,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 4,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryButton: {
    height: 48,

    minWidth: 104,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#f3f4f6',

    borderWidth: 1,
    borderColor: '#e5e7eb',

    borderRadius: 12,

    paddingHorizontal: 14,
  },

  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  disabledButton: {
    opacity: 0.48,
    shadowOpacity: 0,
    elevation: 0,
  },

  // =========================================================
  // STATUS / LOADING
  // =========================================================

  statusStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#eff6ff',

    borderWidth: 1,
    borderColor: '#dbeafe',

    borderRadius: 12,

    paddingVertical: 10,
    paddingHorizontal: 12,

    marginBottom: 14,
  },

  statusStepText: {
    flex: 1,

    marginLeft: 9,

    fontSize: 12,
    lineHeight: 17,

    color: colors.accent_blue,

    fontWeight: '600',
  },

  // =========================================================
  // MODAL
  // =========================================================

  modalOverlay: {
    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.62)',

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,

    backgroundColor: '#ffffff',

    borderRadius: 24,

    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,

    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 15,
  },

  modalIconBg: {
    width: 68,
    height: 68,

    borderRadius: 34,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 16,
  },

  iconBgSuccess: {
    backgroundColor: '#ecfdf3',
  },

  iconBgError: {
    backgroundColor: '#fef2f2',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',

    color: '#111827',

    textAlign: 'center',

    marginBottom: 7,
  },

  modalMessage: {
    fontSize: 14,
    lineHeight: 21,

    color: '#6b7280',

    textAlign: 'center',

    marginBottom: 22,
  },

  modalButton: {
    width: '100%',
    height: 48,

    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',
  },

  btnSuccess: {
    backgroundColor: '#16a34a',
  },

  btnError: {
    backgroundColor: '#dc2626',
  },

  modalButtonText: {
    color: '#ffffff',

    fontSize: 15,
    fontWeight: '700',
  },

  // =========================================================
  // PERMISSION SCREEN
  // =========================================================

  permissionContainer: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 32,

    backgroundColor: '#ffffff',
  },

  deniedIconBg: {
    width: 76,
    height: 76,

    borderRadius: 38,

    backgroundColor: '#eff6ff',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 18,
  },

  permissionTitle: {
    fontSize: 21,
    fontWeight: '700',

    color: '#111827',

    textAlign: 'center',

    marginBottom: 9,
  },

  permissionText: {
    maxWidth: 350,

    fontSize: 14,
    lineHeight: 21,

    color: '#6b7280',

    textAlign: 'center',

    marginBottom: 24,
  },

  permissionButton: {
    minWidth: 160,
    height: 46,

    backgroundColor: colors.accent_blue,

    paddingHorizontal: 24,

    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',
  },

  permissionButtonText: {
    color: '#ffffff',

    fontSize: 15,
    fontWeight: '700',
  },

  // =========================================================
  // WEB
  // =========================================================

  webContainer: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#f7f8fa',

    paddingHorizontal: 24,
  },

  closeButtonWeb: {
    position: 'absolute',

    top: 24,
    right: 24,

    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: '#ffffff',

    borderWidth: 1,
    borderColor: '#e5e7eb',

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  webCard: {
    width: '100%',
    maxWidth: 430,

    backgroundColor: '#ffffff',

    borderRadius: 24,

    paddingHorizontal: 28,
    paddingVertical: 30,

    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#eaecf0',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },

  iconHeader: {
    width: 68,
    height: 68,

    borderRadius: 34,

    backgroundColor: '#eff6ff',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 18,
  },

  webTitle: {
    fontSize: 23,
    fontWeight: '700',

    color: '#111827',

    textAlign: 'center',

    marginBottom: 7,
  },

  webSubtitle: {
    maxWidth: 350,

    fontSize: 14,
    lineHeight: 21,

    color: '#6b7280',

    textAlign: 'center',

    marginBottom: 22,
  },

  webInput: {
    width: '100%',
    height: 50,

    borderWidth: 1,
    borderColor: '#d1d5db',

    borderRadius: 12,

    paddingHorizontal: 15,

    fontSize: 15,

    color: '#111827',

    backgroundColor: '#f9fafb',

    marginBottom: 14,

    outlineStyle: 'none',
  } as any,

  // =========================================================
  // LEGACY / FALLBACK STYLES
  // Keep these only if another part of the component uses them.
  // =========================================================

  closeButton: {
    position: 'absolute',

    width: 40,
    height: 40,

    right: 20,
    top: Platform.OS === 'android' ? 42 : 52,

    backgroundColor: '#ffffff',

    borderRadius: 20,

    justifyContent: 'center',
    alignItems: 'center',

    zIndex: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 5,
  },

  headerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  container: {
    flex: 1,
  },

  camera: {
    flex: 1,
  },

  subContainer: {
    padding: 20,

    backgroundColor: '#ffffff',

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  photo_container: {
    marginBottom: 14,
  },

  text_take: {
    fontSize: 21,
    fontWeight: '700',

    color: colors.gray900,
  },

  text_take_sub: {
    fontSize: 14,

    color: colors.gray500,

    marginTop: 6,

    lineHeight: 20,
  },

  buttonContainer: {
    height: 48,

    backgroundColor: colors.accent_blue,

    paddingHorizontal: 18,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  text: {
    color: '#ffffff',

    fontSize: 15,
    fontWeight: '700',
  },

  scanAgainButton: {
    backgroundColor: '#ffffff',

    alignSelf: 'center',

    marginBottom: 16,

    paddingHorizontal: 20,
    paddingVertical: 10,

    borderRadius: 22,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },

  scanAgainText: {
    fontWeight: '700',

    color: colors.accent_blue,

    fontSize: 14,
  },

  webForm: {
    width: '100%',
    maxWidth: 430,

    alignItems: 'center',
  },
});
