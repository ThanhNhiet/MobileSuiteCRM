import TopNavigationRelationship from '@/src/components/navigations/TopNavigationRelationship';
import { formatDateTime } from '@/src/utils/FormatDateTime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RelationshipsData from '../../services/useApi/relationship/RelationshipData';
export default function RelationshipListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { relationship } = route.params;

    const [page, setPage] = useState(1);
    const totalPages = 10;
    const [startPage, setStartPage] = useState(1);

    // dữ liệu từ API
    const [apiData, setApiData] = useState(null);
    // loading state
    const [loading, setLoading] = useState(true);

    // State cho dropdown
    const [selectedType1, setSelectedType1] = useState('All');
    const [selectedType2, setSelectedType2] = useState('All');
    const [showDropdown1, setShowDropdown1] = useState(false);
    const [showDropdown2, setShowDropdown2] = useState(false);

    // Options cho dropdown
    const typeOptions1 = ['All', 'Personal', 'Business', 'Important'];
    const typeOptions2 = ['All', 'Today', 'This Week', 'This Month'];

    // Tính danh sách trang hiển thị (tối đa 3 trang)
    const visiblePages = Array.from({ length: 3 }, (_, i) => startPage + i).filter(p => p <= totalPages);

    // Vô hiệu hóa khi ở đầu/cuối
    const isPrevDisabled = startPage === 1;
    const isNextDisabled = startPage + 2 >= totalPages;

    const handlePrev = () => {
        if (!isPrevDisabled) {
            const newStart = startPage - 1;
            setStartPage(newStart);
            setPage(newStart);
            // Lấy dữ liệu trang mới
            fetchDataByPage(newStart);
        }
    };

    const handleNext = () => {
        if (!isNextDisabled) {
            const newStart = startPage + 1;
            setStartPage(newStart);
            setPage(newStart);
            // Lấy dữ liệu trang mới
            fetchDataByPage(newStart);
        }
    };

    const handlePageClick = (pageNumber) => {
        setPage(pageNumber);
        // Lấy dữ liệu trang mới
        fetchDataByPage(pageNumber);
    };

    // Function để lấy dữ liệu theo trang
    const fetchDataByPage = async (pageNumber) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                navigation.navigate('LoginScreen');
                return;
            }

            // Lấy dữ liệu với 20 dòng mỗi trang - sử dụng pageNumber thay vì page
            const result = await RelationshipsData.getDataWithFields(
                token,
                relationship.moduleName,
                relationship.relatedLink,
                pageNumber,
                20
            );
            setApiData(result);
        } catch (error) {
            console.error('💥 Lỗi lấy dữ liệu trang', pageNumber, ':', error);
        } finally {
            setLoading(false);
        }
    };


    const handleSearch = () => {
        // Xử lý tìm kiếm
    };

    const renderItem = ({ item }) => {
        // Lấy 3 fields đầu tiên (không bao gồm id) để hiển thị
        const displayFields = apiData?.detailFields
            ?.filter(field => field.key !== 'id')
            ?.slice(0, 3) || [];
        return (
            <TouchableOpacity
                style={styles.tableRow}
                onPress={() => {
                   
                    if (relationship?.displayName === 'Notes') {
                        navigation.navigate('NoteDetailScreen', { noteId: item.id })
                    }
                    else {
                        navigation.navigate('RelationshipDetailScreen', {
                            record: item,
                            detailFields: displayFields,
                            getFieldValue: apiData?.getFieldValue,
                            getFieldLabel: apiData?.getFieldLabel,
                            moduleName: apiData?.moduleName
                        })
                    }
                }}
            >
                {displayFields.map((field, index) => {
                    // Lấy giá trị từ record - thử tất cả các biến thể key
                    let rawValue = '';
                    const possibleKeys = [
                        field.key,                    // Original key
                        field.key.toLowerCase(),      // Lowercase 
                        field.key.toUpperCase(),      // Uppercase
                        field.key.replace(/_/g, ''),  // Remove underscores
                        field.key.toLowerCase().replace(/_/g, ''), // Lowercase no underscores
                        field.key.toUpperCase().replace(/_/g, '')  // Uppercase no underscores
                    ];

                    // Tìm key đầu tiên có giá trị
                    for (const key of possibleKeys) {
                        if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
                            rawValue = item[key];
                            break;
                        }
                    }

                    // Kiểm tra và format nếu là dữ liệu ngày
                    let displayValue = rawValue;
                    if (rawValue && (
                        field.key.toLowerCase().includes('date') ||
                        field.key.toLowerCase().includes('time') ||
                        field.key.toLowerCase() === 'date_entered' ||
                        field.key.toLowerCase() === 'date_modified' ||
                        field.key.toLowerCase() === 'created_date' ||
                        field.key.toLowerCase() === 'modified_date'
                    )) {
                        displayValue = formatDateTime(rawValue);
                    }

                    return (
                        <Text key={index} style={styles.cell}>
                            {displayValue || '-'}
                        </Text>
                    );
                })}
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.navigate('LoginScreen');
                    return;
                }
                // Lấy dữ liệu với 20 dòng cho trang đầu tiên
                const result = await RelationshipsData.getDataWithFields(
                    token,
                    relationship.moduleName,
                    relationship.relatedLink,
                    1,
                    20
                );
                if (result) {
                    setApiData(result);
                    // Cập nhật pagination từ meta data
                    if (result.meta && result.meta['total-pages']) {
                        // Nếu có thông tin từ API, có thể cập nhật totalPages
                    }
                }

            } catch (error) {
                console.error('💥 Lỗi lấy dữ liệu ban đầu:', error);
            } finally {
                setLoading(false);
            }
        };

        if (relationship?.moduleName && relationship?.relatedLink) {
            fetchData();
        }
    }, [relationship]);

    // Component Dropdown
    const DropdownSelect = ({ options, selectedValue, onSelect, visible, onClose }) => (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.dropdownContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dropdownItem,
                                option === selectedValue && styles.selectedItem
                            ]}
                            onPress={() => {
                                onSelect(option);
                                onClose();
                            }}
                        >
                            <Text style={[
                                styles.dropdownText,
                                option === selectedValue && styles.selectedText
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>

            <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />

            {/* <TopNavigation moduleName={mdName} navigation={navigation}/> */}
            <TopNavigationRelationship
                moduleName={relationship?.moduleLabel || ''}
                navigation={navigation}
            />

            <View style={styles.content}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {/* Search Form */}
                    <View style={{ flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                        <View style={styles.searchBar}>
                            <TextInput style={styles.input} placeholder="Key search" />
                        </View>
                        <View style={styles.searchFormOptions}>
                            <TouchableOpacity
                                style={styles.select}
                                onPress={() => setShowDropdown1(true)}
                            >
                                <Text>{selectedType1}</Text>
                                <Text style={styles.dropdownArrow}>▼</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.select}
                                onPress={() => setShowDropdown2(true)}
                            >
                                <Text>{selectedType2}</Text>
                                <Text style={styles.dropdownArrow}>▼</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                                <Text style={{ color: '#fff' }}>Tìm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Add new "+" */}
                    <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <TouchableOpacity
                            onPress={() => {
                                navigation.navigate('AccountCreateScreen');
                            }}
                            style={[styles.addNewBtn]}
                        >
                            <Text style={styles.plusText}>+</Text>
                        </TouchableOpacity>
                        <Text>Thêm</Text>
                    </View>
                </View>


                {/* Table Header */}
                <View style={styles.tableHeader}>
                    {loading ? (
                        <Text style={styles.headerCell}>Loading...</Text>
                    ) : (
                        apiData?.detailFields
                            ?.filter(field => field.key !== 'id') // 👉 Lọc bỏ 'id' tại chỗ
                            ?.slice(0, 3) // 👉 Chỉ lấy 3 fields đầu tiên
                            ?.map((field, index) => (
                                <Text key={index} style={styles.headerCell}>
                                    {field.label || field.key}
                                </Text>
                            )) || <Text style={styles.headerCell}>No Fields</Text>
                    )}
                </View>

                {/* Table Rows - Scrollable */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text>Loading data...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={apiData?.records || []}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text>Không có dữ liệu</Text>
                                <Text>Module: {relationship?.moduleName || 'Unknown'}</Text>
                                <Text>Records: {apiData?.records?.length || 0}</Text>
                            </View>
                        }
                    />
                )}

                <View style={styles.pagination}>
                    {/* Prev */}
                    <TouchableOpacity
                        onPress={handlePrev}
                        style={[styles.pageBtn, isPrevDisabled && styles.disabledBtn]}
                        disabled={isPrevDisabled}
                    >
                        <Text style={isPrevDisabled ? { color: '#aaa' } : {}}>{'<'}</Text>
                    </TouchableOpacity>

                    {/* Page numbers */}
                    {visiblePages.map((num) => (
                        <TouchableOpacity
                            key={num}
                            onPress={() => handlePageClick(num)}
                            style={[styles.pageBtn, num === page && styles.activePage]}
                        >
                            <Text style={num === page ? { color: '#fff' } : {}}>{num}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Next */}
                    <TouchableOpacity
                        onPress={handleNext}
                        style={[styles.pageBtn, isNextDisabled && styles.disabledBtn]}
                        disabled={isNextDisabled}
                    >
                        <Text style={isNextDisabled ? { color: '#aaa' } : {}}>{'>'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* <BottomNavigation  navigation={navigation}/> */}

            {/* Dropdown Modals */}
            <DropdownSelect
                options={typeOptions1}
                selectedValue={selectedType1}
                onSelect={setSelectedType1}
                visible={showDropdown1}
                onClose={() => setShowDropdown1(false)}
            />
            <DropdownSelect
                options={typeOptions2}
                selectedValue={selectedType2}
                onSelect={setSelectedType2}
                visible={showDropdown2}
                onClose={() => setShowDropdown2(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },

    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        minHeight: '80%',
    },
    searchBar: {
        height: 35,
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    searchFormOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        borderWidth: 1,
        padding: 6,
        flex: 1,
        minWidth: '80%',
        backgroundColor: '#fff',
    },
    select: {
        borderWidth: 1,
        padding: 6,
        backgroundColor: '#eee',
        minWidth: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 4,
    },
    dropdownArrow: {
        fontSize: 10,
        marginLeft: 5,
        color: '#666',
    },
    searchButton: {
        backgroundColor: '#4B84FF',
        padding: 6,
        paddingHorizontal: 16,
        borderRadius: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#C9B4AB',
        padding: 8,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 11,
        backgroundColor: '#F3F0EF',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    cell: { flex: 1 },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 6,
    },
    pageBtn: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        minWidth: 32,
        alignItems: 'center',
    },
    activePage: {
        backgroundColor: '#4B84FF',
        borderColor: '#4B84FF',
    },
    disabledBtn: {
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    addNewBtn: {
        width: 60,
        height: 60,
        backgroundColor: '#4B84FF',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusText: {
        color: '#fff',
        fontSize: 40,
        lineHeight: 27, // Đảm bảo chữ "+" nằm giữa
    },
    list: {
        flexGrow: 0, // Đảm bảo không chiếm toàn bộ không gian
        maxHeight: 500, // Chiều cao list
    },
    // Loading and Empty states
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Dropdown styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownContainer: {
        backgroundColor: 'white',
        minWidth: 150,
        maxHeight: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        }
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    selectedItem: {
        backgroundColor: '#4B84FF',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    selectedText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
