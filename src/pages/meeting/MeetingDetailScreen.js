import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import TopNavigationDetail from "../../components/navigations/TopNavigationDetail";
import { formatDateTime } from "../../utils/FormatDateTime";

const useMeetingDetail = (meetingId) => {
    return {
        meeting: {
            id: meetingId,
            name: "Cuộc họp chiến lược Q1 2025",
            date_start: "2025-07-20T09:00:00Z",
            date_end: "2025-07-20T11:00:00Z",
            location: "Phòng họp A, Tầng 5",
            description: "Thảo luận về kế hoạch kinh doanh và chiến lược phát triển quý 1 năm 2025.",
            status: "Planned",
            assigned_user_name: "Nguyễn Văn A",
            parent_name: "Công ty ABC",
            parent_type: "Accounts",
            duration_hours: 2,
            duration_minutes: 0,
            date_entered: "2025-07-15T08:30:00Z",
            date_modified: "2025-07-16T14:45:00Z",
        },
        detailFields: [
            { key: 'name', label: 'Tên cuộc họp' },
            { key: 'date_start', label: 'Thời gian bắt đầu' },
            { key: 'date_end', label: 'Thời gian kết thúc' },
            { key: 'location', label: 'Địa điểm' },
            { key: 'status', label: 'Trạng thái' },
            { key: 'assigned_user_name', label: 'Người phụ trách' },
            { key: 'parent_name', label: 'Liên quan đến' },
            { key: 'date_entered', label: 'Ngày tạo' },
            { key: 'date_modified', label: 'Ngày cập nhật' },
            { key: 'description', label: 'Mô tả' },
        ],
        loading: false,
        refreshing: false,
        error: null,
        deleting: false,
        refreshMeeting: () => console.log("Đang làm mới cuộc họp..."),
        deleteMeeting: async () => {
            alert("Cuộc họp đã bị xóa (giả lập)");
            return true;
        },
        getFieldValue: (key) => {
            const map = {
                name: "Cuộc họp chiến lược Q1 2025",
                date_start: "2025-07-20T09:00:00Z",
                date_end: "2025-07-20T11:00:00Z",
                location: "Phòng họp A, Tầng 5",
                status: "Planned",
                assigned_user_name: "Nguyễn Văn A",
                parent_name: "Công ty ABC",
                parent_type: "Accounts",
                date_entered: "2025-07-15T08:30:00Z",
                date_modified: "2025-07-16T14:45:00Z",
                description: "Thảo luận về kế hoạch kinh doanh và chiến lược phát triển quý 1 năm 2025.",
            };
            return map[key] || "";
        },
        getFieldLabel: (key) => key,
        shouldDisplayField: (key) => true,
    };
};

const { width } = Dimensions.get('window');
const ITEM_W = (width - 8 * 2 - 4 * 2 * 4) / 4;

export default function MeetingDetailScreen() {
    const mdName = 'Cuộc họp';
    const navigation = useNavigation();
    const route = useRoute();
    const { meetingId } = route.params;

    const data = [
        { id: '1', name: 'Tài liệu' },
        { id: '2', name: 'Ghi chú' },
        { id: '3', name: 'Khách hàng' },
        { id: '4', name: 'Liên hệ' },
        { id: '5', name: 'Công việc' }
    ];

    const padData = (raw, cols) => {
        const fullRows = Math.floor(raw.length / cols);
        let lastRowCount = raw.length - fullRows * cols;
        while (lastRowCount !== 0 && lastRowCount < cols) {
            raw.push({ id: `blank-${lastRowCount}`, empty: true });
            lastRowCount++;
        }
        return raw;
    };

    // trong component
    const paddedData = useMemo(() => padData([...data], 4), [data]);

    const renderItem = ({ item }) => {
        if (item.empty) {
            return <View style={styles.cardInvisible} />;
        }

        return (
            <Pressable
                onPress={() => console.log('Bạn vừa chạm: ', item.id)}
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,   // thêm nền khi nhấn
                ]}
            >
                <Text style={({ pressed }) => [pressed ? styles.cardText : styles.text]}>
                    {item.name}
                </Text>
            </Pressable>
        );
    };

    // Sử dụng custom hook
    const {
        meeting,
        detailFields,
        loading,
        refreshing,
        error,
        deleting,
        refreshMeeting,
        deleteMeeting,
        getFieldValue,
        getFieldLabel,
        shouldDisplayField
    } = useMeetingDetail(meetingId);

    // Handle delete with confirmation
    const handleDelete = () => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa cuộc họp này không? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteMeeting();
                        if (success) {
                            Alert.alert(
                                'Thành công',
                                'Đã xóa cuộc họp thành công',
                                [{ text: 'OK', onPress: () => navigation.goBack() }]
                            );
                        }
                    }
                }
            ]
        );
    };

    // Navigate to update screen
    const handleUpdate = () => {
        navigation.navigate('MeetingUpdateScreen', { meetingData: meeting });
    };

    // Format field value for display
    const formatFieldValue = (fieldKey, value) => {
        if (!value) return 'Không có';

        switch (fieldKey) {
            case 'date_start':
            case 'date_end':
            case 'date_entered':
            case 'date_modified':
                return formatDateTime(value);
            case 'status':
                const statusLabels = {
                    'Planned': 'Đã lên kế hoạch',
                    'Held': 'Đã diễn ra',
                    'Not Held': 'Chưa diễn ra',
                    'Cancelled': 'Đã hủy'
                };
                return statusLabels[value] || value;
            case 'parent_type':
                const typeLabels = {
                    'Accounts': 'Khách hàng',
                    'Contacts': 'Liên hệ',
                    'Opportunities': 'Cơ hội',
                    'Tasks': 'Công việc'
                };
                return typeLabels[value] || value;
            default:
                return value.toString();
        }
    };

    // Render field item
    const renderFieldItem = (field) => {
        const value = getFieldValue(field.key);

        if (!shouldDisplayField(field.key)) {
            return null;
        }

        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}:</Text>
                <Text style={styles.fieldValue}>
                    {formatFieldValue(field.key, value)}
                </Text>
            </View>
        );
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={mdName}
                    navigation={navigation}
                    name="MeetingUpdateScreen"
                />

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B84FF" />
                    <Text style={styles.loadingText}>Đang tải chi tiết cuộc họp...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error && !meeting) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={mdName}
                    navigation={navigation}
                    name="MeetingUpdateScreen"
                />

                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
                    <Text style={styles.errorTitle}>Không thể tải cuộc họp</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refreshMeeting}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={mdName}
                    navigation={navigation}
                    name="MeetingUpdateScreen"
                />

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshMeeting}
                            colors={['#4B84FF']}
                            title="Kéo để tải lại..."
                        />
                    }
                >
                    {/* Error Display */}
                    {error && (
                        <View style={styles.warningContainer}>
                            <Ionicons name="warning-outline" size={20} color="#FF8C00" />
                            <Text style={styles.warningText}>{error}</Text>
                        </View>
                    )}

                    {/* Meeting Details */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thông tin chính</Text>
                    </View>
                    {meeting && (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.meetingTitle}>{meeting.name}</Text>

                            {meeting.date_start && (
                                <View style={styles.timeInfo}>
                                    <Ionicons name="time-outline" size={16} color="#666" />
                                    <Text style={styles.timeText}>
                                        {formatDateTime(meeting.date_start)} - {formatDateTime(meeting.date_end)}
                                    </Text>
                                </View>
                            )}

                            {meeting.location && (
                                <View style={styles.locationInfo}>
                                    <Ionicons name="location-outline" size={16} color="#666" />
                                    <Text style={styles.locationText}>
                                        Địa điểm: {meeting.location}
                                    </Text>
                                </View>
                            )}

                            {meeting.parent_name && meeting.parent_type && (
                                <View style={styles.parentInfo}>
                                    <Ionicons name="link-outline" size={16} color="#666" />
                                    <Text style={styles.parentText}>
                                        Liên quan: {meeting.parent_name}
                                        ({formatFieldValue('parent_type', meeting.parent_type)})
                                    </Text>
                                </View>
                            )}

                            <View style={styles.fieldsContainer}>
                                {detailFields.map(field => renderFieldItem(field))}
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* ===== Box 2: Mối quan hệ ===== */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Mối quan hệ</Text>
                </View>

                <View style={styles.infoCard}>
                    <FlatList
                        data={paddedData}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        numColumns={4}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                {/* Action Buttons */}
                {meeting && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.updateButton}
                            onPress={handleUpdate}
                            disabled={deleting}
                        >
                            <Ionicons name="create-outline" size={20} color="#fff" />
                            <Text style={styles.updateButtonText}>Cập nhật</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.deleteButton, deleting && styles.deletingButton]}
                            onPress={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="trash-outline" size={20} color="#fff" />
                            )}
                            <Text style={styles.deleteButtonText}>
                                {deleting ? 'Đang xóa...' : 'Xóa'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },

    /* Header mini cho section */
    sectionHeader: {marginTop: 6, marginBottom: 6, paddingHorizontal: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#4B84FF' },

    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorTitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF3B30',
        textAlign: 'center',
    },
    errorText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#4B84FF',
        borderRadius: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FF8C00',
    },
    warningText: {
        flex: 1,
        marginLeft: 8,
        color: '#FF8C00',
        fontSize: 14,
    },
    detailsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    meetingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        lineHeight: 26,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    timeText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    locationText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#FF9800',
        fontWeight: '500',
    },
    parentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#4B84FF',
    },
    parentText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4B84FF',
        fontWeight: '500',
    },
    fieldsContainer: {
        gap: 15,
    },
    fieldContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 12,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    fieldValue: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    actionContainer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        gap: 10,
    },
    updateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4B84FF',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF3B30',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    deletingButton: {
        backgroundColor: '#FF6B6B',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

     /* Thẻ thông tin */
    infoCard: {
        paddingVertical: 5,
        paddingHorizontal: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        height: 220
    },
    row: {
        paddingHorizontal: 8,
        justifyContent: 'flex-start',
    },
    card: {
        width: ITEM_W,
        marginHorizontal: 2,
        marginVertical: 8,
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: '#ececec',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInvisible: {
        width: ITEM_W,
        marginHorizontal: 2,
        marginVertical: 8,
        backgroundColor: 'transparent',
    },
    cardPressed: {
        backgroundColor: "blue",
    },
    cardText: {
        fontSize: 13,
        color: 'black',
    },
    text: {
        fontSize: 20,
        color: "#333",
    },
});
