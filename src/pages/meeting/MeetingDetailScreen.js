import MeetingData from '@/src/services/useApi/meeting/MeetingData';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const useMeetingDetail = (meeting, editViews, requiredFields, getFieldValue, getFieldLabel, navigation, refreshMeeting) => {
    const [deleting, setDeleting] = useState(false);
    const [data, setData] = useState(meeting);
    
    // Function để update meeting data
    const updateMeetingData = (updatedData) => {
        setData(updatedData);
    };

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
        meeting: data || meeting,
        editViews,
        requiredFields,
        loading: false,
        refreshing: false,
        error: null,
        deleting,
        refreshMeeting,
        updateMeetingData, // Expose function để update data
        deleteMeeting,
        getFieldValue: getFieldValue || ((item, key) => item[key]),
        getFieldLabel: getFieldLabel || ((key) => key),
        shouldDisplayField: (key) => true,
    };
};
const { width } = Dimensions.get('window');
const ITEM_W = (width - 8 * 2 - 4 * 2 * 4) / 4;

export default function MeetingDetailScreen() {
    const mdName = 'Cuộc họp';
    const navigation = useNavigation();
    const route = useRoute();
    const {meeting: routeMeeting, editViews: routeEditViews, requiredFields: routeRequiredFields, listViews: routeListViews, getFieldValue: routeGetFieldValue, getFieldLabel: routeGetFieldLabel, refreshMeeting: routeRefreshMeeting} = route.params;
    const [relationships, setRelationships] = useState([]);
    // State để quản lý dữ liệu meeting hiện tại
    const [currentMeeting, setCurrentMeeting] = useState(routeMeeting);
    const [meetingRefreshing, setMeetingRefreshing] = useState(false);

    useEffect(() => {
        const fetchRelationships = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return;
                }

                const response = await MeetingData.getRelationships(token, routeMeeting.id);
                if (response && response.relationships) {
                    setRelationships(response.relationships);
                } else {
                    setRelationships([]);
                }
            } catch (error) {
                console.error('Lỗi khi lấy mối quan hệ:', error);
            }
        }

        fetchRelationships();
    }, [currentMeeting.id]);

    const padData = (raw, cols) => {
        const fullRows = Math.floor(raw.length / cols);
        let lastRowCount = raw.length - fullRows * cols;
        while (lastRowCount !== 0 && lastRowCount < cols) {
            raw.push({ id: `blank-${lastRowCount}`, empty: true });
            lastRowCount++;
        }
        return raw;
    }

    const paddedData = useMemo(() => {
        const safeRelationships = Array.isArray(relationships) ? relationships : [];
        return padData([...safeRelationships], 4);
    }, [relationships]);

    const renderItem = ({ item }) => {
        if (item.empty) {
            return <View style={styles.cardInvisible} />;
        }
        return (
            <Pressable 
                onPress={() => navigation.navigate('RelationshipListScreen', { relationship: item })}
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                ]}
            >
                <Text style={styles.cardText}>{item.moduleLabel}</Text>
            </Pressable>
        );
    }

    // Function để refresh dữ liệu meeting hiện tại
    const handleRefreshMeeting = useCallback(async () => {
        if (!routeRefreshMeeting) return;
        
        setMeetingRefreshing(true);
        try {
            await routeRefreshMeeting();
            // Có thể thêm logic để reload meeting data nếu cần
        } catch (error) {
            console.error('Lỗi khi refresh meeting:', error);
        } finally {
            setMeetingRefreshing(false);
        }
    }, [routeRefreshMeeting]);

    // Sử dụng custom hook
    const {
        meeting,
        loading,
        refreshing,
        editViews,
        requiredFields,
        error,
        deleting,
        refreshMeeting,
        updateMeetingData,
        deleteMeeting,
        getFieldValue,
        getFieldLabel,
        shouldDisplayField
    } = useMeetingDetail(currentMeeting, routeEditViews, routeRequiredFields, routeGetFieldValue, routeGetFieldLabel, navigation, handleRefreshMeeting);

    // Handle delete with confirmation
    const handleDelete = () => {
        if (!canEditMeeting()) {
            Alert.alert(
                'Không thể xóa',
                'Bạn không có quyền xóa cuộc họp này.',
                [{ text: 'OK' }]
            );
            return;
        }

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
                            if (typeof handleRefreshMeeting === 'function') {
                                handleRefreshMeeting();
                            }
                            Alert.alert(
                                'Thành công',
                                'Đã xóa cuộc họp thành công',
                                [{ text: 'OK', onPress: () => navigation.goBack() }]
                            );
                        } else {
                            Alert.alert(
                                'Thất bại',
                                'Không thể xóa cuộc họp, vui lòng thử lại.',
                                [{ text: 'OK' }]
                            );
                        }
                    }
                }
            ]
        );
    };

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
        if (!canEditMeeting()) {
            Alert.alert(
                'Không thể chỉnh sửa',
                'Bạn không có quyền chỉnh sửa cuộc họp này.',
                [{ text: 'OK' }]
            );
            return;
        }
        navigation.navigate('MeetingUpdateScreen', { 
            routeMeeting: meeting, // Truyền updated meeting thay vì currentMeeting
            routeEditViews,
            routeListViews,
            routeRequiredFields,
            routeGetFieldValue,
            routeGetFieldLabel,
            refreshMeeting: updateMeetingData, // Truyền update function cho DetailScreen
            refreshMeetingList: routeRefreshMeeting // Truyền callback từ MeetingListScreen để refresh list
        });
    };

    const handleCopyId = async () => {
        if (meeting?.id) {
            try {
                await Clipboard.setStringAsync(meeting.id);
                Alert.alert('Thành công', 'ID đã được sao chép vào clipboard');
            } catch (err) {
                Alert.alert('Lỗi', 'Không thể sao chép ID');
                console.warn('Copy ID error:', err);
            }
        }
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
        const value = getFieldValue(meeting, field.key.toLowerCase());

        if (!shouldDisplayField(field.key)) {
            return null;
        }

        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{getFieldLabel(field.key.toLowerCase())}</Text>
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
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefreshMeeting}>
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
                            refreshing={meetingRefreshing || refreshing}
                            onRefresh={handleRefreshMeeting}
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
                            {meeting.id && (
                                            <View  style={styles.fieldContainer}>
                                                <Text style={styles.fieldLabel}>ID:</Text>
                                                <View style={styles.idContainer}>
                                                <Text style={[styles.fieldValue, styles.idValue]}>
                                                {formatFieldValue('id', meeting.id)}
                                                                </Text>
                                                <TouchableOpacity 
                                                    style={styles.copyButton}
                                                    onPress={handleCopyId}
                                                >
                                                    <Ionicons name="copy-outline" size={16} color="#007AFF" />
                                                </TouchableOpacity>
                                                </View>
                                            </View>
                                        )
                                    }
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
                                {editViews.map(field => renderFieldItem(field))}
                            </View>
                        </View>
                    )}
                    {/* Mối quan hệ */}
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
                            scrollEnabled={paddedData.length > 8} // Enable scroll nếu có > 2 rows
                        />
                    </View>
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
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    idValue: {
        flex: 1,
        marginRight: 10,
    },
    copyButton: {
        padding: 8,
        borderRadius: 4,
        backgroundColor: '#f0f4ff',
        borderWidth: 1,
        borderColor: '#007AFF',
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
    row: {
        paddingHorizontal: 8,
        justifyContent: 'flex-start',
    },
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
        minHeight: 120, // Đổi từ height cố định sang minHeight
        maxHeight: 300, // Thêm maxHeight để giới hạn khi có quá nhiều items
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


});
