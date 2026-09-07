import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Alert,
	Platform
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { button, colors } from '@/css/colorsIndex';
import { RootStackParamList } from '@/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import PasswordInput from '@/components/Input/PasswordInput';
import Header from '@/components/Header';
import { changePassword, reset } from '@/features/clockInandOut/clockInSlice';

// Define type for the ChangePassword component props
type ChangePasswordProps = {
	navigation: NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>;
};

const ChangePassword: React.FC<ChangePasswordProps> = ({ navigation }) => {
	const insets = useSafeAreaInsets();
	const { isLoading, isSuccess, isError, message } = useAppSelector((state: any) => state.clock);
	const dispatch = useAppDispatch();




	const [input, setInput] = useState<any>({
		oldPassword: '',
		newPassword: ''
	});



	// Update input values
	const handleChange = (name: string, value: string) => {
		setInput({ ...input, [name]: value });
	};

	// Handle form submission
	const handlePress = () => {
		dispatch(changePassword(input));
	};

	// // Handle success and error messages
	useEffect(() => {
		if (isSuccess) {
			navigation.navigate('Success')
			dispatch(reset()); // Reset the state after showing success message
		}
		if (isError) {
			Alert.alert('Error', message || 'Something went wrong. Please try again.');
			dispatch(reset()); // Reset the state after showing error message
		}
	}, [isSuccess, isError, message, dispatch, navigation]);

	return (
		<View style={styles.headerContainer}>
			<Header text={'Change Password'} />
			<View style={styles.container}>
				<ScrollView
					style={styles.scrollView}
					contentInsetAdjustmentBehavior="automatic"
					contentContainerStyle={[
						styles.scrollViewContent,
						{
							paddingBottom: Platform.OS === 'android'
								? Math.max(100, insets.bottom + 20)
								: 100
						}
					]}>
					<View style={styles.inputContainer}>
						<View style={styles.inputFieldContainer}>
							{/* Label and Input for Old Password */}
							<View>
								<Text style={styles.label}>Enter old password</Text>
								<PasswordInput
									placeholder="**********"
									value={input.oldPassword}
									onChangeText={(text: string) => handleChange('oldPassword', text)}
								/>
							</View>

							{/* Label and Input for New Password */}
							<View>
								<Text style={styles.label}>Enter new password</Text>
								<PasswordInput
									placeholder="**********"
									value={input.newPassword}
									onChangeText={(text: string) => handleChange('newPassword', text)}
								/>
							</View>
						</View>

						<TouchableOpacity
							style={[styles.btn, button.blue_button]}
							disabled={isLoading}
							onPress={handlePress}
						>
							{isLoading ? (
								<ActivityIndicator color={colors.white} size="small" />
							) : (
								<Text style={styles.btn_text}>Confirm</Text>
							)}
						</TouchableOpacity>
					</View>
				</ScrollView>
			</View>
		</View>
	);
};

export default ChangePassword;

// Styles
const styles = StyleSheet.create({

	headerContainer: {
		flex: 1
	},
	btn_text: {
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 16,
		lineHeight: 24,
		color: colors.white,
		textAlign: 'center',
	},
	inputContainer: {
		flexDirection: 'column',
		justifyContent: 'space-between',
		height: '100%',
		marginHorizontal: 24,
	},
	btn: {
		marginHorizontal: 24,
		marginBottom: 10,
		marginTop: 20,
	},
	inputFieldContainer: {
		gap: 24,
		marginTop: 36,
	},
	scrollViewContent: {
		flexGrow: 1,
	},
	scrollView: {
		flex: 1,
	},
	container: {
		flex: 1,
		paddingTop: 10,
		backgroundColor: colors.background,
	},
	label: {
		height: 25,
		fontFamily: 'Inter',
		fontStyle: 'normal',
		fontWeight: '500',
		fontSize: 14,
		lineHeight: 20,
		color: colors.gray800,
	},
});
