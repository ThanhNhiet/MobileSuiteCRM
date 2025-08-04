import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfile } from '../../services/useApi/user/UseUser_Profile';
import { UserLanguageUtils } from '../../utils/cacheViewManagement/Users/UserLanguageUtils';

export default function ProfileScreen({ navigation }) {
    // Use custom hook to get profile information
    const { 
        profileData, 
        loading, 
        error, 
        refreshing, 
        refreshProfile, 
        fieldLabels,
        refreshLanguageCache,
        refreshFieldsCache
    } = useUserProfile();
    
    // Language translations
    const [translations, setTranslations] = useState({});
    const [isRefreshingLanguage, setIsRefreshingLanguage] = useState(false);
    const [isRefreshingFields, setIsRefreshingFields] = useState(false);
    const userLanguageUtils = UserLanguageUtils.getInstance();

    // Load translations
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const keys = [
                    'LBL_LOADING',
                    'LBL_ERROR',
                    'LBL_RETRY',
                    'LBL_USER_INFORMATION', 
                    'LBL_ADDRESS_INFORMATION',
                    'LBL_EDIT',
                    'LBL_GENERATE_PASSWORD_BUTTON_LABEL',
                    'LBL_SETTINGS',
                    'LBL_UPDATE',
                    'LBL_LANGUAGE',
                    'Field'
                ];
                
                const translatedLabels = await userLanguageUtils.translateKeys(keys);
                setTranslations(translatedLabels);
            } catch (error) {
                console.warn('Error loading profile translations:', error);
            }
        };

        loadTranslations();
    }, []);

    // Show loading when loading data for the first time
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>
                        {translations.LBL_LOADING || 'Loading information...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Show error if there is one
    if (error && !profileData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#FF3B30" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refreshProfile()}
                    >
                        <Text style={styles.retryButtonText}>
                            {translations.LBL_RETRY || 'Retry'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Data from API
    const displayData = profileData?.attributes || {};

    // Helper function to get field label with fallback
    const getFieldLabel = (fieldName, defaultLabel) => {
        return fieldLabels[fieldName] || defaultLabel;
    };

    // Field icon mapping
    const getFieldIcon = (fieldName) => {
        const iconMap = {
            full_name: 'person-outline',
            user_name: 'person-circle-outline',
            status: 'checkmark-circle-outline',
            UserType: 'business-outline',
            employee_status: 'briefcase-outline',
            show_on_employees: 'eye-outline',
            title: 'ribbon-outline',
            department: 'business-outline',
            reports_to_name: 'people-outline',
            description: 'document-text-outline',
            photo: 'image-outline',
            phone_mobile: 'phone-portrait-outline',
            phone_work: 'call-outline',
            phone_other: 'call-outline',
            phone_fax: 'print-outline',
            phone_home: 'home-outline',
            messenger_type: 'chatbubble-outline',
            messenger_id: 'chatbubbles-outline',
            address_street: 'location-outline',
            address_city: 'business-outline',
            address_state: 'map-outline',
            address_postalcode: 'mail-outline',
            address_country: 'globe-outline',
        };
        return iconMap[fieldName] || 'information-circle-outline';
    };

    // Dynamically group fields into sections based on field names
    const getFieldSections = () => {
        // Get all available fields from the API response
        const availableFields = Object.keys(displayData);
        
        // Define field patterns for categorization
        const phoneFields = availableFields.filter(field => 
            field.startsWith('phone_') || field.includes('fax')
        );
        
        const addressFields = availableFields.filter(field => 
            field.startsWith('address_')
        );
        
        const messengerFields = availableFields.filter(field => 
            field.startsWith('messenger_')
        );
        
        // Contact fields = phone + messenger fields
        const contactFields = [...phoneFields, ...messengerFields];
        
        // User info fields = all other fields except contact, address, and header fields
        const excludedFields = [...contactFields, ...addressFields, 'full_name', 'description', 'photo'];
        const userInfoFields = availableFields.filter(field => 
            !excludedFields.includes(field)
        );

        return { userInfoFields, contactFields, addressFields };
    };

    // Render dynamic profile fields
    const renderProfileFields = (fieldNames, data) => {
        return fieldNames.map(fieldName => {
            const value = data[fieldName];
            // Skip fields that are empty or null for cleaner UI (optional)
            // if (!value || value.trim() === '') return null;
            
            return (
                <ProfileField
                    key={fieldName}
                    fieldName={fieldName}
                    value={value}
                    icon={getFieldIcon(fieldName)}
                />
            );
        }).filter(Boolean);
    };

    const handleEditProfile = () => {
        navigation.navigate('UpdateProfileScreen', { profileData: displayData });
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePasswordScreen');
    };

    const handleRefreshLanguage = async () => {
        try {
            setIsRefreshingLanguage(true);
            await refreshLanguageCache();
            // Show success message or toast here if needed
            console.log('Language cache refreshed successfully');
        } catch (error) {
            console.warn('Error refreshing language cache:', error);
            // Show error message or toast here if needed
        } finally {
            setIsRefreshingLanguage(false);
        }
    };

    const handleRefreshFields = async () => {
        try {
            setIsRefreshingFields(true);
            await refreshFieldsCache();
            // Show success message or toast here if needed
            console.log('Fields cache refreshed successfully');
        } catch (error) {
            console.warn('Error refreshing fields cache:', error);
            // Show error message or toast here if needed
        } finally {
            setIsRefreshingFields(false);
        }
    };

    const ProfileField = ({ fieldName, label, value, icon }) => (
        <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
                <Ionicons name={icon} size={20} color="#4B84FF" />
                <Text style={styles.fieldLabel}>
                    {fieldName ? getFieldLabel(fieldName, label) : label}
                </Text>
            </View>
            <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
        </View>
    );

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshProfile}
                            colors={['#007AFF']}
                            title="Loading..."
                        />
                    }
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            {displayData.photo ? (
                                <Image 
                                    source={{ uri: displayData.photo }} 
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={styles.avatar}>
                                    <Ionicons name="person" size={40} color="white" />
                                </View>
                            )}
                        </View>
                        <Text style={styles.fullName}>{displayData.full_name}</Text>
                        <Text style={styles.description}>{displayData.description}</Text>
                    </View>

                    {/* Profile Information */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>
                            {translations.LBL_USER_INFORMATION || 'User Information'}
                        </Text>
                        
                        {renderProfileFields(getFieldSections().userInfoFields, displayData)}
                    </View>

                    {/* Contact Information */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>
                            {translations.LBL_CONTACT_INFORMATION || 'Contact Information'}
                        </Text>
                        
                        {renderProfileFields(getFieldSections().contactFields, displayData)}
                    </View>

                    {/* Address Information */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>
                            {translations.LBL_ADDRESS_INFORMATION || 'Address Information'}
                        </Text>
                        
                        {renderProfileFields(getFieldSections().addressFields, displayData)}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleEditProfile}
                        >
                            <Ionicons name="create-outline" size={20} color="white" />
                            <Text style={styles.primaryButtonText}>
                                {translations.LBL_EDIT || 'Edit Information'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleChangePassword}
                        >
                            <Ionicons name="lock-closed-outline" size={20} color="#4B84FF" />
                            <Text style={styles.secondaryButtonText}>
                                {translations.LBL_GENERATE_PASSWORD_BUTTON_LABEL || 'Change Password'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, isRefreshingLanguage && styles.disabledButton]}
                            onPress={handleRefreshLanguage}
                            disabled={isRefreshingLanguage}
                        >
                            {isRefreshingLanguage ? (
                                <ActivityIndicator size={20} color="#4B84FF" />
                            ) : (
                                <Ionicons name="language-outline" size={20} color="#4B84FF" />
                            )}
                            <Text style={styles.secondaryButtonText}>
                                {`${translations.LBL_UPDATE || 'Update'} ${translations.LBL_LANGUAGE || 'Language'}`}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, isRefreshingFields && styles.disabledButton]}
                            onPress={handleRefreshFields}
                            disabled={isRefreshingFields}
                        >
                            {isRefreshingFields ? (
                                <ActivityIndicator size={20} color="#4B84FF" />
                            ) : (
                                <Ionicons name="list-outline" size={20} color="#4B84FF" />
                            )}
                            <Text style={styles.secondaryButtonText}>
                                {`${translations.LBL_UPDATE || 'Update'} ${translations.LBL_FIELD || 'Fields'}`}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom spacing */}
                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: 'white',
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    avatarContainer: {
        marginBottom: 15,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4B84FF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fullName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    description: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
    },
    infoSection: {
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    fieldContainer: {
        marginBottom: 15,
    },
    fieldHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginLeft: 8,
    },
    fieldValue: {
        fontSize: 16,
        color: '#333',
        marginLeft: 28,
        lineHeight: 22,
    },
    actionSection: {
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#4B84FF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    secondaryButton: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4B84FF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    secondaryButtonText: {
        color: '#4B84FF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    disabledButton: {
        opacity: 0.6,
    },
    bottomSpacing: {
        height: 30,
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
        paddingHorizontal: 30,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 24,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
