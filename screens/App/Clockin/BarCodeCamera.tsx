import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, TextInput, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/css/colorsIndex';
import { getUserInfo } from '@/hooks/config';
import { BlackX } from '@/assets/svg/BlackX';
import { baseUrl } from '@/shared/baseUrl';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { getLoggedInUserAttendance, handleAttendance, reset } from '@/features/Attendance/attendanceSlice';
import { getOrGenerateDeviceId } from '@/utils/deviceService';
import { getCurrentCoordinates, requestLocationPermission, LocationError } from '@/utils/locationService';

const BarCodeCamera = ({ navigation }: any) => {
	const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
	const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
	const { handleAttendanceisError, handleAttendanceisSuccess, handleAttendanceisLoading, handleAttendancemessage }: any = useAppSelector((state) => state.attendance);
	const [scanned, setScanned] = useState(false);
	const [token, setToken] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [deviceId, setDeviceId] = useState<string>('');
	const [hasClockedIn, setHasClockedIn] = useState(false);
	const [manualToken, setManualToken] = useState('');
	const [isAcquiringLocation, setIsAcquiringLocation] = useState(false);
	const [actionStepMessage, setActionStepMessage] = useState<string>('');
	const dispatch = useAppDispatch();

	const showAlert = (title: string, message: string, buttons?: any[]) => {
		if (Platform.OS === 'web') {
			alert(`${title ? title + ': ' : ''}${message}`);
			if (buttons && buttons.length > 0 && buttons[0].onPress) {
				buttons[0].onPress();
			}
		} else {
			Alert.alert(title, message, buttons);
		}
	};

	// 1. Initialize user, attendance status, and hardware deviceId
	useEffect(() => {
		const initData = async () => {
			try {
				// Fetch device ID
				const devId = await getOrGenerateDeviceId();
				setDeviceId(devId);

				// Fetch user info
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
			} catch (err) {
				console.error('Error initializing device/user data:', err);
			}
		};

		initData();
	}, []);

	// 2. Request permissions on mount (Camera & Location)
	useEffect(() => {
		const requestPermissions = async () => {
			if (Platform.OS === 'web') {
				setHasCameraPermission(true);
				setHasLocationPermission(true);
				return;
			}

			// Camera permission
			const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
			setHasCameraPermission(cameraStatus === 'granted');

			// Location permission
			const locPermission = await requestLocationPermission();
			setHasLocationPermission(locPermission);

			if (locPermission) {
				try {
					const coords = await getCurrentCoordinates();
					console.log('🌐 [BarCodeCamera Mount] Current User Position:');
					console.log(`   Latitude:  ${coords.userLat}`);
					console.log(`   Longitude: ${coords.userLng}`);
				} catch (err) {
					console.warn('Could not pre-fetch coordinates on mount:', err);
				}
			}
		};

		requestPermissions();
	}, []);

	// 3. Handle Attendance Success
	useEffect(() => {
		if (handleAttendanceisSuccess) {
			setIsAcquiringLocation(false);
			setActionStepMessage('');
			showAlert('Success', handleAttendancemessage || 'Attendance saved successfully', [
				{
					text: 'OK',
					onPress: () => {
						if (userId) {
							dispatch(getLoggedInUserAttendance(userId));
						}
						navigation.goBack();
					},
				},
			]);
			dispatch(reset());
		}
	}, [handleAttendanceisSuccess]);

	// 4. Handle Attendance Error
	useEffect(() => {
		if (handleAttendanceisError) {
			setIsAcquiringLocation(false);
			setActionStepMessage('');
			showAlert('Attendance Error', handleAttendancemessage || 'Failed to save attendance record', [
				{ text: 'OK' },
			]);
			dispatch(reset());
		}
	}, [handleAttendanceisError]);

	const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
		setScanned(true);
		setToken(data);
	};

	const handleClockAction = async () => {
		const activeToken = Platform.OS === 'web' ? manualToken.trim() : token?.trim();

		if (!activeToken) {
			showAlert('Missing Token', 'Please scan a valid QR code or enter the QR code token.');
			return;
		}

		if (!userId) {
			showAlert('User Error', 'Unable to retrieve user information. Please log in again.');
			return;
		}

		try {
			setIsAcquiringLocation(true);
			setActionStepMessage('Verifying device & acquiring GPS location...');

			// Ensure deviceId is resolved
			let currentDeviceId = deviceId;
			if (!currentDeviceId) {
				currentDeviceId = await getOrGenerateDeviceId();
				setDeviceId(currentDeviceId);
			}

			// Fetch live coordinates for geofence verification
			const coords = await getCurrentCoordinates();

			console.log('📍 [BarCodeCamera] User Current Coordinates:');
			console.log(`   Latitude:  ${coords.userLat}`);
			console.log(`   Longitude: ${coords.userLng}`);
			console.log(`   Device ID: ${currentDeviceId}`);

			setActionStepMessage('Submitting attendance...');

			const payload = {
				token: activeToken,
				userId,
				userLat: coords.userLat,
				userLng: coords.userLng,
				deviceId: currentDeviceId,
			};

			console.log('📦 [BarCodeCamera] Clock-In Payload:', JSON.stringify(payload, null, 2));

			dispatch(handleAttendance(payload));
		} catch (error: any) {
			setIsAcquiringLocation(false);
			setActionStepMessage('');

			if (error instanceof LocationError) {
				if (error.code === 'PERMISSION_DENIED') {
					showAlert(
						'Location Permission Required',
						error.message,
						[
							{ text: 'Cancel', style: 'cancel' },
							{ text: 'Open Settings', onPress: () => Linking.openSettings() },
						]
					);
				} else {
					showAlert('Location Error', error.message);
				}
			} else {
				showAlert('Clock-In Error', error?.message || 'An unexpected error occurred while clocking in/out.');
			}
		}
	};

	const handleClose = () => {
		navigation.goBack();
	};

	const isSubmitting = handleAttendanceisLoading || isAcquiringLocation;

	// Web Fallback Interface
	if (Platform.OS === 'web') {
		return (
			<View style={styles.webContainer}>
				<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
					<BlackX />
				</TouchableOpacity>
				<View style={styles.webForm}>
					<Text style={styles.webTitle}>
						{hasClockedIn ? 'Clock Out' : 'Clock In'} (Web)
					</Text>
					<Text style={styles.webSubtitle}>
						Enter the QR code token displayed on the Admin Dashboard to clock {hasClockedIn ? 'out' : 'in'}. Device ID and GPS coordinates will be verified.
					</Text>
					<TextInput
						style={styles.webInput}
						placeholder="Paste QR Code Token here..."
						value={manualToken}
						onChangeText={(text) => {
							setManualToken(text);
							setToken(text);
						}}
					/>

					{actionStepMessage ? (
						<Text style={styles.statusStepText}>{actionStepMessage}</Text>
					) : null}

					<TouchableOpacity
						style={[styles.buttonContainer, { marginTop: 24, width: '100%' }]}
						onPress={handleClockAction}
						disabled={!manualToken || isSubmitting}
					>
						{isSubmitting ? (
							<ActivityIndicator color={colors.white} size="small" />
						) : (
							<Text style={styles.text}>{hasClockedIn ? 'Clock Out' : 'Clock In'}</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// Permission Checking UI
	if (hasCameraPermission === null) {
		return (
			<View style={styles.permissionContainer}>
				<ActivityIndicator size="large" color={colors.accent_blue} />
				<Text style={styles.permissionText}>Requesting Camera & Location Permissions...</Text>
			</View>
		);
	}

	if (hasCameraPermission === false) {
		return (
			<View style={styles.permissionContainer}>
				<Ionicons name="camera-outline" size={64} color={colors.accent_blue} />
				<Text style={styles.permissionTitle}>Camera Access Denied</Text>
				<Text style={styles.permissionText}>We need access to your camera to scan QR codes for attendance verification.</Text>
				<TouchableOpacity style={styles.permissionButton} onPress={() => Linking.openSettings()}>
					<Text style={styles.permissionButtonText}>Go to Settings</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.headerContainer}>
			<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
				<BlackX />
			</TouchableOpacity>

			<View style={styles.container}>
				<CameraView
					style={styles.camera}
					onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
					barcodeScannerSettings={{ barcodeTypes: ['qr', 'pdf417'] }}
				/>

				{scanned && (
					<View>
						<TouchableOpacity onPress={() => setScanned(false)} style={styles.scanAgainButton} disabled={isSubmitting}>
							<Text style={styles.scanAgainText}>Scan Again</Text>
						</TouchableOpacity>

						<View style={styles.subContainer}>
							<View style={styles.photo_container}>
								<Text style={styles.text_take}>
									{hasClockedIn ? 'Scan to Clock Out' : 'Scan to Clock In'}
								</Text>
								<Text style={styles.text_take_sub}>
									Your device ID and GPS location will be verified against the office geofence to {hasClockedIn ? 'end your shift' : 'verify your attendance'}.
								</Text>
							</View>

							{actionStepMessage ? (
								<View style={styles.statusStepContainer}>
									<ActivityIndicator size="small" color={colors.accent_blue} />
									<Text style={styles.statusStepText}>{actionStepMessage}</Text>
								</View>
							) : null}

							<TouchableOpacity
								style={[styles.buttonContainer, isSubmitting && styles.buttonDisabled]}
								onPress={handleClockAction}
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<ActivityIndicator color={colors.white} size="small" />
								) : (
									<Text style={styles.text}>{hasClockedIn ? 'Clock Out' : 'Clock In'}</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	closeButton: {
		position: 'absolute',
		width: 36,
		height: 36,
		right: 20,
		top: Platform.OS === 'android' ? 40 : 50,
		backgroundColor: colors.white,
		borderRadius: 100,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 4,
	},
	permissionContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
		backgroundColor: '#fff',
	},
	permissionTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 12,
		textAlign: 'center',
		color: colors.gray900,
	},
	permissionText: {
		fontSize: 15,
		color: colors.gray600,
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 22,
	},
	permissionButton: {
		backgroundColor: colors.accent_blue,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		marginBottom: 10,
	},
	permissionButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '500',
	},
	headerContainer: {
		flex: 1,
		backgroundColor: '#000',
	},
	container: {
		flex: 1,
	},
	camera: {
		flex: 1,
	},
	subContainer: {
		padding: 20,
		backgroundColor: '#fff',
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	photo_container: {
		marginBottom: 12,
	},
	text_take: {
		fontSize: 20,
		fontWeight: 'bold',
		color: colors.gray900,
	},
	text_take_sub: {
		fontSize: 14,
		color: colors.gray500,
		marginTop: 6,
		lineHeight: 20,
	},
	statusStepContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 8,
		backgroundColor: '#f0f9ff',
		borderRadius: 8,
		marginBottom: 12,
	},
	statusStepText: {
		fontSize: 13,
		color: colors.accent_blue,
		fontWeight: '500',
	},
	buttonContainer: {
		backgroundColor: colors.accent_blue,
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: 'center',
		marginTop: 4,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	text: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	scanAgainButton: {
		backgroundColor: '#fff',
		alignSelf: 'center',
		marginBottom: 16,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	scanAgainText: {
		fontWeight: '600',
		color: colors.accent_blue,
		fontSize: 14,
	},
	webContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingHorizontal: 24,
		paddingTop: 80,
	},
	webForm: {
		width: '100%',
		maxWidth: 400,
		alignItems: 'center',
	},
	webTitle: {
		fontSize: 24,
		fontWeight: '600',
		color: colors.gray900,
		marginBottom: 12,
		textAlign: 'center',
	},
	webSubtitle: {
		fontSize: 14,
		color: colors.gray500,
		textAlign: 'center',
		marginBottom: 24,
		lineHeight: 20,
	},
	webInput: {
		width: '100%',
		height: 48,
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
		color: '#111827',
		backgroundColor: '#f9fafb',
	},
});

export default BarCodeCamera;
