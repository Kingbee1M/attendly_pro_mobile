import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { authenticateUser, clearError } from "../../slices/authSlice";
import PrimaryButton from "../../components/PrimaryButton";
import ErrorMessage from "../../components/ErrorMessage";
import { StackNavigationProp } from "@react-navigation/stack";
import { colors } from "@/css/colorsIndex";
import { BlueLogo } from "@/assets/svg/BlueLogo";
import { RootStackParamList } from "@/types";
import { EyeOff } from "@/assets/svg/EyeOff";
import { EyeOn } from "@/assets/svg/EyeOn";
import { UnlockIphone } from "@/assets/svg/UnlockIphone";
import { UnlockAndroid } from "@/assets/svg/UnlockAndroid";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

// Custom Floating Label Input Component (Google Material Style)
interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  showPassword?: boolean;
  onToggleShowPassword?: () => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  inputRef?: React.Ref<TextInput>;
  onSubmitEditing?: () => void;
  returnKeyType?: "next" | "done" | "go" | "search" | "send";
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  isPassword = false,
  showPassword = false,
  onToggleShowPassword,
  autoCapitalize = "none",
  inputRef,
  onSubmitEditing,
  returnKeyType = "done",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value !== "" ? 1 : 0,
      duration: 180,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: "absolute" as const,
    left: 12,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, -10],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["#9CA3AF", colors.accent_blue || "#2563EB"],
    }),
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    zIndex: 2,
  };

  return (
    <View style={styles.floatingInputWrapper}>
      <Animated.Text style={labelStyle} pointerEvents="none">
        {label}
      </Animated.Text>
      <TextInput
        ref={inputRef}
        style={[
          styles.floatingInput,
          isFocused && styles.focusedFloatingInput,
          isPassword && { paddingRight: 48 },
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={isPassword && !showPassword}
        autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
      />
      {isPassword && onToggleShowPassword && (
        <TouchableOpacity
          onPress={onToggleShowPassword}
          style={styles.eyeIconAbsolute}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {showPassword ? <EyeOn /> : <EyeOff />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isTouchIdEnabled, setIsTouchIdEnabled] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const dispatch = useAppDispatch();
  const { error, isLoading, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  const handleLogin = async () => {
    dispatch(authenticateUser({ username, password }));

    if (isTouchIdEnabled) {
      try {
        await AsyncStorage.setItem("savedUsername", username);
        await AsyncStorage.setItem("savedPassword", password);
      } catch (error) {}
    }
  };

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const touchIdEnabled = await AsyncStorage.getItem("touchIdEnabled");

        setIsBiometricAvailable(hasHardware && isEnrolled);
        setIsTouchIdEnabled(touchIdEnabled === "true");
      } catch (error) {}
    };

    checkBiometricAvailability();
  }, []);

  const handleBiometricLogin = async () => {
    try {
      const promptMessage =
        Platform.OS === "ios"
          ? "Use Face ID to login"
          : "Use Fingerprint to login";
      const fallbackLabel =
        Platform.OS === "ios" ? "Use Passcode" : "Use Password";

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel,
        disableDeviceFallback: false,
        cancelLabel: "Cancel",
      });

      if (result.success) {
        const savedUsername = await AsyncStorage.getItem("savedUsername");
        const savedPassword = await AsyncStorage.getItem("savedPassword");

        if (savedUsername && savedPassword) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          dispatch(
            authenticateUser({
              username: savedUsername,
              password: savedPassword,
            })
          );
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else if (result.error !== "user_cancel") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isAuthenticated]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container_main}>
          <View style={styles.titleContainer}>
            <BlueLogo />
            <Text style={styles.title}>Log into your account</Text>
            <Text style={styles.subtitle}>Please enter your details</Text>
          </View>

          <View style={styles.inputFieldContainer}>
            {/* Email / Username Input */}
            <FloatingLabelInput
              label="Email"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            {/* Password Input */}
            <FloatingLabelInput
              inputRef={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              showPassword={showPassword}
              onToggleShowPassword={() => setShowPassword(!showPassword)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <ErrorMessage
            message="Incorrect Username or Password"
            visible={!!error}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotPasswordContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={styles.button}>
            <PrimaryButton
              title="Log in"
              onPress={handleLogin}
              disabled={!username || !password}
              isLoading={isLoading}
            />
          </View>

          {/* Biometric Login Button */}
          {isBiometricAvailable && isTouchIdEnabled && (
            <TouchableOpacity
              style={[
                styles.touchIdButton,
                Platform.OS === "ios" && styles.faceIdButton,
              ]}
              onPress={handleBiometricLogin}
              activeOpacity={0.7}
            >
              {Platform.OS === "ios" ? (
                <UnlockIphone color={colors.accent_blue} />
              ) : (
                <UnlockAndroid color={colors.accent_blue} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  scrollView: {
    flex: 1,
  },
  button: {
    marginTop: 24,
  },
  inputFieldContainer: {
    gap: 18,
    marginBottom: 8,
  },
  titleContainer: {
    marginTop: 24,
    marginBottom: 32,
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  container_main: {
    margin: 20,
    marginTop: 50,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  title: {
    fontFamily: "Inter",
    fontStyle: "normal",
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.01,
    color: colors.gray900,
  },
  subtitle: {
    fontFamily: "Inter",
    fontStyle: "normal",
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray500,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    fontFamily: "Inter",
    fontStyle: "normal",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
    color: colors.accent_blue,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  // Floating Input Styling
  floatingInputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  floatingInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 16,
    color: "#101828",
  },
  focusedFloatingInput: {
    borderColor: colors.accent_blue || "#2563EB",
    borderWidth: 2,
  },
  eyeIconAbsolute: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 10,
  },

  // Biometric Button Styling
  touchIdButton: {
    marginTop: 40,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  faceIdButton: {
    width: 64,
    height: 64,
  },
});

export default LoginScreen;