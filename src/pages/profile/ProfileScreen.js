import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen({ navigation }) {
    // Dữ liệu mẫu profile (sẽ được thay thế bằng API response)
    const profileData = {
        id: '12345',
        name: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        description: 'Senior Sales Manager',
        date_entered: '2023-01-15',
        date_modified: '2024-07-08',
        modified_by_name: 'Admin',
        department: 'Sales Department',
        phone_mobile: '0901 234 567',
        phone_work: '0812 345 678',
        phone_fax: '0812 345 679',
        address_street: '123 Nguyen Hue Street',
        address_city: 'Ho Chi Minh City',
        address_country: 'Vietnam',
        UserType: 'Regular User',
        reports_to_name: 'Jane Smith',
        email1: 'john.doe@company.com'
    };

    // Gộp address
    const fullAddress = `${profileData.address_street}, ${profileData.address_city}, ${profileData.address_country}`;

    const handleEditProfile = () => {
        console.log('Navigate to Edit Profile');
        navigation.navigate('UpdateProfileScreen', { profileData });
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
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.fullName}>{profileData.full_name}</Text>
                    <Text style={styles.description}>{profileData.description}</Text>
                </View>

                {/* Profile Information */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
                    
                    <ProfileField 
                        label="ID" 
                        value={profileData.id} 
                        icon="card-outline" 
                    />
                    
                    <ProfileField 
                        label="Tên đăng nhập" 
                        value={profileData.name} 
                        icon="person-circle-outline" 
                    />
                    
                    <ProfileField 
                        label="Họ và tên" 
                        value={profileData.full_name} 
                        icon="person-outline" 
                    />
                    
                    <ProfileField 
                        label="Email" 
                        value={profileData.email1} 
                        icon="mail-outline" 
                    />
                    
                    <ProfileField 
                        label="Phòng ban" 
                        value={profileData.department} 
                        icon="business-outline" 
                    />
                    
                    <ProfileField 
                        label="Loại người dùng" 
                        value={profileData.UserType} 
                        icon="shield-outline" 
                    />
                    
                    <ProfileField 
                        label="Báo cáo cho" 
                        value={profileData.reports_to_name} 
                        icon="people-outline" 
                    />
                </View>

                {/* Contact Information */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                    
                    <ProfileField 
                        label="Di động" 
                        value={profileData.phone_mobile} 
                        icon="phone-portrait-outline" 
                    />
                    
                    <ProfileField 
                        label="Điện thoại công ty" 
                        value={profileData.phone_work} 
                        icon="call-outline" 
                    />
                    
                    <ProfileField 
                        label="Fax" 
                        value={profileData.phone_fax} 
                        icon="print-outline" 
                    />
                    
                    <ProfileField 
                        label="Địa chỉ" 
                        value={fullAddress} 
                        icon="location-outline" 
                    />
                </View>

                {/* System Information */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Thông tin hệ thống</Text>
                    
                    <ProfileField 
                        label="Ngày tạo" 
                        value={profileData.date_entered} 
                        icon="calendar-outline" 
                    />
                    
                    <ProfileField 
                        label="Ngày sửa đổi" 
                        value={profileData.date_modified} 
                        icon="time-outline" 
                    />
                    
                    <ProfileField 
                        label="Sửa đổi bởi" 
                        value={profileData.modified_by_name} 
                        icon="person-add-outline" 
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
});
