import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React from "react";
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
import { useNoteDetail } from "../../services/useApi/note/UseNote_Detail";
import { formatDateTime } from "../../utils/FormatDateTime";

export default function NoteDetailScreen() {
    const mdName = 'Ghi chú';
    const navigation = useNavigation();
    const route = useRoute();
    const { noteId } = route.params;

    // Sử dụng custom hook
    const {
        note,
        detailFields,
        loading,
        refreshing,
        error,
        deleting,
        refreshNote,
        deleteNote,
        getFieldValue,
        getFieldLabel,
        shouldDisplayField
    } = useNoteDetail(noteId);
   

    // Handle delete with confirmation
    const handleDelete = () => {
        if (!canEditNote()) {
            Alert.alert(
                'Không có quyền',
                'Bạn không có quyền xóa ghi chú này vì nó được giao cho người dùng khác.',
                [{ text: 'OK' }]
            );
            return;
        }
        
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa ghi chú này không? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteNote();
                        if (success) {
                            Alert.alert(
                                'Thành công',
                                'Đã xóa ghi chú thành công',
                                [{ text: 'OK', onPress: () => navigation.navigate('NoteListScreen') }]
                            );
                        }
                    }
                }
            ]
        );
    };

    // Check if user can edit this note
    const canEditNote = () => {
        if (!note) return false;
        
        // If assigned_user_name is different from created_by_name, disable editing
        if (note.assigned_user_name && note.created_by_name && 
            note.assigned_user_name !== note.created_by_name) {
            return false;
        }
        
        return true;
    };

    // Navigate to update screen
    const handleUpdate = () => {
        if (!canEditNote()) {
            Alert.alert(
                'Không có quyền',
                'Bạn không có quyền chỉnh sửa ghi chú này vì nó được giao cho người dùng khác.',
                [{ text: 'OK' }]
            );
            return;
        }
        navigation.navigate('NoteUpdateScreen', { noteData: note });
    };

    // Format field value for display
    const formatFieldValue = (fieldKey, value) => {
        if (!value) return 'Không có';

        switch (fieldKey) {
            case 'date_entered':
            case 'date_modified':
                return formatDateTime(value);
            case 'parent_type':
                const typeLabels = {
                    'Accounts': 'Khách hàng',
                    'Users': 'Người dùng',
                    'Tasks': 'Công việc',
                    'Meetings': 'Cuộc họp'
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
                    name="NoteUpdateScreen"
                />

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B84FF" />
                    <Text style={styles.loadingText}>Đang tải chi tiết ghi chú...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error && !note) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <TopNavigationDetail
                    moduleName={mdName}
                    navigation={navigation}
                    name="NoteUpdateScreen"
                />

                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
                    <Text style={styles.errorTitle}>Không thể tải ghi chú</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refreshNote}>
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
                    name="NoteUpdateScreen"
                />

                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshNote}
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

                    {/* Note Details */}
                    {note && (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.noteTitle}>{note.name}</Text>

                            {note.parent_name && note.parent_type && (
                                <View style={styles.parentInfo}>
                                    <Ionicons name="link-outline" size={16} color="#666" />
                                    <Text style={styles.parentText}>
                                        Liên quan: {note.parent_name}
                                        ({formatFieldValue('parent_type', note.parent_type)})
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
                {note && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={[
                                styles.updateButton, 
                                (!canEditNote() || deleting) && styles.disabledButton
                            ]}
                            onPress={handleUpdate}
                            disabled={deleting || !canEditNote()}
                        >
                            <Ionicons 
                                name="create-outline" 
                                size={20} 
                                color={(!canEditNote() || deleting) ? "#999" : "#fff"} 
                            />
                            <Text style={[
                                styles.updateButtonText,
                                (!canEditNote() || deleting) && styles.disabledButtonText
                            ]}>
                                Cập nhật
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.deleteButton, 
                                deleting && styles.deletingButton,
                                !canEditNote() && styles.disabledButton
                            ]}
                            onPress={handleDelete}
                            disabled={deleting || !canEditNote()}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons 
                                    name="trash-outline" 
                                    size={20} 
                                    color={!canEditNote() ? "#999" : "#fff"} 
                                />
                            )}
                            <Text style={[
                                styles.deleteButtonText,
                                !canEditNote() && styles.disabledButtonText
                            ]}>
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
    content: {
        flex: 1,
        padding: 20,
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
    noteTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        lineHeight: 26,
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
        paddingHorizontal: 20,
        paddingVertical: 15,
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
    disabledButton: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    disabledButtonText: {
        color: '#999',
    },
});