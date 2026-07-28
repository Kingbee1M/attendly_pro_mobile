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
import { colors } from '@/css/colorsIndex';
import { getUserInfo } from '@/hooks/config';
import { baseUrl } from '@/shared/baseUrl';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { getLoggedInUserAttendance, handleAttendance, reset } from '@/features/Attendance/attendanceSlice';

const BarCodeCamera = ({ navigation }: any) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const {
    isLoading,
    handleAttendanceisError,
    handleAttendanceisSuccess,
    handleAttendanceisLoading,
    handleAttendancemessage,
  }: any = useAppSelector((state) => state.attendance);

  const [scanned, setScanned] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | any>(null);
  const [hasClockedIn, setHasClockedIn] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [input, setInput] = useState({ token: '', userId: '' });

  // --- Modal State ---
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

  const dispatch = useAppDispatch();

  // Custom function to open our modern modal
  const triggerModal = (type: 'success' | 'error', title: string, message: string, onConfirm?: () => void) => {
    setModalConfig({ type, title, message, onConfirm });
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const user: any = await getUserInfo();
      if (user) {
        const uId = user?.data?.user?.id;
        const userJwtToken = user?.token;
        setUserId(uId);

        if (uId && userJwtToken) {
          try {
            const response = await fetch(`${baseUrl}/api/v1/attendance/${uId}`, {
              headers: { Authorization: `Bearer ${userJwtToken}` },
            });
            const status = await response.json();
            setHasClockedIn(status?.hasClockedIn);
          } catch (err) {
            console.error('Error fetching attendance status:', err);
          }
        }
      }
    };

    fetchUser();
  }, []);

  // Show Success Modal
  useEffect(() => {
    if (handleAttendanceisSuccess) {
      triggerModal('success', 'Attendance Recorded', handleAttendancemessage || 'Operation completed successfully.', () => {
        dispatch(getLoggedInUserAttendance(userId));
        navigation.goBack();
      });
      dispatch(reset());
    }
  }, [handleAttendanceisSuccess]);

  // Show Error Modal
  useEffect(() => {
    if (handleAttendanceisError) {
      triggerModal('error', 'Clock In Failed', handleAttendancemessage || 'Something went wrong. Please try again.');
      dispatch(reset());
    }
  }, [handleAttendanceisError]);

  useEffect(() => {
    if (userId && token) {
      setInput((prev) => ({
        ...prev,
        token: token,
        userId: userId,
      }));
    }
  }, [token, userId]);

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'web') {
        setHasPermission(true);
        return;
      }
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    requestPermission();
  }, []);

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    setScanned(true);
    setToken(data);
  };

  const handleClockAction = async () => {
    const payload = Platform.OS === 'web' ? { token: manualToken, userId } : input;
    dispatch(handleAttendance(payload));
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleModalDismiss = () => {
    setModalVisible(false);
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
  };

  // --- RENDER MODAL COMPONENT ---
  const renderStatusModal = () => (
    <Modal
      transparent
      animationType="fade"
      visible={modalVisible}
      onRequestClose={handleModalDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Status Icon */}
          <View style={[styles.modalIconBg, modalConfig.type === 'success' ? styles.iconBgSuccess : styles.iconBgError]}>
            <Ionicons
              name={modalConfig.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={36}
              color={modalConfig.type === 'success' ? '#16a34a' : '#dc2626'}
            />
          </View>

          <Text style={styles.modalTitle}>{modalConfig.title}</Text>
          <Text style={styles.modalMessage}>{modalConfig.message}</Text>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.modalButton, modalConfig.type === 'success' ? styles.btnSuccess : styles.btnError]}
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

  // --- WEB VIEW ---
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
          <Text style={styles.webTitle}>{hasClockedIn ? 'Clock Out' : 'Clock In'}</Text>
          <Text style={styles.webSubtitle}>
            Enter the token from the dashboard to {hasClockedIn ? 'end your shift' : 'record your attendance'}.
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
          />

          <TouchableOpacity
            style={[styles.primaryButton, (!manualToken || handleAttendanceisLoading) && styles.disabledButton]}
            onPress={handleClockAction}
            disabled={!manualToken || handleAttendanceisLoading}
            activeOpacity={0.8}
          >
            {handleAttendanceisLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>{hasClockedIn ? 'Clock Out' : 'Clock In'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- PERMISSION LOADING ---
  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={colors.accent_blue} />
        <Text style={styles.permissionText}>Initializing Camera...</Text>
      </View>
    );
  }

  // --- PERMISSION DENIED ---
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.deniedIconBg}>
          <Ionicons name="camera-outline" size={36} color={colors.accent_blue} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to scan attendance QR codes at your work location.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => Linking.openSettings()} activeOpacity={0.8}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- CAMERA / SCANNER VIEW ---
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      {renderStatusModal()}

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'pdf417'] }}
      >
        <View style={styles.overlay}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.headerTag}>ATTENDANCE</Text>
              <Text style={styles.headerTitle}>{hasClockedIn ? 'Clocking Out' : 'Clocking In'}</Text>
            </View>
            <TouchableOpacity style={styles.closeButtonFloating} onPress={handleClose} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color="#1f2937" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Target */}
          <View style={styles.scannerFrameContainer}>
            <View style={[styles.scannerFrame, scanned && styles.scannerFrameSuccess]}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {!scanned && <Text style={styles.scanInstruction}>Align QR code inside frame</Text>}
            </View>
          </View>

          {/* Bottom Card Area */}
          <View style={styles.bottomSection}>
            {scanned ? (
              <View style={styles.resultCard}>
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.successBadgeText}>Code Scanned</Text>
                </View>

                <Text style={styles.cardTitle}>{hasClockedIn ? 'Ready to Clock Out' : 'Ready to Clock In'}</Text>
                <Text style={styles.cardSubtitle}>
                  Confirm your submission below to {hasClockedIn ? 'end your shift' : 'record your entry'}.
                </Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => setScanned(false)}
                    style={styles.secondaryButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#374151" />
                    <Text style={styles.secondaryButtonText}>Rescan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={handleClockAction}
                    disabled={handleAttendanceisLoading}
                    activeOpacity={0.8}
                  >
                    {handleAttendanceisLoading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>{hasClockedIn ? 'Clock Out' : 'Clock In'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.hintContainer}>
                <Ionicons name="scan-outline" size={20} color="#ffffff" style={{ opacity: 0.8 }} />
                <Text style={styles.hintText}>Point your camera at the office QR code</Text>
              </View>
            )}
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Custom Status Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBgSuccess: {
    backgroundColor: '#f0fdf4',
  },
  iconBgError: {
    backgroundColor: '#fef2f2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    height: 46,
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
    fontWeight: '600',
  },

  // Overlay & Frame
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButtonFloating: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Target Box
  scannerFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrameSuccess: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  scanInstruction: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.accent_blue,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },

  // Bottom Area & Cards
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignSelf: 'center',
  },
  hintText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  successBadgeText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Buttons & Inputs
  primaryButton: {
    backgroundColor: colors.accent_blue,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    height: 46,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },

  // Permissions Layout
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
  },
  deniedIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.accent_blue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Web Layout
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  closeButtonWeb: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconHeader: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  webTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  webSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  webInput: {
    width: '100%',
    height: 46,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
});

export default BarCodeCamera;