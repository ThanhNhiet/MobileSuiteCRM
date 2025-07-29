import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
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
import { languageUtils } from "../../utils/LanguageUtils";

export default function NoteDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { noteId } = route.params;

    // Initialize LanguageUtils and translations
    const [translations, setTranslations] = useState({});

    // Initialize translations
    useEffect(() => {
        const initTranslations = async () => {
            await languageUtils.loadLanguageData('Notes');
            
            // Get all translations at once
            const translatedLabels = await languageUtils.translateKeys([
                'LBL_MODULE_DETAIL_NAME',
                'LBL_LOADING_DETAIL',
                'LBL_ERROR_LOAD_NOTE',
                'LBL_TRY_AGAIN',
                'LBL_REFRESH_PULL',
                'LBL_RELATED_PREFIX',
                'LBL_UPDATE_BUTTON',
                'LBL_DELETE_BUTTON',
                'LBL_DELETING',
                'LBL_NO_PERMISSION',
                'MSG_NO_DELETE_PERMISSION',
                'MSG_NO_EDIT_PERMISSION',
                'LBL_CONFIRM_DELETE',
                'MSG_CONFIRM_DELETE',
                'LBL_CANCEL',
                'LBL_DELETE',
                'LBL_SUCCESS',
                'MSG_DELETE_SUCCESS',
                'LBL_OK',
                'LBL_ERROR',
                'MSG_COPY_SUCCESS',
                'MSG_COPY_ERROR',
                'LBL_NO_VALUE'
            ], 'Notes');

            setTranslations({
                mdName: translatedLabels.LBL_MODULE_DETAIL_NAME,
                loadingText: translatedLabels.LBL_LOADING_DETAIL,
                errorTitle: translatedLabels.LBL_ERROR_LOAD_NOTE,
                retryText: translatedLabels.LBL_TRY_AGAIN,
                refreshPull: translatedLabels.LBL_REFRESH_PULL,
                relatedPrefix: translatedLabels.LBL_RELATED_PREFIX,
                updateButton: translatedLabels.LBL_UPDATE_BUTTON,
                deleteButton: translatedLabels.LBL_DELETE_BUTTON,
                deletingText: translatedLabels.LBL_DELETING,
                noPermission: translatedLabels.LBL_NO_PERMISSION,
                noDeletePermission: translatedLabels.MSG_NO_DELETE_PERMISSION,
                noEditPermission: translatedLabels.MSG_NO_EDIT_PERMISSION,
                confirmDelete: translatedLabels.LBL_CONFIRM_DELETE,
                confirmDeleteMsg: translatedLabels.MSG_CONFIRM_DELETE,
                cancel: translatedLabels.LBL_CANCEL,
                delete: translatedLabels.LBL_DELETE,
                success: translatedLabels.LBL_SUCCESS,
                deleteSuccess: translatedLabels.MSG_DELETE_SUCCESS,
                ok: translatedLabels.LBL_OK,
                error: translatedLabels.LBL_ERROR,
                copySuccess: translatedLabels.MSG_COPY_SUCCESS,
                copyError: translatedLabels.MSG_COPY_ERROR,
                noValue: translatedLabels.LBL_NO_VALUE
            });
        };

        initTranslations();
    }, []);

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

    // Handle navigate to parent detail
    // const handleParentPress = (parentId, parentType) => {
    //     if (!parentId || !parentType) return;
    //     switch (parentType) {
    //         case 'Accounts':
    //             navigation.navigate('AccountDetailScreen', { accountId: parentId });
    //             break;
    //         case 'Users':
    //             break;
    //         case 'Tasks':
    //             navigation.navigate('TaskDetailScreen', { taskId: parentId });
    //             break;
    //         case 'Meetings':
    //             navigation.navigate('MeetingDetailScreen', { meetingId: parentId });
    //             break;
    //         default:
    //             break;
    //     }
    // };

    // Handle delete with confirmation
    const handleDelete = () => {
        if (!canEditNote()) {
            Alert.alert(
                translations.noPermission || 'Không có quyền',
                translations.noDeletePermission || 'Bạn không có quyền xóa ghi chú này vì nó được giao cho người dùng khác.',
                [{ text: translations.ok || 'OK' }]
            );
            return;
        }
        
        Alert.alert(
            translations.confirmDelete || 'Xác nhận xóa',
            translations.confirmDeleteMsg || 'Bạn có chắc chắn muốn xóa ghi chú này không? Hành động này không thể hoàn tác.',
            [
                { text: translations.cancel || 'Hủy', style: 'cancel' },
                {
                    text: translations.delete || 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteNote();
                        if (success) {
                            Alert.alert(
                                translations.success || 'Thành công',
                                translations.deleteSuccess || 'Đã xóa ghi chú thành công',
                                [{ text: translations.ok || 'OK', onPress: () => navigation.navigate('NoteListScreen') }]
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
                translations.noPermission || 'Không có quyền',
                translations.noEditPermission || 'Bạn không có quyền chỉnh sửa ghi chú này vì nó được giao cho người dùng khác.',
                [{ text: translations.ok || 'OK' }]
            );
            return;
        }
        navigation.navigate('NoteUpdateScreen', { noteData: note });
    };

    // Format field value for display
    const formatFieldValue = (fieldKey, value) => {
        if (!value) return translations.noValue || 'Không có';

        switch (fieldKey) {
            case 'date_entered':
            case 'date_modified':
                return formatDateTime(value);
            case 'parent_type':
                const typeLabels = {
                    'Accounts': languageUtils.translate('LBL_ACCOUNTS'),
                    'Users': languageUtils.translate('LBL_USERS'),
                    'Tasks': languageUtils.translate('LBL_TASKS'),
                    'Meetings': languageUtils.translate('LBL_MEETINGS')
                };
                return typeLabels[value] || value;
            default:
                return value.toString();
        }
    };

    // Handle copy ID to clipboard
    const handleCopyId = async () => {
        if (note?.id) {
            try {
                await Clipboard.setStringAsync(note.id);
                Alert.alert(translations.success || 'Thành công', translations.copySuccess || 'ID đã được sao chép vào clipboard');
            } catch (err) {
                Alert.alert(translations.error || 'Lỗi', translations.copyError || 'Không thể sao chép ID');
                console.warn('Copy ID error:', err);
            }
        }
    };

    // Render field item
    const renderFieldItem = (field) => {
        const value = getFieldValue(field.key);

        if (!shouldDisplayField(field.key)) {
            return null;
        }

        // Special handling for ID field with copy button
        if (field.key === 'id') {
            return (
                <View key={field.key} style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <View style={styles.idContainer}>
                        <Text style={[styles.fieldValue, styles.idValue]}>
                            {formatFieldValue(field.key, value)}
                        </Text>
                        <TouchableOpacity 
                            style={styles.copyButton}
                            onPress={handleCopyId}
                        >
                            <Ionicons name="copy-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View key={field.key} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
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
                    moduleName={translations.mdName || 'Ghi chú'}
                    navigation={navigation}
                    name="NoteUpdateScreen"
                />

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4B84FF" />
                    <Text style={styles.loadingText}>{translations.loadingText || 'Đang tải chi tiết ghi chú...'}</Text>
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
                    moduleName={translations.mdName || 'Ghi chú'}
                    navigation={navigation}
                    name="NoteUpdateScreen"
                />

                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
                    <Text style={styles.errorTitle}>{translations.errorTitle || 'Không thể tải ghi chú'}</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refreshNote}>
                        <Text style={styles.retryButtonText}>{translations.retryText || 'Thử lại'}</Text>
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
                    moduleName={translations.mdName || 'Ghi chú'}
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
                            title={translations.refreshPull || 'Kéo để tải lại...'}
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
                                <TouchableOpacity style={styles.parentInfo}
                                    // onPress={() => handleParentPress(note.parent_id, note.parent_type)}
                                >
                                    <Ionicons name="link-outline" size={16} color="#666" />
                                    <Text style={styles.parentText}>
                                        {translations.relatedPrefix || 'Liên quan:'} {note.parent_name}
                                        ({formatFieldValue('parent_type', note.parent_type)})
                                    </Text>
                                </TouchableOpacity>
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
                                {translations.updateButton || 'Cập nhật'}
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
                                {deleting ? (translations.deletingText || 'Đang xóa...') : (translations.deleteButton || 'Xóa')}
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
    // ID field with copy button styles
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    idValue: {
        flex: 1,
        marginRight: 8,
    },
    copyButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#f0f8ff',
        borderWidth: 1,
        borderColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 32,
        minHeight: 32,
    },
});