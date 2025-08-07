import RelationshipsData from '@/src/services/useApi/relationship/RelationshipData';
import TaskData from '@/src/services/useApi/task/TaskData';
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
import { formatDateTime } from "../../utils/format/FormatDateTime";

const { width } = Dimensions.get('window');
const ITEM_W = (width - 8 * 2 - 4 * 2 * 4) / 4;

const useTaskDetail = (task, editViews, requiredFields, getFieldValue, getFieldLabel, navigation, refreshTask) => {
    const [deleting, setDeleting] = useState(false);
    const [data, setData] = useState(task);

    // Function để update task data
    const updateTaskData = (updatedData) => {
        setData(updatedData);
    };

    const deleteTask = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            navigation.navigate('LoginScreen');
            return false;
        }

        try {
            setDeleting(true);
            const result = await TaskData.DeleteTask(task.id, token);
            setDeleting(false);
            return result;
        } catch (error) {
            console.error('Lỗi khi xoá:', error);
            setDeleting(false);
            return false;
        }
    };

    return {
        task: data || task,
        editViews,
        requiredFields,
        loading: false,
        refreshing: false,
        error: null,
        deleting,
        refreshTask,
        updateTaskData, // Expose function để update data
        deleteTask,
        getFieldValue: getFieldValue || ((item, key) => item[key]),
        getFieldLabel: getFieldLabel || ((key) => key),
        shouldDisplayField: (key) => true,
    };
};

export default function TaskDetailScreen() {
    const mdName = 'Công việc';
    const navigation = useNavigation();
    const route = useRoute();
    const {task: routeTask, editViews: routeEditViews, requiredFields: routeRequiredFields,listViews: routeListViews, getFieldValue: routeGetFieldValue, getFieldLabel: routeGetFieldLabel, refreshTask: routeRefreshTask} = route.params;
    const [relationships, setRelationships] = useState([]);
    // State để quản lý dữ liệu task hiện tại
    const [currentTask, setCurrentTask] = useState(routeTask);
    const [taskRefreshing, setTaskRefreshing] = useState(false);
    const [getDataRelationship, setGetDataRelationship] = React.useState([]);
    useEffect(() => {
        const fetchRelationships = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return;
                }

                const response = await TaskData.getRelationships(token, currentTask.id);
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
    }, [currentTask.id]);
    useEffect(() => {
        // Xử lý khi relationships thay đổi
            if(!relationships) return;
            const relatedLinks = relationships.map( (item) => {
                    return {
                        relatedLink: item.relatedLink,
                        moduleName : item.moduleName,
                    };
            });
            // Xử lý relatedLinks ở đây nếu cần
            const fetchRelatedData = async () => {
                try{
                    const token = AsyncStorage.getItem('token');
                    if (!token) {
                        navigation.navigate('LoginScreen');
                        return;
                    }
                    const results = await RelationshipsData.getDataRelationship(token, relatedLinks);
                    setGetDataRelationship(results);
                } catch (error) {
                    console.error('Lỗi khi xử lý relationships:', error);
                }
            };
        fetchRelatedData();
    }, [relationships]);

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
        
            let checked = false;
            getDataRelationship.map((data) => {
                if (data.moduleName === item.displayName) {
                    if (data.length > 0) {
                        checked = true;
                    }
                }
            });
            return (
                <Pressable
                    onPress={() => {
                        navigation.navigate('RelationshipListScreen', { relationship: item });
                    }}
                    style={({ pressed }) => [
                        styles.card,
                        !checked && styles.cardNoData,       // màu khác nếu không có data
                        pressed && styles.cardPressed,       // hiệu ứng khi nhấn
                    ]}
                >
                    <Text style={styles.cardText}>
                        {item.displayName || item.moduleLabel || item.moduleName || item.name}
                    </Text>
                </Pressable>
            );
        };

    // Function để refresh dữ liệu task hiện tại
    const handleRefreshTask = useCallback(async () => {
        if (!routeRefreshTask) return;
        
        setTaskRefreshing(true);
        try {
            await routeRefreshTask();
            // Có thể thêm logic để reload task data nếu cần
        } catch (error) {
            console.error('Lỗi khi refresh task:', error);
        } finally {
            setTaskRefreshing(false);
        }
    }, [routeRefreshTask]);

    // Sử dụng custom hook
    const {
        task,
        loading,
        refreshing,
        editViews,
        requiredFields,
        error,
        deleting,
        refreshTask,
        updateTaskData,
        deleteTask,
        getFieldValue,
        getFieldLabel,
        shouldDisplayField
    } = useTaskDetail(currentTask, routeEditViews, routeRequiredFields, routeGetFieldValue, routeGetFieldLabel, navigation, handleRefreshTask);

    // Handle delete with confirmation
    const handleDelete = () => {
        if (!canEditTask()) {
            Alert.alert(
                'Không thể xóa',
                'Bạn không có quyền xóa công việc này.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa công việc này không? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteTask();
                        if (success) {
                            if (typeof handleRefreshTask === 'function') {
                                handleRefreshTask();
                            }
                            Alert.alert(
                                'Thành công',
                                'Đã xóa công việc thành công',
                                [{ text: 'OK', onPress: () => navigation.goBack() }]
                            );
                        } else {
                            Alert.alert(
                                'Thất bại',
                                'Không thể xóa công việc, vui lòng thử lại.',
                                [{ text: 'OK' }]
                            );
                        }
                    }
                }
            ]
        );
    };

    // Check if user can edit this task
    const canEditTask = () => {
        if (!task) return false;
        
        // If assigned_user_name is different from created_by_name, disable editing
        if (task.assigned_user_name && task.created_by_name && 
            task.assigned_user_name !== task.created_by_name) {
            return false;
        }
        
        return true;
    };

    // Navigate to update screen
    const handleUpdate = () => {
        if (!canEditTask()) {
            Alert.alert(
                'Không thể chỉnh sửa',
                'Bạn không có quyền chỉnh sửa công việc này.',
                [{ text: 'OK' }]
            );
            return;
        }
        navigation.navigate('TaskUpdateScreen', { 
            task,
            editViews: routeEditViews,
            requiredFields: routeRequiredFields,
            getFieldValue: routeGetFieldValue, 
            getFieldLabel: routeGetFieldLabel, 
            refreshTask: updateTaskData, // Truyền update function cho DetailScreen
            refreshTaskList: routeRefreshTask // Truyền callback từ TaskListScreen để refresh list
        });
    };

    const handleCopyId = async () => {
        if (task?.id) {
            try {
                await Clipboard.setStringAsync(task.id);
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
            case 'date_due':
            case 'date_start':
            case 'date_entered':
            case 'date_modified':
                return formatDateTime(value);
            case 'status':
                const statusLabels = {
                    'Not Started': 'Chưa bắt đầu',
                    'In Progress': 'Đang thực hiện',
                    'Completed': 'Hoàn thành',
                    'Pending Input': 'Chờ phản hồi',
                    'Deferred': 'Hoãn lại'
                };
                return statusLabels[value] || value;
            case 'priority':
                const priorityLabels = {
                    'High': 'Cao',
                    'Medium': 'Trung bình',
                    'Low': 'Thấp'
                };
                return priorityLabels[value] || value;
            case 'parent_type':
                const typeLabels = {
                    'Accounts': 'Khách hàng',
                    'Contacts': 'Liên hệ',
                    'Opportunities': 'Cơ hội',
                    'Meetings': 'Cuộc họp'
                };
                return typeLabels[value] || value;
            default:
                return value.toString();
        }
    };

    // Render field item
    const renderFieldItem = (field) => {
        const value = getFieldValue(task, field.key);

        if (!shouldDisplayField(field.key)) {
            return null;
        }
        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{getFieldLabel(field.key)}</Text>
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
                    name="TaskUpdateScreen"
                />

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B84FF" />
                    <Text style={styles.loadingText}>Đang tải chi tiết công việc...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error && !task) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={mdName}
                    navigation={navigation}
                    name="TaskUpdateScreen"
                />

                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
                    <Text style={styles.errorTitle}>Không thể tải công việc</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefreshTask}>
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
                    name="TaskUpdateScreen"
                />

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={taskRefreshing || refreshing}
                            onRefresh={handleRefreshTask}
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

                    {/* Task Details */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thông tin chính</Text>
                    </View>
                    {task && (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.taskTitle}>{task.name}</Text>

                            {task.id && (
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.fieldLabel}>ID:</Text>
                                    <View style={styles.idContainer}>
                                        <Text style={[styles.fieldValue, styles.idValue]}>
                                            {formatFieldValue('id', task.id)}
                                        </Text>
                                        <TouchableOpacity
                                style={styles.copyButton}
                                onPress={handleCopyId}
                            >
                                <Ionicons name="copy-outline" size={16} color="#007AFF" />
                            </TouchableOpacity>
                            </View>
                        </View>
                            )}

                            {task.date_due && (
                                <View style={styles.dueDateInfo}>
                                    <Ionicons name="calendar-outline" size={16} color="#666" />
                                    <Text style={styles.dueDateText}>
                                        Hạn: {formatDateTime(task.date_due)}
                                    </Text>
                                </View>
                            )}

                            {task.priority && (
                                <View style={styles.priorityInfo}>
                                    <Ionicons name="flag-outline" size={16} color="#666" />
                                    <Text style={styles.priorityText}>
                                        Độ ưu tiên: {formatFieldValue('priority', task.priority)}
                                    </Text>
                                </View>
                            )}

                            {task.status && (
                                <View style={styles.statusInfo}>
                                    <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
                                    <Text style={styles.statusText}>
                                        Trạng thái: {formatFieldValue('status', task.status)}
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
                {task && (
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
    taskTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        lineHeight: 26,
    },
    dueDateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    dueDateText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#FF9800',
        fontWeight: '500',
    },
    priorityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#F44336',
    },
    priorityText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#F44336',
        fontWeight: '500',
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    statusText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#4CAF50',
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
    cardInvisible: {
        width: ITEM_W,
        marginHorizontal: 2,
        marginVertical: 8,
        backgroundColor: 'transparent',
    },
    card: {
        backgroundColor: '#2196F3',
        padding: 24,          // tăng từ 16 lên 24
        borderRadius: 12,     // bo góc mượt hơn
        margin: 12,           // tăng khoảng cách giữa các card
        alignItems: 'center',
        minWidth: 120,        // nếu bạn muốn mỗi card rộng hơn
    },
    cardNoData: {
        backgroundColor: '#B0BEC5', // màu xám cho module không có dữ liệu
    },

    cardPressed: {
        opacity: 0.7,
    },

    cardText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});