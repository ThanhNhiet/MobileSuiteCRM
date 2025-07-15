import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfile } from '../../services/useApi/user/UseUser_Profile';

export default function ProfileScreen({ navigation }) {
    // Sử dụng custom hook để lấy thông tin profile
    const { profileData, loading, error, refreshing, refreshProfile } = useUserProfile();

    // Hiển thị loading khi đang tải dữ liệu lần đầu
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Đang tải thông tin...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Hiển thị lỗi nếu có
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
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Dữ liệu mẫu sẽ được thay thế bằng profileData từ API
    const displayData = profileData?.attributes || {
        full_name: 'John Doe',
        description: 'Senior Sales Manager',
        phone_mobile: '0901 234 567',
        phone_work: '0812 345 678',
        address_street: '123 Nguyen Hue Street',
        address_city: 'Ho Chi Minh City',
        address_country: 'Vietnam',
        reports_to_name: 'Jane Smith',
        email1: 'john.doe@company.com'
    };

    // Gộp address
    const fullAddress = `${displayData.address_street || ''}, ${displayData.address_city || ''}, ${displayData.address_country || ''}`.replace(/^,\s*|,\s*$/g, '');

    const handleEditProfile = () => {
        console.log('Navigate to Edit Profile');
        navigation.navigate('UpdateProfileScreen', { profileData: displayData });
    };

    const handleChangePassword = () => {
        console.log('Navigate to Change Password');
        navigation.navigate('ChangePasswordScreen');
    };

    const ProfileField = ({ label, value, icon }) => (
        <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
                <Ionicons name={icon} size={20} color="#4B84FF" />
                <Text style={styles.fieldLabel}>{label}</Text>
            </View>
            <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshProfile}
                        colors={['#007AFF']}
                        title="Đang tải..."
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.fullName}>{displayData.full_name}</Text>
                    <Text style={styles.description}>{displayData.description}</Text>
                </View>

                {/* Profile Information */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                    
                    <ProfileField 
                        label="Họ và tên" 
                        value={displayData.full_name} 
                        icon="person-outline" 
                    />
                    
                    <ProfileField 
                        label="Email" 
                        value={displayData.email1} 
                        icon="mail-outline" 
                    />
                    
                    <ProfileField 
                        label="Mô tả" 
                        value={displayData.description} 
                        icon="document-text-outline" 
                    />
                    
                    <ProfileField 
                        label="Báo cáo cho" 
                        value={displayData.reports_to_name} 
                        icon="people-outline" 
                    />
                </View>

                {/* Contact Information */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                    
                    <ProfileField 
                        label="Di động" 
                        value={displayData.phone_mobile} 
                        icon="phone-portrait-outline" 
                    />
                    
                    <ProfileField 
                        label="Điện thoại công ty" 
                        value={displayData.phone_work} 
                        icon="call-outline" 
                    />
                    
                    <ProfileField 
                        label="Địa chỉ" 
                        value={fullAddress} 
                        icon="location-outline" 
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                    <TouchableOpacity 
                        style={styles.primaryButton} 
                        onPress={handleEditProfile}
                    >
                        <Ionicons name="create-outline" size={20} color="white" />
                        <Text style={styles.primaryButtonText}>Chỉnh sửa thông tin</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.secondaryButton} 
                        onPress={handleChangePassword}
                    >
                        <Ionicons name="lock-closed-outline" size={20} color="#4B84FF" />
                        <Text style={styles.secondaryButtonText}>Đổi mật khẩu</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
