import { AppTheme, createThemedStyles } from '@/src/configs/ThemeConfig';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavigationUpdate from '../../components/navigations/TopNavigationUpdate';
import { getAllCurrencyApi, getCurrencyNameApi, searchModuleByKeywordApi, searchModuleByKeywordApi_noAssignedUser } from '../../services/api/module/ModuleApi';
import { useModuleUpdate } from '../../services/useApi/module/UseModule_Update';
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';
import { formatCurrency } from '../../utils/format/FormatCurrencies';
import { formatDateTimeBySelectedLanguage } from '../../utils/format/FormatDateTime_Zones';
import axiosInstance from '../../configs/AxiosConfig';
import { updateViewBtnRegistry } from '../feature/smartsea/UpdateViewButtonRegistry';

export default function ModuleUpdateScreen() {
  const styles = getStyles();
  const navigation = useNavigation();
  const route = useRoute();
  const { moduleName, recordData, haveParent } = route.params || {};
  const [file, setFile] = useState(null);

  // Dynamic line item search modal state
  const [searchModal, setSearchModal] = useState({
    visible: false,
    rowIndex: null,
    colKey: null,
    query: '',
    results: [],
    loading: false,
    relateConfig: null,
    moduleToSearch: null,
    fieldKey: null
  });

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchModal.visible && searchModal.query.length >= 1 && searchModal.moduleToSearch) {
        setSearchModal(prev => ({ ...prev, loading: true }));
        try {
          // Extract all required fields from relateConfig to pass to the API
          let requiredFields = ['id', 'name'];
          let autosearchapiUrl = null;
          if (searchModal.relateConfig) {
            for (const mapping of Object.values(searchModal.relateConfig)) {
              if (mapping.includes('.autosearchapi[')) {
                const match = mapping.match(/\.autosearchapi\[\[GET\](.*?)\]/);
                if (match && match[1]) {
                  autosearchapiUrl = match[1];
                }
              }
              const parts = mapping.replace(/\.autosearchapi\[.*?\]/, '').split('.');
              if (parts.length >= 2 && parts[0] === searchModal.moduleToSearch) {
                requiredFields.push(parts[1]);
              }
            }
          }
          const fieldsParam = Array.from(new Set(requiredFields)).join(',');

          const response = await searchModuleByKeywordApi_noAssignedUser(searchModal.moduleToSearch, searchModal.query, 1, fieldsParam);
          if (response && response.data) {
            let mainResults = response.data;
            if (autosearchapiUrl) {
              autosearchapiUrl = autosearchapiUrl.replace(/%([^%]+)%/g, (match, fieldName) => {
                if (fieldName === 'keyword') return encodeURIComponent(searchModal.query);
                const val = getFieldValue(fieldName);
                return encodeURIComponent(val || '');
              });

              try {
                const autoRes = await axiosInstance.get(autosearchapiUrl);
                if (autoRes && autoRes.data && autoRes.data.data) {
                  const autoData = autoRes.data.data;
                  const idKey = searchModal.moduleToSearch + '_id';
                  mainResults = mainResults.map(item => {
                    const extra = autoData.find(a => a[idKey] === item.id);
                    if (extra) {
                      return { ...item, ...extra };
                    }
                    return item;
                  });
                }
              } catch (e) {
                console.warn('autosearchapi error:', e);
              }
            }
            setSearchModal(prev => ({ ...prev, results: mainResults, loading: false }));
          } else {
            setSearchModal(prev => ({ ...prev, results: [], loading: false }));
          }
        } catch (error) {
          console.warn('Lineitem search error:', error);
          setSearchModal(prev => ({ ...prev, results: [], loading: false }));
        }
      } else if (searchModal.visible && searchModal.query.length === 0) {
        setSearchModal(prev => ({ ...prev, results: [], loading: false }));
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchModal.query, searchModal.visible, searchModal.moduleToSearch]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      // API mới trả về mảng assets
      const asset = result.assets?.[0] || result;
      if (asset) {
        setFile(asset);
        console.log("File đã chọn:", asset);
      }
    } catch (err) {
      console.log("Lỗi chọn file:", err);
    }
  };


  // SystemLanguageUtils instance
  const systemLanguageUtils = SystemLanguageUtils.getInstance();

  // Initialize translations
  const [translations, setTranslations] = useState({});

  // Initialize translations
  useEffect(() => {
    const initializeTranslations = async () => {
      try {
        // Get all translations at once using SystemLanguageUtils
        const translatedLabels = await systemLanguageUtils.translateKeys([
          'LBL_EDIT_BUTTON_LABEL',
          'LBL_EMAIL_LOADING',
          'LBL_EMAIL_SUCCESS',
          'LBL_UPDATE',
          'LBL_EMAIL_ERROR_DESC',
          'MSG_UPDATE_ERROR',
          'LBL_OK',
          'LBL_SAVE_CHANGES_BUTTON_TITLE',
          'LBL_CLOSE_ACTIVITY_HEADER',
          'NTC_REMOVE_CONFIRMATION',
          'LBL_CANCEL',
          'LBL_CONFIRM_DISREGARD_EMAIL_TITLE',
          'Alerts',
          'MSG_NO_RELATIONSHIP',
          'LBL_CONFIRM_DELETE_RELATION',
          'MSG_CONFIRM_DELETE_RELATION',
          'LBL_EMAIL_IE_DELETE_SUCCESSFUL',
          'UPLOAD_REQUEST_ERROR',
          'LBL_DELETE_RELATION',
          'LBL_CLEAR_BUTTON_LABEL',
          'LBL_SEARCH',
          'LBL_CHECK_PLACEHOLDER',
          'LBL_SELECT_PLACEHOLDER',
          'LBL_CHECK_TO_VERIFY',
          'LBL_PARENT_ID_LABEL',
          'LBL_ALT_INFO',
          'WARN_UNSAVED_CHANGES',
          'LBL_DELETE',
          'LBL_USERS',
          'Yes',
          'No'
        ]);

        // Get module specific translation
        const moduleTranslation = await systemLanguageUtils.translate(moduleName);

        setTranslations({
          mdName: moduleTranslation || moduleName,
          updateModule: (translatedLabels.LBL_EDIT_BUTTON_LABEL || 'Cập nhật') + ' ' + (moduleTranslation || moduleName),
          loadingText: translatedLabels.LBL_EMAIL_LOADING || 'Đang tải...',
          successTitle: translatedLabels.LBL_EMAIL_SUCCESS || 'Thành công',
          successMessage: (translatedLabels.LBL_UPDATE || 'Cập nhật') + ' ' + (translatedLabels.LBL_EMAIL_SUCCESS || 'thành công!'),
          errorTitle: translatedLabels.LBL_EMAIL_ERROR_DESC || 'Lỗi',
          errorMessage: translatedLabels.UPLOAD_REQUEST_ERROR || 'Không thể cập nhật bản ghi',
          ok: translatedLabels.LBL_OK,
          saveButton: translatedLabels.LBL_SAVE_CHANGES_BUTTON_TITLE || 'Lưu',
          confirmTitle: translatedLabels.LBL_CLOSE_ACTIVITY_HEADER || 'Xác nhận',
          unsavedChanges: translatedLabels.WARN_UNSAVED_CHANGES || 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?',
          cancel: translatedLabels.LBL_CANCEL || 'Hủy',
          exit: translatedLabels.LBL_CONFIRM_DISREGARD_EMAIL_TITLE || 'Thoát',
          notification: translatedLabels.Alerts || 'Thông báo',
          noRelationship: translatedLabels.MSG_NO_RELATIONSHIP,
          confirmDeleteRelation: translatedLabels.LBL_DELETE || 'Xóa mối quan hệ',
          confirmDeleteRelationMsg: translatedLabels.NTC_REMOVE_CONFIRMATION || 'Bạn có chắc chắn muốn xóa mối quan hệ parent này?',
          success: translatedLabels.LBL_EMAIL_SUCCESS || 'Thành công',
          deleteRelationSuccess: translatedLabels.LBL_EMAIL_IE_DELETE_SUCCESSFUL || 'Đã xóa mối quan hệ thành công',
          deleteRelationError: translatedLabels.UPLOAD_REQUEST_ERROR || 'Không thể xóa mối quan hệ',
          deleteRelation: (translatedLabels.LBL_DELETE || 'Xóa') + ' Relationship (Mối quan hệ)',
          clearButton: translatedLabels.LBL_CLEAR_BUTTON_LABEL || 'Xóa',
          checkButton: translatedLabels.LBL_SEARCH || 'Tìm',
          checkPlaceholder: '',
          selectPlaceholder: translatedLabels.LBL_SELECT_PLACEHOLDER,
          checkToVerify: '',
          parentIdLabel: translatedLabels.LBL_PARENT_ID_LABEL || 'ID Cha',
          removeConfirmation: translatedLabels.NTC_REMOVE_CONFIRMATION || 'Bạn có chắc bạn muốn loại bỏ mối quan hệ này? Chỉ có các mối quan hệ sẽ được gỡ bỏ. Hồ sơ sẽ không bị xóa.',
          altInfo: translatedLabels.LBL_ALT_INFO || 'Thông tin',
          emailLoading: translatedLabels.LBL_EMAIL_LOADING || 'Đang tải...',
          uploadRequestError: translatedLabels.UPLOAD_REQUEST_ERROR || 'Lỗi đã xảy ra. Xin vui lòng làm tươi lại trang và thử lại.',
          users: translatedLabels.LBL_USERS || 'Người dùng',
          yes: translatedLabels.Yes || 'Yes',
          no: translatedLabels.No || 'No'
        });
      } catch (error) {
        console.warn('Translation initialization error:', error);
      }
    };

    initializeTranslations();
  }, [moduleName]);

  // Sử dụng custom hook
  const {
    formData,
    updateFields,
    loading,
    error,
    validationErrors,
    enumFieldsData,
    updateField,
    updateRecord,
    getFieldValue,
    getFieldLabel,
    getStyledFieldLabel,
    getFieldError,
    isFormValid,
    hasChanges,
    hasParentNameField,
    getParentTypeOptions,
    handleDeleteRelationship,
    isEnumField,
    getEnumOptions,
    getEnumLabel,
    isBoolField,
    isFunctionField,
    isReadonlyField,
    toggleBoolField,
    isRelateField,
    getRelatedModuleName,
    handleRelateFieldSelect,
    saveFile,
    isFile,
    moduleMetadata
  } = useModuleUpdate(moduleName, recordData);

  // Local loading state for save button
  const [saving, setSaving] = useState(false);
  const [activeCustomModal, setActiveCustomModal] = useState(null);

  const handleSelectLineItemSearch = async (selectedItem) => {
    const { rowIndex, relateConfig, fieldKey } = searchModal;
    const rows = Array.isArray(formData[fieldKey]) ? [...formData[fieldKey]] : [];
    const rowToUpdate = { ...rows[rowIndex] };

    // ModuleLanguageUtils instance if we need to translate
    const moduleLanguageUtils = require('../../utils/cacheViewManagement/ModuleLanguageUtils').ModuleLanguageUtils.getInstance();

    for (const [colName, rawMapping] of Object.entries(relateConfig)) {
      const mapping = rawMapping.replace(/\.autosearchapi\[.*?\]/, '');
      const parts = mapping.split('.');
      const targetModule = parts[0];
      const sourceField = parts[1];
      let value;
      if (selectedItem[`${targetModule}_${sourceField}`] !== undefined) {
        value = selectedItem[`${targetModule}_${sourceField}`];
      } else if (selectedItem.attributes && selectedItem.attributes[sourceField] !== undefined) {
        value = selectedItem.attributes[sourceField];
      } else {
        value = selectedItem[sourceField];
      }

      if (Array.isArray(value)) {
        value = value[0];
      }

      if (parts.includes('translate')) {
        try {
          // Try to load translation and translate
          await moduleLanguageUtils.loadLanguageData(targetModule);
          const listStrings = moduleLanguageUtils.cachedLanguageData[`${targetModule}-${moduleLanguageUtils.currentLanguage}`]?.appListStrings;
          // Search enum list key
          const translated = moduleLanguageUtils.searchNestedValue(listStrings, value);
          if (translated) {
            value = translated;
          } else {
            const sysTranslated = await systemLanguageUtils.translate(value, value);
            if (sysTranslated) value = sysTranslated;
          }
        } catch (e) {
          console.warn('Translate error:', e);
        }
      }
      rowToUpdate[colName] = value !== undefined && value !== null ? String(value) : '';
    }

    const newRows = [...rows];
    newRows[rowIndex] = rowToUpdate;
    updateField(fieldKey, newRows);

    setSearchModal({
      visible: false,
      rowIndex: null,
      colKey: null,
      query: '',
      results: [],
      loading: false,
      relateConfig: null,
      moduleToSearch: null,
      fieldKey: null
    });
  };

  // Modal state for parent_type selection
  const [showParentTypeModal, setShowParentTypeModal] = useState(false);

  // Enum modal states
  const [showEnumModal, setShowEnumModal] = useState(false);
  const [currentEnumField, setCurrentEnumField] = useState(null);

  // DateTime picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [dateTimeMode, setDateTimeMode] = useState('date'); // 'date' or 'time'

  // Currency states
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [currencyNames, setCurrencyNames] = useState({}); // Cache for currency names
  const [formattedCurrencyValues, setFormattedCurrencyValues] = useState({}); // Cache for formatted currency display
  const [focusedField, setFocusedField] = useState(null); // Track which field is being edited

  // Track user-modified date fields
  const [userModifiedDateFields, setUserModifiedDateFields] = useState(new Set());

  // Parent type options with translations
  const [parentTypeOptions, setParentTypeOptions] = useState([]);

  // Handle search modal item selection
  const handleSearchModalSelect = async (selectedItem) => {
    updateField('parent_name', selectedItem.name);
    updateField('parent_id', selectedItem.id); // Store the parent ID
  };

  // Handle assigned user selection
  const handleAssignedUserSelect = async (selectedItem) => {
    await updateField('assigned_user_name', selectedItem.name);
    await updateField('assigned_user_id', selectedItem.id); // Store the assigned user ID
  };

  // Handle relate field selection
  const handleRelateSelect = async (selectedItem, fieldKey) => {
    await handleRelateFieldSelect(fieldKey, selectedItem);
  };

  // Get module translation for relate field
  const getModuleTranslation = useCallback(async (moduleName) => {
    try {
      const translation = await systemLanguageUtils.translate(moduleName);
      return translation || moduleName;
    } catch (error) {
      console.warn('Error translating module name:', error);
      return moduleName;
    }
  }, []);

  // Load parent type options
  useEffect(() => {
    const loadParentTypeOptions = async () => {
      const options = await getParentTypeOptions();
      setParentTypeOptions(options);
    };
    loadParentTypeOptions();
  }, [getParentTypeOptions]);

  // Load currencies for currency_id fields
  useEffect(() => {
    loadCurrencies();
  }, []);

  // Load currency names and format currency values when updateFields change
  useEffect(() => {
    const loadCurrencyData = async () => {
      if (!updateFields || updateFields.length === 0) return;

      const currencyFields = updateFields.filter(field => field.type === 'currency');
      const currencyIdFields = updateFields.filter(field => field.key === 'currency_id');

      // Load currency names for currency_id fields
      for (const field of currencyIdFields) {
        const value = getFieldValue(field.key);
        if (value) {
          await getCurrencyName(value);
        }
      }

      // Format currency values
      const newFormattedValues = {};
      for (const field of currencyFields) {
        const value = getFieldValue(field.key);
        if (value) {
          newFormattedValues[field.key] = await formatCurrencyValue(value);
        }
      }
      setFormattedCurrencyValues(newFormattedValues);
    };

    loadCurrencyData();
  }, [updateFields, formData]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);

      // Custom LineItem Validation
      if (moduleMetadata && moduleMetadata.lineitems_field) {
        for (const fieldKey of Object.keys(moduleMetadata.lineitems_field)) {
          const config = moduleMetadata.lineitems_field[fieldKey];
          const editView = config['edit-view'] || {};
          const rows = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            for (const [colKey, labelConfig] of Object.entries(editView)) {
              if (labelConfig.includes('$num:[')) {
                const match = labelConfig.match(/\$num:\[(.*?)(<=|<|>=|>|==|!=)(.*?)\]/);
                if (match) {
                  const leftCol = match[1].trim();
                  const operator = match[2].trim();
                  const rightCol = match[3].trim();

                  const leftVal = parseFloat(row[leftCol] || 0);
                  const rightVal = parseFloat(row[rightCol] || 0);

                  let isValid = true;
                  switch (operator) {
                    case '<': isValid = leftVal < rightVal; break;
                    case '<=': isValid = leftVal <= rightVal; break;
                    case '>': isValid = leftVal > rightVal; break;
                    case '>=': isValid = leftVal >= rightVal; break;
                    case '==': isValid = leftVal == rightVal; break;
                    case '!=': isValid = leftVal != rightVal; break;
                  }

                  if (!isValid) {
                    Alert.alert(
                      translations.errorTitle || 'Lỗi',
                      `Dòng ${i + 1}: Trường ${colKey} (giá trị: ${leftVal}) không thoả mãn điều kiện ${operator} ${rightVal}`
                    );
                    setSaving(false);
                    return;
                  }
                }
              }
            }
          }
        }
      }

      // Upload file trước nếu có
      let uploadedFilename = null;
      let mime_type = null;
      if (isFile && file) {
        const fileResponse = await saveFile(moduleName, file);

        if (fileResponse.success && fileResponse.original_filename) {
          uploadedFilename = fileResponse.original_filename;
          mime_type = fileResponse.mime_type;
        } else {
          Alert.alert(
            translations.errorTitle || 'Lỗi',
            `Không thể tải lên file: ${fileResponse.message || 'Unknown error'}`
          );
          return;
        }
      }
      const result = await updateRecord(uploadedFilename, mime_type);
      if (result.success) {
        Alert.alert(
          translations.successTitle || 'Thành công',
          translations.successMessage || 'Cập nhật bản ghi thành công!',
          [
            {
              text: translations.ok || 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (err) {
      Alert.alert(translations.errorTitle || 'Lỗi', err.message || (translations.errorMessage || 'Không thể cập nhật bản ghi'));
    } finally {
      setSaving(false);
    }
  };

  // Handle back with changes check
  const handleBack = () => {
    if (hasChanges()) {
      Alert.alert(
        translations.confirmTitle || 'Xác nhận',
        translations.unsavedChanges || 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát không?',
        [
          { text: translations.cancel || 'Hủy', style: 'cancel' },
          { text: translations.exit || 'Thoát', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

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
    // Check for null/undefined but allow empty string as valid enum value
    if (value === null || value === undefined) return translations.selectPlaceholder || '--------';

    // Get the translated label from enumFieldsData
    return getEnumLabel(fieldKey, value) || value;
  };

  // Load all currencies for currency_id field
  const loadCurrencies = async () => {
    try {
      const response = await getAllCurrencyApi();
      if (response.data && Array.isArray(response.data)) {
        setCurrencyOptions(response.data);
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };

  // Get currency name by ID with special handling for -99 (Dollar)
  const getCurrencyName = async (currencyId) => {
    if (!currencyId) return '';

    // Special case: -99 is Dollar
    if (currencyId === '-99' || currencyId === -99) {
      return 'Dollar';
    }

    // Check cache first
    if (currencyNames[currencyId]) {
      return currencyNames[currencyId];
    }

    try {
      const name = await getCurrencyNameApi(currencyId);
      // Cache the result
      setCurrencyNames(prev => ({ ...prev, [currencyId]: name }));
      return name;
    } catch (error) {
      console.error('Error getting currency name:', error);
      return currencyId; // Fallback to ID if name fetch fails
    }
  };

  // Handle currency selection
  const handleCurrencySelect = async (currency) => {
    await updateField('currency_id', currency.id);
    setShowCurrencyModal(false);
  };

  // Format currency value for display
  const formatCurrencyValue = async (value) => {
    if (!value || isNaN(parseFloat(value))) return value;

    try {
      const numericValue = parseFloat(value);
      const formatted = await formatCurrency(numericValue);
      return formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return value;
    }
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
      // Mark this field as user-modified
      setUserModifiedDateFields(prev => new Set([...prev, currentDateField]));

      // For date-only fields, save only the date part (YYYY-MM-DD)
      if (getFieldType(currentDateField) === 'date') {
        const formattedDate = formatDate(currentDate);
        updateField(currentDateField, formattedDate);
      }

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

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);

    if (event.type === 'dismissed' || !selectedTime) {
      return; // User canceled
    }

    if (currentDateField) {
      // Mark this field as user-modified
      setUserModifiedDateFields(prev => new Set([...prev, currentDateField]));

      const currentValue = getFieldValue(currentDateField);

      let baseDate = new Date();
      if (currentValue && currentValue.includes(' ')) {
        const [datePart] = currentValue.split(' ');
        const [y, m, d] = datePart.split('-').map(Number);
        baseDate = new Date(y, m - 1, d);
      }

      const rawDate = new Date(event.nativeEvent.timestamp);
      const hours = rawDate.getHours();  // Use local hours instead of UTC
      const minutes = rawDate.getMinutes();  // Use local minutes instead of UTC

      const dateStr = formatDate(baseDate); // YYYY-MM-DD
      const hoursStr = String(hours).padStart(2, '0');
      const minutesStr = String(minutes).padStart(2, '0');

      const formattedDateTime = `${dateStr} ${hoursStr}:${minutesStr}:00`;
      updateField(currentDateField, formattedDateTime);
    }
  };

  // Helper function to get the field type
  const getFieldType = (fieldKey) => {
    const field = updateFields.find(f => f.key === fieldKey);
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

  // Helper function to format date for display - uses different formats based on user modification
  const formatDateForDisplay = (datetimeValue, fieldKey) => {
    if (!datetimeValue) return '';

    // If user has modified this field, use default yyyy/MM/dd format
    if (userModifiedDateFields.has(fieldKey)) {
      try {
        let dateObj;
        if (datetimeValue.includes('T')) {
          dateObj = new Date(datetimeValue);
        } else if (datetimeValue.includes(' ')) {
          const [datePart] = datetimeValue.split(' ');
          const [year, month, day] = datePart.split('-');
          dateObj = new Date(year, month - 1, day);
        } else {
          const [year, month, day] = datetimeValue.split('-');
          dateObj = new Date(year, month - 1, day);
        }

        if (isNaN(dateObj.getTime())) {
          return datetimeValue;
        }

        // Format as yyyy/MM/dd for user-modified fields
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
      } catch (error) {
        return datetimeValue;
      }
    }

    // For original data, use formatDateTimeBySelectedLanguage
    try {
      const fullFormatted = formatDateTimeBySelectedLanguage(datetimeValue);
      // Extract date part from formatted string
      const datePart = fullFormatted.split(' ')[0];
      return datePart;
    } catch (error) {
      // Fallback to default format if formatDateTimeBySelectedLanguage fails
      try {
        let dateObj;
        if (datetimeValue.includes('T')) {
          dateObj = new Date(datetimeValue);
        } else if (datetimeValue.includes(' ')) {
          const [datePart] = datetimeValue.split(' ');
          const [year, month, day] = datePart.split('-');
          dateObj = new Date(year, month - 1, day);
        } else {
          const [year, month, day] = datetimeValue.split('-');
          dateObj = new Date(year, month - 1, day);
        }

        if (isNaN(dateObj.getTime())) {
          return datetimeValue;
        }

        // Format as yyyy/MM/dd as fallback
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
      } catch (fallbackError) {
        return datetimeValue;
      }
    }
  };

  // Helper to format time using formatDateTimeBySelectedLanguage for original data
  const formatTimeFromDateTime = (datetimeValue, isHours) => {
    if (!datetimeValue) return '';

    try {
      // Use formatDateTimeBySelectedLanguage to get formatted datetime
      const fullFormatted = formatDateTimeBySelectedLanguage(datetimeValue);

      // Try to extract time part from formatted string
      // The formatted string might be in different formats depending on language
      // Common patterns: "DD/MM/YYYY HH:MM" or "MM/DD/YYYY HH:MM AM/PM" etc.
      const parts = fullFormatted.split(' ');

      // Look for time pattern (contains ":")
      const timePart = parts.find(part => part.includes(':'));

      if (timePart) {
        const timeParts = timePart.split(':');
        if (timeParts.length >= 2) {
          return isHours ? timeParts[0] : timeParts[1];
        }
      }

      // Fallback: parse from original value
      if (datetimeValue.includes(' ')) {
        const originalTimePart = datetimeValue.split(' ')[1];
        if (originalTimePart && originalTimePart.includes(':')) {
          const timeParts = originalTimePart.split(':');
          return isHours ? timeParts[0] : timeParts[1];
        }
      }

      return '';
    } catch (error) {
      // Fallback to parsing original value
      if (datetimeValue.includes(' ')) {
        const timePart = datetimeValue.split(' ')[1];
        if (timePart && timePart.includes(':')) {
          const timeParts = timePart.split(':');
          return isHours ? timeParts[0] : timeParts[1];
        }
      }
      return '';
    }
  };

  // Helper function to get time components from timezone-accurate datetime - uses different logic for original vs user-modified data
  const getTimeComponents = (datetimeValue, fieldKey) => {
    if (!datetimeValue) return { hours: '00', minutes: '00' };

    // If user has modified this field, parse from raw value
    if (userModifiedDateFields.has(fieldKey)) {
      try {
        let dateObj;
        if (datetimeValue.includes('T')) {
          dateObj = new Date(datetimeValue);
        } else if (datetimeValue.includes(' ')) {
          const [datePart, timePart] = datetimeValue.split(' ');
          const [year, month, day] = datePart.split('-');
          const [hours, minutes, seconds] = timePart.split(':');
          dateObj = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
        } else {
          return { hours: '00', minutes: '00' };
        }

        if (isNaN(dateObj.getTime())) {
          return { hours: '00', minutes: '00' };
        }

        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        return { hours, minutes };
      } catch (error) {
        return { hours: '00', minutes: '00' };
      }
    }

    // For original data, use formatted time
    try {
      const hours = formatTimeFromDateTime(datetimeValue, true);
      const minutes = formatTimeFromDateTime(datetimeValue, false);
      return {
        hours: hours ? String(parseInt(hours, 10)).padStart(2, '0') : '00',
        minutes: minutes ? String(parseInt(minutes, 10)).padStart(2, '0') : '00'
      };
    } catch (error) {
      return { hours: '00', minutes: '00' };
    }
  };

  // Helper function to update just the hours or minutes in a datetime string
  const updateTimeComponent = (fieldKey, value, isHours) => {
    // Mark this field as user-modified
    setUserModifiedDateFields(prev => new Set([...prev, fieldKey]));

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

  // Helper function to check if field is numeric (int or currency)
  const isNumericField = (fieldType) => {
    return fieldType === 'int' || fieldType === 'currency';
  };

  // Helper function to check if a field is a date type
  const isDateField = (fieldKey) => {
    const field = updateFields.find(f => f.key === fieldKey);
    return field && (field.type === 'date' || field.type === 'datetime');
  };

  // Helper function to check if a field is a datetime type with time component
  const isDateTimeField = (fieldKey) => {
    const field = updateFields.find(f => f.key === fieldKey);
    return field && field.type === 'datetimecombo';
  };

  const handleDeleteParentRelationship = async () => {
    const currentParentType = getFieldValue('parent_type');

    // Check if there's a relationship to delete
    if (!currentParentType) {
      Alert.alert(translations.notification || 'Thông báo', translations.noRelationship || 'Không có mối quan hệ nào để xóa');
      return;
    }

    Alert.alert(
      translations.confirmDeleteRelation || 'Xác nhận xóa',
      translations.confirmDeleteRelationMsg || 'Bạn có chắc chắn muốn xóa mối quan hệ parent này?',
      [
        { text: translations.cancel || 'Hủy', style: 'cancel' },
        {
          text: translations.clearButton || 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await handleDeleteRelationship();
              if (result.success) {
                Alert.alert(translations.success || 'Thành công', result.message || (translations.deleteRelationSuccess || 'Đã xóa mối quan hệ thành công'));
              } else {
                Alert.alert(translations.errorTitle || 'Lỗi', result.error || (translations.deleteRelationError || 'Không thể xóa mối quan hệ'));
              }
            } catch (err) {
              Alert.alert(translations.errorTitle || 'Lỗi', err.message || (translations.deleteRelationError || 'Không thể xóa mối quan hệ'));
            }
          }
        }
      ]
    );
  };

  // Render field label with red asterisk for required fields
  const renderFieldLabel = (fieldKey) => {
    const labelData = getStyledFieldLabel(fieldKey);

    if (typeof labelData === 'string') {
      return <Text style={styles.label}>{labelData}</Text>;
    }

    if (labelData.required) {
      return (
        <Text style={styles.label}>
          {labelData.text}
          <Text style={styles.requiredAsterisk}> *</Text>
        </Text>
      );
    }

    return <Text style={styles.label}>{labelData.text}</Text>;
  };

  // Render Editable Line Items Table
  const renderEditableLineItems = (fieldKey, fieldLabel, fieldError) => {
    if (!moduleMetadata || !moduleMetadata.lineitems_field || !moduleMetadata.lineitems_field[fieldKey]) {
      return null;
    }

    const config = moduleMetadata.lineitems_field[fieldKey];
    const editView = config['edit-view'] || {};
    const columns = Object.keys(editView);
    const editDataKeys = config['edit-data'] || columns; // Fallback to columns if edit-data is missing

    const rows = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];

    const updateRowsWithNo = (newRows) => {
      return newRows.map((row, index) => ({
        ...row,
        ...(columns.includes('no') ? { no: String(index + 1) } : {})
      }));
    };

    const handleAddRow = () => {
      const newRow = {};
      editDataKeys.forEach(key => {
        newRow[key] = key === 'no' ? String(rows.length + 1) : '';
      });
      updateField(fieldKey, updateRowsWithNo([...rows, newRow]));
    };

    const handleRemoveRow = (index) => {
      const newRows = [...rows];
      newRows.splice(index, 1);
      updateField(fieldKey, updateRowsWithNo(newRows));
    };

    const relateConfig = config['relate-modules'];

    const getSearchModule = (col) => {
      if (!relateConfig || !relateConfig[col]) return null;
      const mapping = relateConfig[col];
      if (mapping.includes('.searchmain') || mapping.includes('.search')) {
        return mapping.split('.')[0];
      }
      return null;
    };

    const handleCellChange = (text, rowIndex, colKey) => {
      const newRows = [...rows];
      newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: text };
      updateField(fieldKey, newRows);
    };

    const cleanLabel = (label) => typeof label === 'string' ? label.replace(/\$num:\[.*?\]/g, '') : label;

    return (
      <View key={fieldKey} style={styles.row}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.label}>{fieldLabel}</Text>
          <TouchableOpacity onPress={handleAddRow} style={[styles.btnPrimary, { paddingVertical: 4, paddingHorizontal: 12 }]}>
            <Text style={[styles.btnPrimaryText, { fontSize: 12 }]}>+ Thêm dòng</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 }}>
          <View>
            {/* Header */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
              {columns.map(col => (
                <Text key={col} style={{ width: 120, padding: 8, fontWeight: 'bold', fontSize: 12 }}>
                  {cleanLabel(editView[col])}
                </Text>
              ))}
              <Text style={{ width: 60, padding: 8, fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>Thao tác</Text>
            </View>
            {/* Rows */}
            {rows.length === 0 ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có dữ liệu</Text>
              </View>
            ) : (
              rows.map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', borderBottomWidth: rowIndex === rows.length - 1 ? 0 : 1, borderColor: '#f1f5f9' }}>
                  {columns.map(col => (
                    <View key={col} style={{ width: 120, padding: 4, justifyContent: 'center' }}>
                      {getSearchModule(col) ? (
                        <TouchableOpacity
                          style={[styles.input, { padding: 4, height: 30, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', justifyContent: 'center' }]}
                          onPress={() => {
                            setSearchModal(prev => ({
                              ...prev,
                              visible: true,
                              rowIndex,
                              colKey: col,
                              relateConfig,
                              moduleToSearch: getSearchModule(col),
                              fieldKey,
                              query: row[col] || '',
                              results: []
                            }));
                          }}
                        >
                          <Text style={{ fontSize: 12, color: row[col] ? '#000' : '#999' }} numberOfLines={1}>
                            {row[col] ? String(row[col]) : cleanLabel(editView[col])}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TextInput
                          style={[styles.input, { padding: 4, fontSize: 12, height: 30, color: col === 'no' ? '#6b7280' : '#000', backgroundColor: col === 'no' ? '#f3f4f6' : '#fff', borderWidth: 1, borderColor: '#ccc' }]}
                          value={col === 'no' ? String(rowIndex + 1) : (row[col] !== undefined && row[col] !== null ? String(row[col]) : '')}
                          onChangeText={(text) => handleCellChange(text, rowIndex, col)}
                          placeholder={cleanLabel(editView[col])}
                          editable={col !== 'no'}
                        />
                      )}
                    </View>
                  ))}
                  <View style={{ width: 60, padding: 4, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => handleRemoveRow(rowIndex)} style={{ backgroundColor: '#ef4444', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <TopNavigationUpdate
          moduleName={translations.updateModule || `Cập nhật ${moduleName || 'Module'}`}
          navigation={navigation}
          name="ModuleListScreen"
          onBack={handleBack}
        />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={AppTheme.colors.loadingIcon} />
          <Text style={{ marginTop: 16, color: AppTheme.colors.loadingText }}>{translations.loadingText || 'Loading...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Thanh điều hướng */}
        <TopNavigationUpdate
          moduleName={translations.updateModule || `Cập nhật ${moduleName || 'Module'}`}
          navigation={navigation}
          name="ModuleListScreen"
          onBack={handleBack}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Show error if any */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Form các trường */}
            {updateFields.map((field) => {
              const fieldError = getFieldError(field.key);
              // Check if this is a custom lineitems_field
              if (moduleMetadata && moduleMetadata.lineitems_field && moduleMetadata.lineitems_field[field.key]) {
                return renderEditableLineItems(field.key, getFieldLabel(field.key), fieldError);
              }
              const fieldValue = getFieldValue(field.key);

              // Handle parent_type as modal combobox - only show if haveParent is true
              if (field.key === 'parent_type') {
                // Skip rendering if module doesn't support parent relationships
                if (haveParent === false) {
                  return null;
                }

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

              // Handle parent_name as search modal - only show if haveParent is true
              if (field.key === 'parent_name') {
                // Skip rendering if module doesn't support parent relationships
                if (haveParent === false) {
                  return null;
                }

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

              // Handle currency_id field as modal dropdown
              if (field.key === 'currency_id') {
                return (
                  <View key={field.key} style={styles.row}>
                    {renderFieldLabel(field.key)}
                    <TouchableOpacity
                      style={[styles.valueBox, fieldError && styles.errorInput]}
                      onPress={() => setShowCurrencyModal(true)}
                    >
                      <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                        {fieldValue ? (currencyNames[fieldValue] || (fieldValue === '-99' ? 'Dollar' : fieldValue)) : (translations.selectPlaceholder || 'Chọn loại tiền')}
                      </Text>
                    </TouchableOpacity>
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                  </View>
                );
              }

              // Handle enum fields as modal dropdowns
              if (isEnumField(field.key)) {
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

              // Handle date fields
              if (isDateField(field.key)) {
                return (
                  <View key={field.key} style={styles.row}>
                    {renderFieldLabel(field.key)}
                    <TouchableOpacity
                      style={[styles.valueBox, fieldError && styles.errorInput]}
                      onPress={() => showDatePickerForField(field.key, 'date')}
                    >
                      <Text style={[styles.value, !fieldValue && styles.placeholderText]}>
                        {fieldValue ? formatDateForDisplay(fieldValue, field.key) : (translations.selectPlaceholder || 'Chọn ngày')}
                      </Text>
                    </TouchableOpacity>
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                  </View>
                );
              }

              // Handle datetimecombo fields (date + time)
              if (isDateTimeField(field.key)) {
                const timeComponents = getTimeComponents(fieldValue, field.key);
                const hoursValue = timeComponents.hours;
                const minutesValue = timeComponents.minutes;

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
                          {fieldValue ? formatDateForDisplay(fieldValue, field.key) : (translations.selectPlaceholder || 'Chọn ngày')}
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
                            editable={false}
                          />
                          <Text style={styles.timeSeparator}> : </Text>
                          <TextInput
                            style={styles.timeInput}
                            value={minutesValue}
                            onChangeText={(value) => updateTimeComponent(field.key, value, false)}
                            keyboardType="numeric"
                            placeholder="00"
                            maxLength={2}
                            editable={false}
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

              // Handle boolean fields (checkbox)
              if (field.type === 'bool' || isBoolField(field.key)) {
                return (
                  <View key={field.key} style={styles.row}>
                    <View style={styles.boolFieldContainer}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleBoolField(field.key)}
                      >
                        <View style={[
                          styles.checkbox,
                          getFieldValue(field.key) === "1" && styles.checkboxChecked
                        ]}>
                          {getFieldValue(field.key) === "1" && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.labelCheckbox}>
                        {renderFieldLabel(field.key)}
                      </Text>
                    </View>
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                  </View>
                );
              }

              // Handle function fields (disabled input)
              if (field.type === 'function' || isFunctionField(field.key)) {
                return (
                  <View key={field.key} style={styles.row}>
                    {renderFieldLabel(field.key)}
                    <View style={[styles.valueBox, styles.disabledValueBox]}>
                      <TextInput
                        style={[styles.value, styles.disabledText]}
                        value={fieldValue || "Not available"}
                        editable={false}
                      />
                    </View>
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                  </View>
                );
              }

              // Handle readonly fields (disabled input but styled differently)
              if (field.type === 'readonly' || isReadonlyField(field.key)) {
                return (
                  <View key={field.key} style={styles.row}>
                    {renderFieldLabel(field.key)}
                    <View style={[styles.valueBox, styles.readonlyValueBox]}>
                      <TextInput
                        style={[styles.value, styles.readonlyText]}
                        value={fieldValue}
                        editable={false}
                      />
                    </View>
                    {fieldError && <Text style={styles.fieldError}>{fieldError}</Text>}
                  </View>
                );
              }

              // Handle relate fields as search modal
              if (isRelateField(field.key)) {
                const relatedModuleName = getRelatedModuleName(field.key);

                return (
                  <View key={field.key} style={styles.row}>
                    {renderFieldLabel(field.key)}
                    <TouchableOpacity
                      style={[styles.valueBox, fieldError && styles.errorInput]}
                      onPress={async () => {
                        if (relatedModuleName) {
                          const moduleTitle = await getModuleTranslation(relatedModuleName);
                          navigation.navigate('SearchModulesScreen', {
                            parentType: relatedModuleName,
                            title: moduleTitle,
                            onSelect: (selectedItem) => handleRelateSelect(selectedItem, field.key)
                          });
                        }
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
              if (field.key === 'filename' || field.key === 'product_image') {
                return (
                  <View key={field.key} style={styles.row}>
                    {renderFieldLabel(field.key)}
                    <TouchableOpacity
                      onPress={pickFile}
                      style={styles.valueFile}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>{fieldValue}</Text>
                    </TouchableOpacity>
                    {file && (
                      <View
                        style={{
                          marginTop: 20,
                          padding: 15,
                          borderRadius: 12,
                          backgroundColor: "#f3f4f6",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 16, fontWeight: "600", flex: 1 }}>
                            📄 {file.name}
                          </Text>

                          <TouchableOpacity
                            onPress={() => setFile(null)}
                            style={{
                              backgroundColor: "#ef4444",
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: "white", fontWeight: "bold" }}>Xóa</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 14, color: "#374151", marginTop: 8 }}>
                          Kích thước: {(file.size / 1024).toFixed(1)} KB
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 4,
                          }}
                          numberOfLines={1}
                        >
                          URI: {file.uri}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }

              // Default handling for all other fields
              return (
                <View key={field.key} style={styles.row}>
                  {renderFieldLabel(field.key)}
                  <View style={[styles.valueBox, fieldError && styles.errorInput]}>
                    <TextInput
                      style={[
                        styles.value,
                        field.key === 'description' && styles.multilineInput
                      ]}
                      value={field.type === 'currency' && focusedField === field.key
                        ? fieldValue
                        : (field.type === 'currency' && formattedCurrencyValues[field.key] ? formattedCurrencyValues[field.key] : fieldValue)}
                      onFocus={() => {
                        if (field.type === 'currency') {
                          setFocusedField(field.key);
                        }
                      }}
                      onBlur={() => {
                        if (field.type === 'currency') {
                          setFocusedField(null);
                        }
                      }}
                      onChangeText={async (value) => {
                        // For currency fields, store raw value but update formatted display
                        if (field.type === 'currency') {
                          // Allow only digits and decimal point for currency
                          const regex = /^[0-9]*\.?[0-9]*$/;
                          if (value === '' || regex.test(value)) {
                            await updateField(field.key, value);
                            // Update formatted display only when not focused
                            if (focusedField !== field.key) {
                              if (value && !isNaN(parseFloat(value))) {
                                const formatted = await formatCurrencyValue(value);
                                setFormattedCurrencyValues(prev => ({ ...prev, [field.key]: formatted }));
                              } else {
                                setFormattedCurrencyValues(prev => ({ ...prev, [field.key]: value }));
                              }
                            }
                          }
                        } else if (isNumericField(field.type)) {
                          // Allow only digits for int fields
                          const regex = /^[0-9]*$/;
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
            })}

            {/* Custom Buttons */}
            {updateViewBtnRegistry[moduleName] && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 16 }}>
                {Object.entries(updateViewBtnRegistry[moduleName]).map(([key, config]) => (
                  <TouchableOpacity
                    key={key}
                    style={{
                      backgroundColor: config.color || '#1890ff',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 12,
                      borderRadius: 8,
                      flex: 1,
                      marginHorizontal: 4,
                    }}
                    onPress={() => setActiveCustomModal(key)}
                  >
                    {config.icon && <Ionicons name={config.icon} size={20} color="#fff" style={{ marginRight: 8 }} />}
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{config.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
                  <Text style={styles.deleteButtonText}>
                    {translations.saveButton || 'Lưu'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Delete Relationship Button - Only show if parent name field exists and module supports parent */}
            {hasParentNameField() && haveParent !== false && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    saving && styles.disabledButton
                  ]}
                  onPress={handleDeleteParentRelationship}
                  disabled={saving}
                >
                  <Ionicons name="unlink-outline" size={24} color="#fff" />
                  <Text style={styles.deleteButtonText}>{translations.deleteRelation}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Custom Modals */}
        {updateViewBtnRegistry[moduleName] && Object.entries(updateViewBtnRegistry[moduleName]).map(([key, config]) => {
          const ModalComponent = config.modal;
          if (!ModalComponent) return null;

          let parsedLineItems = [];
          try {
            if (formData?.lineitems_data) {
              parsedLineItems = typeof formData.lineitems_data === 'string'
                ? JSON.parse(formData.lineitems_data)
                : formData.lineitems_data;
            }
          } catch (e) {
            console.warn("Failed to parse lineitems_data", e);
          }

          const handleCustomModalSave = async (newData, fieldKey) => {
            let processedData = Array.isArray(newData) ? [...newData] : [];
            const config = moduleMetadata?.lineitems_field?.[fieldKey];
            if (config && config['relate-modules']) {
              const relateConfig = config['relate-modules'];
              const moduleLanguageUtils = require('../../utils/cacheViewManagement/ModuleLanguageUtils').ModuleLanguageUtils.getInstance();

              for (let item of processedData) {
                for (const [colName, rawMapping] of Object.entries(relateConfig)) {
                  if (rawMapping.includes('.translate') && item[colName]) {
                    const parts = rawMapping.split('.');
                    const targetModule = parts[0];
                    try {
                      await moduleLanguageUtils.loadLanguageData(targetModule);
                      const listStrings = moduleLanguageUtils.cachedLanguageData[`${targetModule}-${moduleLanguageUtils.currentLanguage}`]?.appListStrings;
                      const translated = moduleLanguageUtils.searchNestedValue(listStrings, item[colName]);
                      if (translated) {
                        item[colName] = translated;
                      } else {
                        const systemLanguageUtils = require('../../utils/cacheViewManagement/SystemLanguageUtils').SystemLanguageUtils.getInstance();
                        const sysTranslated = await systemLanguageUtils.translate(item[colName], item[colName]);
                        if (sysTranslated) item[colName] = sysTranslated;
                      }
                    } catch (e) {
                      console.warn('Translate error:', e);
                    }
                  }
                }
              }
            }
            updateField(fieldKey, processedData);
          };

          return (
            <ModalComponent
              key={key}
              visible={activeCustomModal === key}
              onClose={() => setActiveCustomModal(null)}
              warehouseId={formData?.sgt_warehouse_id_c}
              initialLineItems={parsedLineItems}
              onSave={(newData) => handleCustomModalSave(newData, 'lineitems_data')}
            />
          );
        })}

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

        {/* Currency Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCurrencyModal(false)}
          >
            <View style={styles.modalContainer}>
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Special option for Dollar (-99) */}
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleCurrencySelect({ id: '-99', name: 'Dollar' })}
                >
                  <Text style={styles.modalOptionText}>Dollar</Text>
                </TouchableOpacity>

                {/* Regular currency options */}
                {currencyOptions.map((currency) => (
                  <TouchableOpacity
                    key={currency.id}
                    style={styles.modalOption}
                    onPress={() => handleCurrencySelect({ id: currency.id, name: currency.attributes.name })}
                  >
                    <Text style={styles.modalOptionText}>{currency.attributes.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

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

        {/* Line Item Search Modal */}
        <Modal
          visible={searchModal.visible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSearchModal(prev => ({ ...prev, visible: false }))}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}
          >
            <View style={{ backgroundColor: '#fff', margin: 20, borderRadius: 8, maxHeight: '80%', padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Search</Text>
                <TouchableOpacity onPress={() => setSearchModal(prev => ({ ...prev, visible: false }))}>
                  <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, marginBottom: 10, fontSize: 16 }}
                placeholder="Type to search..."
                value={searchModal.query}
                onChangeText={(text) => setSearchModal(prev => ({ ...prev, query: text }))}
                autoFocus={true}
              />

              {searchModal.loading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : (
                <FlatList
                  data={searchModal.results}
                  keyExtractor={(item, index) => item.id || String(index)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                      onPress={() => handleSelectLineItemSearch(item)}
                    >
                      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.attributes ? item.attributes.name : item.name}</Text>
                      {(item.attributes?.part_number || item.part_number) && (
                        <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                          Mã: {item.attributes ? item.attributes.part_number : item.part_number}
                        </Text>
                      )}
                      {(item.attributes?.impa || item.impa) && (
                        <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                          IMPA: {item.attributes ? item.attributes.impa : item.impa}
                        </Text>
                      )}
                      {Object.keys(item).filter(k => Array.isArray(item[k]) && item[k].length === 2 && typeof item[k][1] === 'string').map(k => (
                        <Text key={k} style={{ color: '#007AFF', fontSize: 12, marginTop: 4, fontWeight: 'bold' }}>
                          {item[k][1]}
                        </Text>
                      ))}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() => (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#999' }}>No results found</Text>
                    </View>
                  )}
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Styles
const getStyles = createThemedStyles((colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundContainer,
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
    fontWeight: 'bold',
  },

  // Checkbox styles
  boolFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',   // căn giữa checkbox và label theo chiều dọc
    paddingVertical: 10,
  },
  checkboxContainer: {
    paddingHorizontal: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center', // căn dấu ✓ vào giữa
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  labelCheckbox: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Readonly and function field styles
  readOnlyBox: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  readOnlyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  readonlyValueBox: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    opacity: 0.85,
  },
  readonlyText: {
    color: '#495057',
    fontStyle: 'italic',
  },
  checkLabelContainer: {
    paddingHorizontal: 20,
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  checkButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  placeholderBox: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  successFieldText: {
    color: '#155724',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorFieldText: {
    color: '#721c24',
    fontWeight: '500',
  },
  valueBox: {
    backgroundColor: colors.formInput,
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
  // New styles for enhanced functionality
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    margin: 20,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: colors.btnSecondary,
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    flex: 1,
    textAlign: 'center',
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
    backgroundColor: colors.formInput,
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
    backgroundColor: colors.formInput,
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
    backgroundColor: colors.btnSecondary,
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
  valueFile: {
    backgroundColor: colors.btnSecondary,
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
}));
