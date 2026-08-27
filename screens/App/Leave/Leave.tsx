import React from 'react';
import { View, StyleSheet, StatusBar, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/hooks/hooks';
import Colors from "@/constants/Colors";
import { RoleEnum } from "@/enums/role.enum"; // Adjust import path
import AgentsLeaveUI from '@/components/AgentsLeaveScreen';
import AdminLeaveUI from '@/components/AdminLeaveUI';
import { colors } from '@/css/colorsIndex';

export default function LeaveScreen() {
    const colorScheme = useColorScheme() || 'light';
    const currentColors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    // Read logged-in user from auth slice
    const { logindata, loginisLoading } = useAppSelector((state: any) => state.clock);
    const role = logindata.data?.user?.role;
    const isAgent = role === RoleEnum.AGENT;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>

            <View
                style={[
                    styles.content,
                    { backgroundColor: currentColors.background },
                ]}
            >
                {isAgent ? <AgentsLeaveUI /> : <AdminLeaveUI />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.accent_blue,
    },
    content: {
        flex: 1,
    },
});
