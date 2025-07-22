import MeetingData from '@/src/services/useApi/meeting/MeetingData';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

const useMeetingDetail = (meeting, detailFields, getFieldValue, getFieldLabel, navigation, refreshMeeting) => {
    const [deleting, setDeleting] = useState(false);

    const deleteMeeting = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            navigation.navigate('LoginScreen');
            return false;
        }

        try {
            setDeleting(true);
            const result = await MeetingData.DeleteMeeting(meeting.id, token);
            setDeleting(false);
            return result;
        } catch (error) {
            console.error('Lỗi khi xoá:', error);
            setDeleting(false);
            return false;
        }
    };

    return {
        meeting,
        detailFields,
        loading: false,
        refreshing: false,
        error: null,
        deleting,
        refreshMeeting: refreshMeeting || (() => console.log("Đang làm mới cuộc họp...")),
        deleteMeeting,
        getFieldValue: getFieldValue || ((item, key) => item[key]),
        getFieldLabel: getFieldLabel || ((key) => key),
        shouldDisplayField: (key) => true,
    };
};

export default function MeetingDetailScreen() {
    const mdName = 'Cuộc họp';
    const navigation = useNavigation();
    const route = useRoute();
    const {meeting: routeMeeting, detailFields: routeDetailFields, getFieldValue: routeGetFieldValue, getFieldLabel: routeGetFieldLabel, refreshMeeting: routeRefreshMeeting} = route.params;

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
    } = useMeetingDetail(routeMeeting, routeDetailFields, routeGetFieldValue, routeGetFieldLabel, navigation, routeRefreshMeeting);

    // Handle delete with confirmation
    const handleDelete = () => {
        if (!canEditMeeting()) {
            Alert.alert(
                'Không thể xóa',
                'Bạn không có quyền xóa cuộc họp này.',
                [{ text: 'OK' }]
            );
            return;
        } else {
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
                            if (typeof refreshMeeting === 'function') {
                                refreshMeeting();
                            }
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
}

    // Check if user can edit this meeting
    const canEditMeeting = () => {
        if (!meeting) return false;
        
        // If assigned_user_name is different from created_by_name, disable editing
        if (meeting.assigned_user_name && meeting.created_by_name && 
            meeting.assigned_user_name !== meeting.created_by_name) {
            return false;
        }
        
        return true;
    };

    // Navigate to update screen
    const handleUpdate = () => {
        navigation.navigate('MeetingUpdateScreen', { routeMeeting, routeDetailFields, routeGetFieldValue, routeGetFieldLabel });
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
        const value = getFieldValue(meeting, field.key);

        if (!shouldDisplayField(field.key)) {
            return null;
        }

        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{getFieldLabel(field.key)}:</Text>
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

                            <View style={styles.fieldsContainer}>
                                {detailFields.map(field => renderFieldItem(field))}
                            </View>
                        </View>
                    )}
                </ScrollView>

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
});
