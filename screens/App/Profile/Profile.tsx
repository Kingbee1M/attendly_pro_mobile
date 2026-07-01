import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useRefresh } from '@/Context/RefreshContext';
import { colors } from '@/css/colorsIndex';
import { RightGrayAngle } from '@/assets/svg/RightGrayAngle';
import { logoutUser } from '@/slices/authSlice';
import { useDispatch } from 'react-redux';
import { RootStackParamList } from '@/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Skeleton } from '@rneui/base';
import { useAppSelector } from '@/hooks/hooks';
import { loginUser } from '@/features/clockInandOut/clockInSlice';

// Define type for the Profile component props
type ProfileProps = {
	navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};
const Profile: React.FC<ProfileProps> = ({ navigation }) => {
	const { logindata, loginisLoading } = useAppSelector((state: any) => state.clock);
	const { refreshing, onRefresh } = useRefresh();
	const dispatch = useDispatch<any>();
	const [isTouchIdEnabled, setIsTouchIdEnabled] = useState(false);
	const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
	const profileName = logindata?.data?.user;
	const firstLetter = typeof profileName?.name === 'string' && profileName?.name?.trim()
		? profileName?.name?.trim()[0].toUpperCase()
		: '-';

	const appVersion = Constants.expoConfig?.version ?? '1.0.0';

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Await dispatches if you need to handle responses sequentially
				await dispatch(loginUser()).unwrap();
			} catch (error) {
				// Explicitly cast error to Error to access its properties 
			}
		};

		fetchData();
	}, [dispatch]);

	// Check biometric availability
	useEffect(() => {
		const checkBiometricAvailability = async () => {
			try {
				const hasHardware = await LocalAuthentication.hasHardwareAsync();
				const isEnrolled = await LocalAuthentication.isEnrolledAsync();
				const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
				const touchIdEnabled = await AsyncStorage.getItem('touchIdEnabled');

				// Set biometric availability
				setIsBiometricAvailable(hasHardware && isEnrolled);

				// Set toggle state
				setIsTouchIdEnabled(touchIdEnabled === 'true');

				// If no saved state, initialize as false
				if (touchIdEnabled === null) {
					await AsyncStorage.setItem('touchIdEnabled', 'false');
					setIsTouchIdEnabled(false);
				}
			} catch (error) {
				// Set defaults on error
				setIsBiometricAvailable(false);
				setIsTouchIdEnabled(false);
			}
		};

		checkBiometricAvailability();
	}, []);

	const handleSignOut = () => {
		Alert.alert(
			"Are you sure you want to sign out?",
			"",
			[
				{
					text: "No",
					style: "cancel",
				},
				{
					text: "Yes",
					onPress: () => dispatch(logoutUser()),
				},
			]
		);
	};

	const handlePress = () => {
		navigation.navigate('ChangePassword')
	};

	const handleTouchIdToggle = async (value: boolean) => {
		if (value) {
			// Enable biometric authentication with PIN fallback
			try {
				// Check if biometric is available
				const hasHardware = await LocalAuthentication.hasHardwareAsync();
				const isEnrolled = await LocalAuthentication.isEnrolledAsync();

				if (!hasHardware || !isEnrolled) {
					// If Face ID not available, enable PIN/Passcode authentication
					setIsTouchIdEnabled(true);
					await AsyncStorage.setItem('touchIdEnabled', 'true');
					await AsyncStorage.setItem('usePinFallback', 'true');
					Alert.alert('PIN Authentication Enabled', 'PIN/Passcode authentication has been enabled for quick login');
					return;
				}

				// Face ID is available, try to authenticate
				const biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint';
				const promptMessage = `Enable ${biometricType} for quick login`;
				const fallbackLabel = Platform.OS === 'ios' ? 'Use Passcode' : 'Use Password';

				const result = await LocalAuthentication.authenticateAsync({
					promptMessage,
					fallbackLabel,
					disableDeviceFallback: false, // Allow PIN/Passcode fallback
					cancelLabel: 'Cancel',
				});

				if (result.success) {
					setIsTouchIdEnabled(true);
					await AsyncStorage.setItem('touchIdEnabled', 'true');
					await AsyncStorage.setItem('usePinFallback', 'false');
					Alert.alert('Success', `${biometricType} has been enabled for quick login`);
				} else {
					// Reset toggle state to false on any failure
					setIsTouchIdEnabled(false);

					if (result.error === 'user_cancel') {
						Alert.alert('Cancelled', 'Authentication was cancelled. You can try again anytime.');
					} else {
						Alert.alert('Authentication Failed', 'Authentication failed. Please try again.');
					}
				}
			} catch (error) {
				setIsTouchIdEnabled(false);
				Alert.alert('Error', 'Unable to enable authentication. Please try again.');
			}
		} else {
			// Disable authentication
			setIsTouchIdEnabled(false);
			await AsyncStorage.setItem('touchIdEnabled', 'false');
			await AsyncStorage.setItem('usePinFallback', 'false');
			Alert.alert('Authentication Disabled', 'Authentication has been disabled for quick login');
		}
	};



	return (
		<View style={styles.headerContainer}>
			<View style={styles.container}>
				<ScrollView
					refreshControl={<RefreshControl
						refreshing={!refreshing ? false : refreshing}
						onRefresh={onRefresh} />}
					contentInsetAdjustmentBehavior="automatic"
					contentContainerStyle={styles.scrollViewContent}>
					<View style={styles.top_container}>
						<View style={styles.personalDetailsContainer}>
							<View style={styles.profileImageContainerMain}>
								<View style={styles.skeletonContainer}>
									{loginisLoading ? <Skeleton circle width={48} height={48} /> :
										<TouchableOpacity style={styles.dashboard_profile}>
											<Text style={styles.dashboard_profile_text_one}>{firstLetter}</Text>
										</TouchableOpacity>}

									<View style={styles.profileText}>
										{loginisLoading ? <Skeleton width={60} height={15} /> :
											<Text style={styles.text}>{profileName?.name}</Text>}
										{loginisLoading ? <Skeleton width={120} height={15} /> :
											<Text style={styles.textsub}>{profileName?.email} </Text>}
									</View>
								</View>
							</View>
							{loginisLoading ? <Skeleton width={"100%"} height={15} /> :
								<View style={styles.passwordsContainerMain}>
									<Text style={styles.passwordLabelText}>Gender:</Text>
									<Text style={styles.passwordDotsText}>	{profileName?.gender || "-"}</Text>
								</View>}
							{loginisLoading ? <Skeleton width={"100%"} height={15} /> :
								<View style={styles.passwordsContainerMain}>
									<Text style={styles.passwordLabelText}>Role:</Text>
									<Text style={styles.passwordDotsText}>{profileName?.role || "-"}</Text>
								</View>}
							{loginisLoading ? <Skeleton width={"100%"} height={15} /> :
								<View style={styles.passwordsContainerMain}>
									<Text style={styles.passwordLabelText}>Phone:</Text>
									<Text style={styles.passwordDotsText}>{profileName?.phone || "-"}</Text>
								</View>}
						</View>

						<View style={styles.passwordsContainer}>
							{loginisLoading ? <Skeleton width={"100%"} height={15} /> :
								<TouchableOpacity style={styles.passwordsContainerMain} onPress={handlePress}>
									<Text style={styles.passwordLabelText}>Password:</Text>
									<View style={styles.passwordTextContainer}>
										<RightGrayAngle />
									</View>
								</TouchableOpacity>}

							{/* Biometric Authentication Toggle */}
							{isBiometricAvailable && (
								<View style={styles.passwordsContainerMain}>
									<Text style={styles.passwordLabelText}>
										{Platform.OS === 'ios' ? 'Face ID/PIN' : 'Fingerprint/PIN'} Login:
									</Text>
									<TouchableOpacity
										style={[
											styles.customToggle,
											isTouchIdEnabled && styles.customToggleActive
										]}
										onPress={() => handleTouchIdToggle(!isTouchIdEnabled)}
										activeOpacity={0.7}
									>
										<View style={[
											styles.toggleThumb,
											isTouchIdEnabled && styles.toggleThumbActive
										]} />
									</TouchableOpacity>
								</View>
							)}

							{/* App Version Row */}
							<View style={styles.passwordsContainerMain}>
								<Text style={styles.passwordLabelText}>App Version:</Text>
								<Text style={styles.passwordDotsText}>v{appVersion}</Text>
							</View>
						</View>
					</View>

					<TouchableOpacity style={styles.Setting_Edit_container_List} onPress={handleSignOut}>
						<Text style={styles.Setting_Edit_text_list}>Sign out</Text>
					</TouchableOpacity>

					{/* Version Footer */}
					<Text style={styles.footerVersionText}>Version {appVersion}</Text>
				</ScrollView>
			</View>
		</View>

	)
}

export default Profile

const styles = StyleSheet.create({

	dashboard_profile: {
		width: 40,
		height: 40,
		borderRadius: 50,
		backgroundColor: colors.white,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 0.4,
		borderColor: colors.smail_text_color,
	},

	dashboard_profile_text_one: {
		color: colors.gray900,
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '600',
		fontSize: 20,
		lineHeight: 28,
	},
	headerContainer: {
		flex: 1
	},
	profileText: {
		gap: 2
	},

	skeletonContainer: {
		flexDirection: "row",
		gap: 10
	},

	textsub: {
		height: 24,
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '600',
		fontSize: 16,
		lineHeight: 24,
		color: colors.gray900,
	},
	image: {
		width: 48,
		height: 48,
		borderRadius: 50
	},
	text: {
		height: 14,
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		lineHeight: 14,
		color: colors.gray500,
	},
	Setting_Edit_text_list: {
		color: colors.red,
		fontSize: 14,
		fontFamily: "Inter",
		textAlign: "center",
		fontWeight: "800"
	},

	Setting_Edit_container_List: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 15,
		backgroundColor: "#FFCDD2",
		gap: 4,
		borderRadius: 10,
		marginTop: 50,
		marginHorizontal: 20
	},

	profileImageContainerMain: {
		flexDirection: "row",
		alignItems: "center",
		gap: 15
	},

	profileImage: {
		position: "absolute",
		right: -5,
		bottom: 0,
	},
	profileImageContainer: {
		position: "relative",
	},

	passwordsContainerMain: {
		flexDirection: 'row',
		justifyContent: "space-between",
		width: "100%"
	},
	passwordDotsText: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		color: colors.gray800,
	},
	passwordTextContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: "center",
		gap: 5
	},

	passwordLabelText: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 12,
		color: colors.gray500,
		alignSelf: 'center',
	},
	passwordsContainer: {
		flexDirection: 'column',
		padding: 16,
		width: "100%",
		backgroundColor: colors.white,
		borderRadius: 8,
		gap: 18
	},
	top_container: {
		marginHorizontal: 20,
		marginTop: 16,
		gap: 16
	},

	personalDetailsContainer: {
		flexDirection: 'column',
		alignItems: 'flex-start',
		padding: 16,
		gap: 20,
		width: "100%",
		height: 192,
		backgroundColor: colors.white,
		borderRadius: 8,
	},

	scrollViewContent: {
		paddingBottom: 100,
	},

	container: {
		flexGrow: 1,
		paddingTop: 10,
		backgroundColor: colors.background,
	},

	// Custom Toggle Styles
	customToggle: {
		width: 50,
		height: 30,
		backgroundColor: colors.gray300,
		borderRadius: 15,
		padding: 2,
		justifyContent: 'center',
	},
	customToggleActive: {
		backgroundColor: colors.accent_blue,
	},
	toggleThumb: {
		width: 26,
		height: 26,
		backgroundColor: colors.white,
		borderRadius: 13,
		alignSelf: 'flex-start',
	},
	toggleThumbActive: {
		alignSelf: 'flex-end',
	},
	footerVersionText: {
		fontFamily: 'Inter',
		fontSize: 12,
		color: colors.gray400,
		textAlign: 'center',
		marginTop: 24,
	},
})