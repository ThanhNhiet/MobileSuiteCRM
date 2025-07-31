import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useLogin_out } from '../../services/useApi/login/UseLogin_out';

const { width } = Dimensions.get('window');

const HamburgerModal = ({ visible, onClose, navigation }) => {
    const slideAnim = useRef(new Animated.Value(-width * 0.6)).current; // Start off-screen left
    const { handleLogout } = useLogin_out();

    useEffect(() => {
        if (visible) {
            // Slide in from left
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // Slide out to left
            Animated.timing(slideAnim, {
                toValue: -width * 0.6,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, slideAnim]);

    const handleClose = () => {
        // Animate out first, then close
        Animated.timing(slideAnim, {
            toValue: -width * 0.6,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const navigateTo = (moduleName) => {
        console.log(`Navigate to ${moduleName}`);
        handleClose();
        navigation.navigate(moduleName);
    };

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                {/* Background overlay - close when tapped */}
                <TouchableOpacity
                    style={styles.backgroundOverlay}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                {/* Animated Sidebar Menu */}
                <Animated.View
                    style={[
                        styles.sidebar,
                        {
                            transform: [{ translateX: slideAnim }]
                        }
                    ]}
                >
                    {/* Header with Profile and Close */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.profileSection}
                            onPress={() => navigateTo('ProfileScreen')}
                        >
                            <View style={styles.profileIcon}>
                                <Ionicons name="person" size={24} color="white" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                            <Ionicons name="close" size={28} color="black" />
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <ScrollView
                        style={styles.menuContainer}
                        contentContainerStyle={styles.menuContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigateTo('AccountListScreen')}
                        >
                            <Text style={styles.menuText}>Khách hàng</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigateTo('NoteListScreen')}
                        >
                            <Text style={styles.menuText}>Ghi chú</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigateTo('TaskListScreen')}
                        >
                            <Text style={styles.menuText}>Công việc</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigateTo('MeetingListScreen')}
                        >
                            <Text style={styles.menuText}>Cuộc họp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigateTo('CalendarScreen')}
                        >
                            <Text style={styles.menuText}>Lịch của tôi</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Logout Button */}
                    <View style={styles.logoutContainer}>
                        <TouchableOpacity style={styles.logoutButton}
                            onPress={() => {
                                handleClose();
                                handleLogout();
                            }
                            }>
                            <Text style={styles.logoutText}>Logout</Text>
                            <Ionicons name="log-out" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backgroundOverlay: {
        flex: 1,
    },
    sidebar: {
        width: width * 0.6, // 70% of screen width
        backgroundColor: '#F5F5F5',
        paddingVertical: 20,
        paddingHorizontal: 0,
        justifyContent: 'space-between',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    profileSection: {
        alignItems: 'center',
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4B84FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
    },
    closeButton: {
        padding: 5,
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    menuContent: {
        paddingBottom: 10,
    },
    menuItem: {
        backgroundColor: '#BFAAA1',
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 15,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    menuText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '500',
    },
    logoutContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    logoutButton: {
        backgroundColor: '#FF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default HamburgerModal;
