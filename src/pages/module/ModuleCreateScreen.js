import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavigationCreate from '../../components/navigations/TopNavigationCreate';
import { useModule_Create } from '../../services/useApi/module/UseModule_Create';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';

export default function ModuleCreateScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    
    // Get moduleName from route params
    const { moduleName } = route.params || {};
    
    // Validation
    if (!moduleName) {
        throw new Error('moduleName is required for ModuleCreateScreen');
    }

    // SystemLanguageUtils instance
    const systemLanguageUtils = SystemLanguageUtils.getInstance();

    // Initialize translations
    const [translations, setTranslations] = useState({});

    // Modal states
    const [showParentTypeModal, setShowParentTypeModal] = useState(false);
    const [parentTypeOptions, setParentTypeOptions] = useState([]);
    
    // Enum modal states
    const [showEnumModal, setShowEnumModal] = useState(false);
    const [currentEnumField, setCurrentEnumField] = useState(null);
    
    // DateTime picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [currentDateField, setCurrentDateField] = useState(null);
    const [dateTimeMode, setDateTimeMode] = useState('date'); // 'date' or 'time'

    // Local loading states
    const [saving, setSaving] = useState(false);

    // Initialize translations
    useEffect(() => {
        const initializeTranslations = async () => {
            try {
                // Get all translations at once using SystemLanguageUtils
                const translatedLabels = await systemLanguageUtils.translateKeys([
                    `LBL_${moduleName.toUpperCase()}`,
                    'LBL_CREATE_BUTTON_LABEL',
                    'LBL_EMAIL_LOADING', 
                    'LBL_EMAIL_SUCCESS',
                    'LBL_ALT_INFO',
                    'UPLOAD_REQUEST_ERROR',
                    'Alerts',
                    'LBL_OK',
                    'LBL_SEARCH',
                    'LBL_ID_FF_SELECT',
                    'LBL_ACCOUNTS',
                    'LBL_USERS',
                    'LBL_TASKS',
                    'LBL_MEETINGS',
                    'LBL_CHECK_TO_VERIFY',
                    'LBL_CANCEL',
                    'LBL_SAVE',
                    'LBL_SELECT_BUTTON_LABEL',
                    'LBL_EMAIL_CANCEL'
                ]);

                setTranslations({
                    mdName: translatedLabels[`LBL_${moduleName.toUpperCase()}`] || moduleName,
                    createModule: translatedLabels.LBL_CREATE_BUTTON_LABEL + ' ' + (translatedLabels[`LBL_${moduleName.toUpperCase()}`] || moduleName),
                    loadingText: translatedLabels.LBL_EMAIL_LOADING || 'Đang tải...',
                    successTitle: translatedLabels.LBL_ALT_INFO || 'Thông tin',
                    successMessage: translatedLabels.LBL_EMAIL_SUCCESS || `Tạo ${moduleName} thành công!`,
                    errorTitle: translatedLabels.Alerts || 'Lỗi',
                    errorMessage: translatedLabels.UPLOAD_REQUEST_ERROR || `Không thể tạo ${moduleName}`,
                    ok: translatedLabels.LBL_OK || 'OK',
                    createButton: translatedLabels.LBL_CREATE_BUTTON_LABEL || 'Tạo',
                    checkButton: translatedLabels.LBL_SEARCH || 'Tìm',
                    checkPlaceholder: '',
                    selectPlaceholder: translatedLabels.LBL_ID_FF_SELECT || '--------',
                    accounts: translatedLabels.LBL_ACCOUNTS || 'Tài khoản',
                    users: translatedLabels.LBL_USERS || 'Người dùng',
                    tasks: translatedLabels.LBL_TASKS || 'Nhiệm vụ',
                    meetings: translatedLabels.LBL_MEETINGS || 'Cuộc họp',
                    checkToVerify: '',
                    notification: translatedLabels.LBL_ALT_INFO || 'Thông báo'
                });
            } catch (error) {
                console.error(`ModuleCreateScreen (${moduleName}): Error loading translations:`, error);
                // Set fallback translations
                setTranslations({
                    mdName: moduleName,
                    createModule: `Tạo ${moduleName}`,
                    loadingText: 'Đang tải...',
                    successTitle: 'Thành công',
                    successMessage: `Tạo ${moduleName} thành công!`,
                    errorTitle: 'Lỗi',
                    errorMessage: `Không thể tạo ${moduleName}`,
                    ok: 'OK',
                    createButton: 'Tạo',
                    checkButton: 'Check',
                    checkPlaceholder: 'Nhập để kiểm tra',
                    selectPlaceholder: '--------',
                    accounts: 'Khách hàng',
                    users: 'Người dùng',
                    tasks: 'Nhiệm vụ',
                    meetings: 'Cuộc họp',
                    checkToVerify: '',
                    notification: 'Thông báo'
                });
            }
        };

        initializeTranslations();
    }, [moduleName]);

    // Use the custom hook
    const {
        formData,
        createFields,
        loading,
        error,
        validationErrors,
        enumFieldsData,
        updateField,
        createRecord,
        resetForm,
        getFieldValue,
        getFieldLabel,
        getFieldError,
        isFormValid,
        hasParentNameField,
        getParentTypeOptions,
        getEnumOptions,
        getEnumLabel,
        isEnumField
    } = useModule_Create(moduleName);

    // Load parent type options when component mounts
    useEffect(() => {
        const loadParentTypeOptions = async () => {
            if (hasParentNameField()) {
                try {
                    const options = await getParentTypeOptions();
                    setParentTypeOptions(options);
                } catch (error) {
                    console.warn('Error loading parent type options:', error);
                }
            }
        };

        loadParentTypeOptions();
    }, [hasParentNameField, getParentTypeOptions]);

    // Handle parent type selection
    const handleParentTypeSelect = async (value) => {
        await updateField('parent_type', value);
        // Clear parent_name and parent_id when parent_type changes
        await updateField('parent_name', '');
        await updateField('parent_id', '');
        setShowParentTypeModal(false);
    };

    // Get parent type label for display
    const getParentTypeLabel = () => {
        // First check if it's in the enum fields data
        if (enumFieldsData && enumFieldsData.parent_type && enumFieldsData.parent_type.values) {
            const value = getFieldValue('parent_type');
            if (value && enumFieldsData.parent_type.values[value]) {
                return enumFieldsData.parent_type.values[value];
            }
        }
        
        // Fall back to the old method using parentTypeOptions
        const selectedOption = parentTypeOptions.find(opt => opt.value === getFieldValue('parent_type'));
        return selectedOption ? selectedOption.label : (translations.selectPlaceholder || '--------');
    };
    
    // Show enum modal for a specific field
    const showEnumModalForField = (fieldKey) => {
        setCurrentEnumField(fieldKey);
        setShowEnumModal(true);
    };
    
    // Handle enum value selection
    const handleEnumSelect = async (value) => {
        if (currentEnumField) {
            await updateField(currentEnumField, value);
        }
        setShowEnumModal(false);
    };
    
    // Get enum option label for display
    const getEnumOptionLabel = (fieldKey) => {
        const value = getFieldValue(fieldKey);
        if (!value) return translations.selectPlaceholder || '--------';
        
        // Get the translated label from enumFieldsData
        return getEnumLabel(fieldKey, value) || value;
    };
    
    // Show date picker for a datetime field
    const showDatePickerForField = (fieldKey, mode = 'date') => {
        setCurrentDateField(fieldKey);
        setDateTimeMode(mode);
        if (mode === 'date') {
            setShowDatePicker(true);
        } else {
            setShowTimePicker(true);
        }
    };
    
    // Handle date selection
    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
        setShowDatePicker(false);
        
        if (event.type === 'dismissed') {
            return; // User canceled the picker
        }
        
        if (currentDateField) {
            // For datetime fields, just save the date with midnight time (00:00:00)
            if (getFieldType(currentDateField) === 'datetime') {
                // Create a new date with time set to midnight for consistent format
                const newDate = new Date(currentDate);
                newDate.setHours(0, 0, 0, 0); 
                const formattedDateTime = formatDateTime(newDate);
                updateField(currentDateField, formattedDateTime);
            }
            
            // For datetimecombo, we need to merge existing time (if any) with the new date
            if (getFieldType(currentDateField) === 'datetimecombo') {
                const currentValue = getFieldValue(currentDateField);
                let hours = 0;
                let minutes = 0;
                let seconds = 0;
                
                // Try to extract existing time from current value
                if (currentValue && currentValue.includes(' ')) {
                    const timePart = currentValue.split(' ')[1];
                    if (timePart && timePart.includes(':')) {
                        const timeParts = timePart.split(':');
                        hours = parseInt(timeParts[0], 10) || 0;
                        minutes = parseInt(timeParts[1], 10) || 0;
                        seconds = parseInt(timeParts[2], 10) || 0;
                    }
                }
                
                // Create a new date with the selected date and existing time
                const newDate = new Date(currentDate);
                newDate.setHours(hours, minutes, seconds, 0);
                
                const formattedDateTime = formatDateTime(newDate);
                updateField(currentDateField, formattedDateTime);
            }
        }
    };
    
    // Handle time selection
    const handleTimeChange = (event, selectedTime) => {
        const currentTime = selectedTime || new Date();
        setShowTimePicker(false);
        
        if (event.type === 'dismissed') {
            return; // User canceled the picker
        }
        
        if (currentDateField) {
            // For datetimecombo, we need to merge existing date with the new time
            const currentValue = getFieldValue(currentDateField);
            
            // Create a base date - either from existing value or today
            let baseDate = new Date();
            if (currentValue && currentValue.includes(' ')) {
                const datePart = currentValue.split(' ')[0];
                if (datePart && datePart.includes('-')) {
                    const [y, m, d] = datePart.split('-');
                    if (y && m && d) {
                        baseDate = new Date(y, parseInt(m, 10) - 1, d);
                    }
                }
            }
            
            // Merge the date with the selected time
            const hours = currentTime.getHours();
            const minutes = currentTime.getMinutes();
            const seconds = currentTime.getSeconds();
            baseDate.setHours(hours, minutes, seconds, 0);
            
            const formattedDateTime = formatDateTime(baseDate);
            updateField(currentDateField, formattedDateTime);
        }
    };
    
    // Helper function to get the field type
    const getFieldType = (fieldKey) => {
        const field = createFields.find(f => f.key === fieldKey);
        return field ? field.type : null;
    };
    
    // Helper function to format date to YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Helper function to format datetime to YYYY-MM-DD HH:MM:SS
    const formatDateTime = (date) => {
        const dateStr = formatDate(date);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        // Add seconds to match standard MySQL datetime format
        return `${dateStr} ${hours}:${minutes}:${seconds}`;
    };
    
    // Helper function to update just the hours or minutes in a datetime string
    const updateTimeComponent = (fieldKey, value, isHours) => {
        if (!value.trim()) value = '0'; // Default to 0 if empty
        const numValue = parseInt(value, 10);
        
        // Validate range: 0-23 for hours, 0-59 for minutes
        const maxValue = isHours ? 23 : 59;
        const validValue = Math.min(Math.max(0, numValue), maxValue);
        
        const currentValue = getFieldValue(fieldKey) || '';
        let dateObj = new Date();
        
        // Try to parse existing date and time
        if (currentValue && currentValue.includes(' ')) {
            const [datePart, timePart] = currentValue.split(' ');
            if (datePart && datePart.includes('-')) {
                const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
                dateObj = new Date(year, month - 1, day);
            }
            
            if (timePart && timePart.includes(':')) {
                const timeParts = timePart.split(':');
                const hours = parseInt(timeParts[0], 10) || 0;
                const minutes = parseInt(timeParts[1], 10) || 0;
                const seconds = parseInt(timeParts[2], 10) || 0;
                
                // Update either hours or minutes while preserving seconds
                dateObj.setHours(
                    isHours ? validValue : hours, 
                    isHours ? minutes : validValue,
                    seconds
                );
            } else {
                dateObj.setHours(isHours ? validValue : 0, isHours ? 0 : validValue, 0);
            }
        } else {
            // If there's no existing datetime, set time components accordingly
            dateObj.setHours(isHours ? validValue : 0, isHours ? 0 : validValue, 0);
        }
        
        const formattedDateTime = formatDateTime(dateObj);
        updateField(fieldKey, formattedDateTime);
    };
    
    // Helper to parse time from field value
    const parseTimeFromField = (fieldValue, isHours) => {
        if (!fieldValue || !fieldValue.includes(' ')) return '';
        
        const timePart = fieldValue.split(' ')[1];
        if (!timePart || !timePart.includes(':')) return '';
        
        const timeParts = timePart.split(':');
        // Return hours or minutes, ignoring seconds
        return isHours ? timeParts[0] : timeParts[1];
    };

    // Handle search modal item selection
    const handleSearchModalSelect = async (selectedItem) => {
        await updateField('parent_name', selectedItem.name);
        await updateField('parent_id', selectedItem.id); // Store the parent ID
    };

    // Handle assigned user selection
    const handleAssignedUserSelect = async (selectedItem) => {
        await updateField('assigned_user_name', selectedItem.name);
        await updateField('assigned_user_id', selectedItem.id); // Store the assigned user ID
    };

    // Handle save
    const handleSave = async () => {
        try {
            setSaving(true);
            const result = await createRecord();
            if (result.success) {
                Alert.alert(
                    translations.successTitle || 'Thành công',
                    translations.successMessage || `Tạo ${moduleName} thành công!`,
                    [
                        {
                            text: translations.ok || 'OK',
                            onPress: () => {
                                resetForm();
                                navigation.navigate('ModuleListScreen', { moduleName: moduleName });
                            }
                        }
                    ]
                );
            }
        } catch (err) {
            Alert.alert(translations.errorTitle || 'Lỗi', err.message || (translations.errorMessage || `Không thể tạo ${moduleName}`));
        } finally {
            setSaving(false);
        }
    };

    // Render field label with required indicator
    const renderFieldLabel = (fieldKey) => {
        const label = getFieldLabel(fieldKey);
        return (
            <Text style={styles.label}>
                {label.replace(' *', '')}
                {label.includes(' *') && <Text style={styles.requiredAsterisk}> *</Text>}
            </Text>
        );
    };
    
    // Helper function to check if field is numeric (int or currency)
    const isNumericField = (fieldType) => {
        return fieldType === 'int' || fieldType === 'currency';
    };

    // Render form fields
    const renderFormFields = () => {
        return createFields.map((field) => {
            const fieldError = getFieldError(field.key);
            const fieldValue = getFieldValue(field.key);

            // Handle enum fields (including parent_type) as modal combobox
            if (field.type === 'select' || field.fieldType === 'enum' || field.fieldType === 'parent_type') {
                // Special case for parent_type
                if (field.key === 'parent_type') {
                    return (
                        <View key={field.key} style={styles.row}>
                            {renderFieldLabel(field.key)}
                            <TouchableOpacity
                                style={[styles.valueBox, fieldError && styles.errorInput]}
                                onPress={() => setShowParentTypeModal(true)}
                            >
                                <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                                    {getParentTypeLabel()}
                                </Text>
                            </TouchableOpacity>
                            {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                        </View>
                    );
                }
                
                // Handle other enum fields with modal
                return (
                    <View key={field.key} style={styles.row}>
                        {renderFieldLabel(field.key)}
                        <TouchableOpacity
                            style={[styles.valueBox, fieldError && styles.errorInput]}
                            onPress={() => showEnumModalForField(field.key)}
                        >
                            <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                                {getEnumOptionLabel(field.key)}
                            </Text>
                        </TouchableOpacity>
                        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                );
            }

            // Handle parent_name as search modal
            if (field.key === 'parent_name') {
                return (
                    <View key={field.key} style={styles.row}>
                        {renderFieldLabel(field.key)}
                        <TouchableOpacity
                            style={[
                                styles.valueBox, 
                                fieldError && styles.errorInput,
                                !getFieldValue('parent_type') && styles.disabledValueBox
                            ]}
                            onPress={() => {
                                if (getFieldValue('parent_type')) {
                                    navigation.navigate('SearchModulesScreen', {
                                        parentType: getFieldValue('parent_type'),
                                        title: getParentTypeLabel(),
                                        onSelect: handleSearchModalSelect
                                    });
                                } else {
                                    Alert.alert(
                                        translations.notification || 'Thông báo',
                                        'Vui lòng chọn loại cấp trên trước'
                                    );
                                }
                            }}
                            disabled={!getFieldValue('parent_type')}
                        >
                            <Text style={[
                                styles.value, 
                                !fieldValue && styles.placeholderText,
                                !getFieldValue('parent_type') && styles.disabledText
                            ]}>
                                {fieldValue || (translations.selectPlaceholder || '--------')}
                            </Text>
                        </TouchableOpacity>
                        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                );
            }

            // Handle assigned_user_name as search modal for Users
            if (field.key === 'assigned_user_name') {
                return (
                    <View key={field.key} style={styles.row}>
                        {renderFieldLabel(field.key)}
                        <TouchableOpacity
                            style={[styles.valueBox, fieldError && styles.errorInput]}
                            onPress={() => {
                                navigation.navigate('SearchModulesScreen', {
                                    parentType: 'Users',
                                    title: translations.users || 'Người dùng',
                                    onSelect: handleAssignedUserSelect
                                });
                            }}
                        >
                            <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                                {fieldValue || (translations.selectPlaceholder || '--------')}
                            </Text>
                        </TouchableOpacity>
                        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                );
            }

            // Handle datetime fields
            if (field.type === 'datetime') {
                return (
                    <View key={field.key} style={styles.row}>
                        {renderFieldLabel(field.key)}
                        <TouchableOpacity
                            style={[styles.valueBox, fieldError && styles.errorInput]}
                            onPress={() => showDatePickerForField(field.key, 'date')}
                        >
                            <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                                {fieldValue || (translations.selectPlaceholder || '--------')}
                            </Text>
                        </TouchableOpacity>
                        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                );
            }
            
            // Handle datetimecombo fields
            if (field.type === 'datetimecombo') {
                const hoursValue = parseTimeFromField(fieldValue, true);
                const minutesValue = parseTimeFromField(fieldValue, false);
                
                return (
                    <View key={field.key} style={styles.row}>
                        {renderFieldLabel(field.key)}
                        <View style={styles.datetimeContainer}>
                            {/* Date Selector */}
                            <TouchableOpacity
                                style={[styles.dateBox, fieldError && styles.errorInput]}
                                onPress={() => showDatePickerForField(field.key, 'date')}
                            >
                                <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                                    {fieldValue ? fieldValue.split(' ')[0] : (translations.selectPlaceholder || '--------')}
                                </Text>
                            </TouchableOpacity>
                            
                            {/* Time Input */}
                            <View style={styles.timeContainer}>
                                <View style={styles.timeInputContainer}>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={hoursValue}
                                        onChangeText={(value) => updateTimeComponent(field.key, value, true)}
                                        keyboardType="numeric"
                                        placeholder="00"
                                        maxLength={2}
                                    />
                                    <Text style={styles.timeSeparator}>:</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        value={minutesValue}
                                        onChangeText={(value) => updateTimeComponent(field.key, value, false)}
                                        keyboardType="numeric"
                                        placeholder="00"
                                        maxLength={2}
                                    />
                                </View>
                                
                                <TouchableOpacity
                                    style={styles.timePickerButton}
                                    onPress={() => showDatePickerForField(field.key, 'time')}
                                >
                                    <Text style={styles.timePickerButtonText}>🕒</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                    </View>
                );
            }

            // Default handling for all other fields (TextInput)
            return (
                <View key={field.key} style={styles.row}>
                    {renderFieldLabel(field.key)}
                    <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                        <TextInput
                            style={[
                                styles.value,
                                field.key === 'description' && styles.multilineInput
                            ]}
                            value={fieldValue}
                            onChangeText={async (value) => {
                                // For int and currency fields, only allow numeric input
                                if (isNumericField(field.type)) {
                                    // Allow only digits and decimal point for currency
                                    const regex = field.type === 'currency' ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;
                                    if (value === '' || regex.test(value)) {
                                        await updateField(field.key, value);
                                    }
                                } else {
                                    await updateField(field.key, value);
                                }
                            }}
                            autoCapitalize="none"
                            keyboardType={isNumericField(field.type) ? 'numeric' : 'default'}
                            returnKeyType={field.key === 'description' ? 'default' : 'done'}
                            multiline={field.key === 'description'}
                            numberOfLines={field.key === 'description' ? 4 : 1}
                            textAlignVertical={field.key === 'description' ? 'top' : 'center'}
                        />
                    </View>
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                </View>
            );
        });
    };

    // Show loading state for initialization
    if (loading && createFields.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#d8d8d8" />
                <TopNavigationCreate
                    moduleName={translations.createModule || `Tạo ${moduleName}`}
                    navigation={navigation}
                    name="ModuleListScreen"
                />
                <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={{ marginTop: 16, color: '#666' }}>{translations.loadingText || 'Đang tải...'}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#d8d8d8" />
                
                <TopNavigationCreate 
                    moduleName={translations.createModule || `Tạo ${moduleName}`}
                    navigation={navigation}
                    name="ModuleListScreen"
                />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Show error if any */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Form các trường */}
                        {renderFormFields()}

                        {/* Save Button */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (!isFormValid() || saving) && styles.disabledButton
                                ]}
                                onPress={handleSave}
                                disabled={!isFormValid() || saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>{translations.createButton || `Tạo ${moduleName}`}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Parent Type Modal */}
                <Modal
                    visible={showParentTypeModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowParentTypeModal(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowParentTypeModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <ScrollView 
                                style={styles.modalScrollView}
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={true}
                            >
                                {/* If parent_type is in enumFieldsData, use it; otherwise use parentTypeOptions */}
                                {enumFieldsData && enumFieldsData.parent_type && enumFieldsData.parent_type.values ? (
                                    // Display options from API enum data
                                    Object.entries(enumFieldsData.parent_type.values).map(([key, value]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={styles.modalOption}
                                            onPress={() => handleParentTypeSelect(key)}
                                        >
                                            <Text style={styles.modalOptionText}>{value}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    // Fall back to parentTypeOptions
                                    parentTypeOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={styles.modalOption}
                                            onPress={() => handleParentTypeSelect(option.value)}
                                        >
                                            <Text style={styles.modalOptionText}>{option.label}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
                
                {/* Enum Modal for other enum fields */}
                <Modal
                    visible={showEnumModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowEnumModal(false)}
                >
                    <TouchableOpacity 
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowEnumModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <ScrollView 
                                style={styles.modalScrollView}
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={true}
                            >
                                {currentEnumField && enumFieldsData && enumFieldsData[currentEnumField] && enumFieldsData[currentEnumField].values && (
                                    Object.entries(enumFieldsData[currentEnumField].values).map(([key, value]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={styles.modalOption}
                                            onPress={() => handleEnumSelect(key)}
                                        >
                                            <Text style={styles.modalOptionText}>{value}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
                
                {/* Date Picker Modal */}
                {showDatePicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}
                
                {/* Time Picker Modal */}
                {showTimePicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={handleTimeChange}
                    />
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d8d8d8',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        minHeight: '80%',
    },
    row: {
        marginBottom: 20,
    },

    label: {
        fontSize: 16,
        color: '#000',
        marginBottom: 6,
        fontWeight: 'bold',
        paddingHorizontal: 20,
    },
    requiredAsterisk: {
        color: '#f44336',
        fontSize: 16,
        fontWeight: 'bold',
    },

    valueBox: {
        backgroundColor: '#e4a0a0ff',
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 14,
        width: '90%',
        alignSelf: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },

    disabledValueBox: {
        backgroundColor: '#f5f5f5',
        opacity: 0.6,
    },
    disabledText: {
        color: '#999',
    },

    value: {
        fontSize: 16,
        color: '#000',
    },

    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 12,
        marginBottom: 20,
        borderRadius: 6,
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
        marginHorizontal: 10,
    },
    errorText: {
        color: '#c62828',
        fontSize: 14,
    },
    errorInput: {
        backgroundColor: '#ffcccb',
        borderWidth: 1,
        borderColor: '#f44336',
    },
    fieldError: {
        color: '#c62828',
        fontSize: 12,
        marginTop: 4,
        paddingHorizontal: 20,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        paddingVertical: 20,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        backgroundColor: '#ccc',
        elevation: 0,
        shadowOpacity: 0,
    },
    // Modal styles for parent type selection
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 350,
        maxHeight: '80%',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        flex: 1,
    },
    modalCloseButton: {
        padding: 5,
    },
    modalCloseText: {
        fontSize: 18,
        color: '#666',
        fontWeight: 'bold',
    },
    modalScrollView: {
        maxHeight: 400,
    },
    modalScrollContent: {
        paddingVertical: 10,
    },
    modalOption: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    modalCancelButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    placeholderText: {
        color: '#999',
    },
    // DateTime styles
    datetimeContainer: {
        width: '90%',
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateBox: {
        flex: 1,
        backgroundColor: '#e4a0a0ff',
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginRight: 10,
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '40%',
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e4a0a0ff',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flex: 1,
        marginRight: 6,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
    timeInput: {
        flex: 1,
        fontSize: 16,
        textAlign: 'center',
        color: '#000',
        padding: 0,
    },
    timeSeparator: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginHorizontal: 2,
    },
    timePickerButton: {
        backgroundColor: '#007AFF',
        borderRadius: 6,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
    timePickerButtonText: {
        fontSize: 18,
        color: '#fff',
    },
});
