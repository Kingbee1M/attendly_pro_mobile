import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, Platform, Modal } from 'react-native'
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
    
    // State to toggle styled modal
    const [showSignOutModal, setShowSignOutModal] = useState(false);

    const profileName = logindata?.data?.user;
    const firstLetter = typeof profileName?.name === 'string' && profileName?.name?.trim()
        ? profileName?.name?.trim()[0].toUpperCase()
        : '-';

    const appVersion = Constants.expoConfig?.version ?? '1.0.0';

    useEffect(() => {
        const fetchData = async () => {
            try {
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

                setIsBiometricAvailable(hasHardware && isEnrolled);
                setIsTouchIdEnabled(touchIdEnabled === 'true');

                if (touchIdEnabled === null) {
                    await AsyncStorage.setItem('touchIdEnabled', 'false');
                    setIsTouchIdEnabled(false);
                }
            } catch (error) {
                setIsBiometricAvailable(false);
                setIsTouchIdEnabled(false);
            }
        };

        checkBiometricAvailability();
    }, []);

    // Open styled sign out dialog
    const handleSignOut = () => {
        setShowSignOutModal(true);
    };

    const confirmSignOut = () => {
        setShowSignOutModal(false);
        dispatch(logoutUser());
    };

    const handlePress = () => {
        navigation.navigate('ChangePassword')
    };

    const handleTouchIdToggle = async (value: boolean) => {
        if (value) {
            try {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                if (!hasHardware || !isEnrolled) {
                    setIsTouchIdEnabled(true);
                    await AsyncStorage.setItem('touchIdEnabled', 'true');
                    await AsyncStorage.setItem('usePinFallback', 'true');
                    Alert.alert('PIN Authentication Enabled', 'PIN/Passcode authentication has been enabled for quick login');
                    return;
                }

                const biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Fingerprint';
                const promptMessage = `Enable ${biometricType} for quick login`;
                const fallbackLabel = Platform.OS === 'ios' ? 'Use Passcode' : 'Use Password';

                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage,
                    fallbackLabel,
                    disableDeviceFallback: false,
                    cancelLabel: 'Cancel',
                });

                if (result.success) {
                    setIsTouchIdEnabled(true);
                    await AsyncStorage.setItem('touchIdEnabled', 'true');
                    await AsyncStorage.setItem('usePinFallback', 'false');
                    Alert.alert('Success', `${biometricType} has been enabled for quick login`);
                } else {
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
                                    <Text style={styles.passwordDotsText}>  {profileName?.gender || "-"}</Text>
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

            {/* Styled Sign Out Modal */}
            <Modal
                visible={showSignOutModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSignOutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Sign Out</Text>
                        <Text style={styles.modalDescription}>
                            Are you sure you want to sign out of your account?
                        </Text>
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowSignOutModal(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.signOutButton]}
                                onPress={confirmSignOut}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.signOutButtonText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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

    // Modal Styling
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray900,
        marginBottom: 8,
    },
    modalDescription: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.gray600,
        textAlign: 'center',
        marginBottom: 24,
    },
    modalActionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: colors.gray300,
    },
    cancelButtonText: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '600',
        color: colors.gray700,
    },
    signOutButton: {
        backgroundColor: '#FF4D4D',
    },
    signOutButtonText: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '700',
        color: colors.white,
    },
})