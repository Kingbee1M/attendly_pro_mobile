import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    useColorScheme, 
    ActivityIndicator, 
    RefreshControl,
    TouchableOpacity,
    ScrollView,
    Pressable
} from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import Colors from "@/constants/Colors";
import { colors } from "@/css/colorsIndex";
import { fetchAllLeaveRequests } from "@/features/leave/leaveSlice";
import { RootState, AppDispatch } from "@/utils/store";
import { LeaveStatus } from "@/enums/leaveStatus.enum";
import { useNavigation } from '@react-navigation/native';

// Visual illustration container for network issues
const ConnectionErrorIllustration = ({ isDark }: { isDark: boolean }) => (
    <View style={[styles.illustrationCircle, { backgroundColor: isDark ? '#2C1E21' : '#FEE2E2' }]}>
        <View style={[styles.illustrationInnerCircle, { backgroundColor: isDark ? '#3D2529' : '#FCA5A5' }]}>
            <Text style={{ fontSize: 28 }}>⚡</Text>
        </View>
    </View>
);

const STATUS_FILTERS = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: LeaveStatus.PENDING },
    { label: 'Approved', value: LeaveStatus.APPROVED },
    { label: 'Rejected', value: LeaveStatus.REJECTED },
];

export default function AdminLeaveUI() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentColors = Colors[colorScheme];
    const navigation = useNavigation<any>();

    const dispatch = useDispatch<AppDispatch>();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    const { allLeaveRequests, isLoading, error } = useSelector(
        (state: RootState) => state.leave
    );

    // Fetch all leaves without restricting to PENDING
    const loadLeaveRequests = useCallback(() => {
        dispatch(fetchAllLeaveRequests({}));
    }, [dispatch]);

    useEffect(() => {
        loadLeaveRequests();
    }, [loadLeaveRequests]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await dispatch(fetchAllLeaveRequests({}));
        setRefreshing(false);
    }, [dispatch]);

    // Client-side filtering via useMemo
    const filteredLeaveRequests = useMemo(() => {
        if (!allLeaveRequests) return [];
        if (selectedStatus === 'ALL') return allLeaveRequests;
        return allLeaveRequests.filter(item => item?.status === selectedStatus);
    }, [allLeaveRequests, selectedStatus]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case LeaveStatus.APPROVED:
                return { bg: '#E6F4EA', text: '#137333' };
            case LeaveStatus.REJECTED:
                return { bg: '#FCE8E6', text: '#C5221F' };
            default:
                return { bg: '#FEF7E0', text: '#B06000' };
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const cardBg = isDark ? '#1C1C1E' : colors.white;
    const tabBg = isDark ? '#2C2C2E' : '#F3F4F6';

    return (
        <View style={[styles.container, { backgroundColor: currentColors.background }]}>
            <Text style={styles.headerTitle}>
                All Leave Applications
            </Text>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {STATUS_FILTERS.map((tab) => {
                        const isActive = selectedStatus === tab.value;
                        return (
                            <TouchableOpacity
                                key={tab.value}
                                onPress={() => setSelectedStatus(tab.value)}
                                style={[
                                    styles.filterTab,
                                    { backgroundColor: isActive ? colors.accent_blue : tabBg },
                                ]}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        { color: isActive ? '#FFFFFF' : isDark ? '#A1A1A6' : colors.gray600 },
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2171FF" />
                </View>
            ) : error ? (
                <ScrollView 
                    contentContainerStyle={styles.errorScrollContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh}
                            colors={["#2171FF"]}
                            tintColor="#2171FF"
                        />
                    }
                >
                    <View style={[styles.errorCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                        <ConnectionErrorIllustration isDark={isDark} />
                        
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>ERR_NETWORK_FAILURE</Text>
                        </View>

                        <Text style={[styles.errorTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            Unable to load applications
                        </Text>
                        
                        <Text style={[styles.errorMessage, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                            {typeof error === 'string' ? error : 'We hit a snag while fetching all leave applications. Check your connection and try again.'}
                        </Text>

                        <Pressable 
                            style={({ pressed }) => [
                                styles.retryButton,
                                { opacity: pressed ? 0.85 : 1.0, transform: [{ scale: pressed ? 0.98 : 1.0 }] }
                            ]}
                            onPress={loadLeaveRequests}
                        >
                            <Text style={styles.retryButtonText}>Retry Request</Text>
                        </Pressable>

                        <Text style={[styles.pullHint, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                            Or pull down to refresh
                        </Text>
                    </View>
                </ScrollView>
            ) : (
                <FlatList
                    data={filteredLeaveRequests}
                    keyExtractor={(item, index) => item?.id || String(index)}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh}
                            colors={["#2171FF"]}
                            tintColor="#2171FF"
                        />
                    }
                    renderItem={({ item }) => {
                        const statusTheme = getStatusStyle(item?.status);
                        return (
                            <TouchableOpacity style={[styles.card, { backgroundColor: cardBg }]}
                                onPress={() => navigation.navigate('AdminCheckLeave', { leave: item })}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={[styles.leaveType, { color: isDark ? colors.white : colors.gray900 }]}>
                                            {item?.leaveType}
                                        </Text>
                                        {item?.user?.name && (
                                            <Text style={styles.applicantName}>
                                                By: {item.user.name}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
                                        <Text style={[styles.statusText, { color: statusTheme.text }]}>
                                            {item?.status || 'PENDING'}
                                        </Text>
                                    </View>
                                </View>

                                {item?.reason ? (
                                    <Text style={[styles.reasonText, { color: isDark ? '#A1A1A6' : colors.gray600 }]}>
                                        {item.reason}
                                    </Text>
                                ) : null}

                                <View style={styles.dateRow}>
                                    <Text style={styles.dateLabel}>Dates:</Text>
                                    <Text style={[styles.dateValue, { color: isDark ? colors.white : colors.gray800 }]}>
                                        {formatDate(item?.startDate)} — {formatDate(item?.endDate)}
                                    </Text>
                                </View>

                                {item?.approvedBy?.name && (
                                    <Text style={styles.approverText}>
                                        Reviewed by {item.approvedBy.name}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={{ color: colors.gray500 }}>No leave applications found for this filter.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        color: colors.accent_blue
    },
    filterContainer: {
        marginBottom: 16,
    },
    filterScroll: {
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorScrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    errorCard: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    illustrationCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    illustrationInnerCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeContainer: {
        backgroundColor: '#EF444415',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#EF4444',
        letterSpacing: 0.5,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        maxWidth: 280,
    },
    retryButton: {
        backgroundColor: colors.accent_blue,
        paddingVertical: 12,
        width: '100%',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.accent_blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    pullHint: {
        fontSize: 12,
        marginTop: 14,
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 24,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    leaveType: {
        fontSize: 16,
        fontWeight: '600',
    },
    applicantName: {
        fontSize: 13,
        color: colors.gray500,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    reasonText: {
        fontSize: 14,
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    dateLabel: {
        fontSize: 12,
        color: colors.gray500,
        marginRight: 6,
    },
    dateValue: {
        fontSize: 13,
        fontWeight: '500',
    },
    approverText: {
        fontSize: 12,
        color: colors.gray500,
        fontStyle: 'italic',
        marginTop: 8,
    },
});