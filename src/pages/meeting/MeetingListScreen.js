import { useNavigation } from '@react-navigation/native';
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


import { formatDateTime } from '@/src/utils/FormatDateTime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigation from '../../components/navigations/BottomNavigation';
import TopNavigation from '../../components/navigations/TopNavigation';
import MeetingData from '../../services/useApi/meeting/MeetingData';

export default function MeetingListScreen() {
    const navigation = useNavigation();
    const mdName = 'Cuộc họp';

    const [page, setPage] = useState(1);
    const totalPages = 10;

    // dữ liệu từ API
    const [apiData, setApiData] = useState(null);
    // loading state
    const [loading, setLoading] = useState(true);

    // State cho dropdown
    const [selectedType1, setSelectedType1] = useState('All');
    const [selectedType2, setSelectedType2] = useState('All');
    const [showDropdown1, setShowDropdown1] = useState(false);
    const [showDropdown2, setShowDropdown2] = useState(false);

    // State cho search
    const [searchText, setSearchText] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    // Options cho dropdown
    const [typeOptions1, setTypeOptions1] = useState([]);
    const typeOptions2 = ['All', 'Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month'];

    // Tính danh sách trang hiển thị (chỉ hiển thị 1 trang hiện tại)
    const visiblePages = [page];

    // Vô hiệu hóa khi ở đầu/cuối
    const isPrevDisabled = page === 1;
    const isNextDisabled = page >= totalPages;

    const handlePrev = () => {
        if (!isPrevDisabled) {
            const newPage = page - 1;
            setPage(newPage);
            // Lấy dữ liệu trang mới
            fetchDataByPage(newPage);
        }
    };

    const handleNext = () => {
        if (!isNextDisabled) {
            const newPage = page + 1;
            setPage(newPage);
            // Lấy dữ liệu trang mới
            fetchDataByPage(newPage);
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
            const language = await AsyncStorage.getItem('selectedLanguage') || 'en_us';
            if (!token && !language) {   
                navigation.navigate('LoginScreen');
                return;
            }
            
            // Lấy dữ liệu với 20 dòng mỗi trang
            const result = await MeetingData.useListData(token, pageNumber, 20, language);
            setTypeOptions1(['All', ...result.editViews.map(field => field.label)]);
            setApiData(result);
            setFilteredData(result.meetings || []); // Khởi tạo filtered data
            
        } catch (error) {
            console.error('Lỗi lấy dữ liệu trang', pageNumber, ':', error);
        } finally {
            setLoading(false);
        }
    };

    // Function để tìm kiếm và lọc dữ liệu
    const filterData = (searchQuery, fieldFilter, dateFilter) => {
        if (!apiData?.meetings) return [];

        let filtered = apiData.meetings;

        // Filter theo search text
        if (searchQuery && searchQuery.trim() !== '') {
            const searchLower = searchQuery.toLowerCase();
            filtered = filtered.filter(meeting => {
                // Tìm kiếm trong tất cả các fields
                return apiData.detailFields?.some(field => {
                    const value = apiData.getFieldValue(meeting, field.key);
                    return value && value.toString().toLowerCase().includes(searchLower);
                });
            });
        }

        // Filter theo field (dropdown 1)
        if (fieldFilter && fieldFilter !== 'All') {
            // Tìm field tương ứng với label được chọn
            const selectedField = apiData.detailFields?.find(field => field.label === fieldFilter);
            if (selectedField) {
                filtered = filtered.filter(meeting => {
                    const value = apiData.getFieldValue(meeting, selectedField.key);
                    return value && value.toString().trim() !== '';
                });
            }
        }

        // Filter theo date created (dropdown 2)
        if (dateFilter && dateFilter !== 'All') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(meeting => {
                const dateCreated = apiData.getFieldValue(meeting, 'date_entered') || 
                                  apiData.getFieldValue(meeting, 'date_created') ||
                                  apiData.getFieldValue(meeting, 'created_date');
                
                if (!dateCreated) return false;

                const meetingDate = new Date(dateCreated);
                if (isNaN(meetingDate.getTime())) return false;

                const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());

                switch (dateFilter) {
                    case 'Today':
                        return meetingDateOnly.getTime() === today.getTime();
                    
                    case 'Yesterday':
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        return meetingDateOnly.getTime() === yesterday.getTime();
                    
                    case 'This Week':
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
                        return meetingDateOnly >= startOfWeek && meetingDateOnly <= endOfWeek;
                    
                    case 'Last Week':
                        const lastWeekStart = new Date(today);
                        lastWeekStart.setDate(today.getDate() - today.getDay() - 7); // Sunday of last week
                        const lastWeekEnd = new Date(lastWeekStart);
                        lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Saturday of last week
                        return meetingDateOnly >= lastWeekStart && meetingDateOnly <= lastWeekEnd;
                    
                    case 'This Month':
                        return meetingDate.getMonth() === now.getMonth() && 
                               meetingDate.getFullYear() === now.getFullYear();
                    
                    case 'Last Month':
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        return meetingDate.getMonth() === lastMonth.getMonth() && 
                               meetingDate.getFullYear() === lastMonth.getFullYear();
                    
                    default:
                        return true;
                }
            });
        }

        return filtered;
    };

    const handleSearch = () => {
        const filtered = filterData(searchText, selectedType1, selectedType2);
        setFilteredData(filtered);
    };

    // Function để reset search
    const handleReset = () => {
        setSearchText('');
        setSelectedType1('All');
        setSelectedType2('All');
        setFilteredData(apiData?.meetings || []);
    };

    // Auto search khi thay đổi filters
    useEffect(() => {
        if (apiData?.meetings) {
            const filtered = filterData(searchText, selectedType1, selectedType2);
            setFilteredData(filtered);
        }
    }, [searchText, selectedType1, selectedType2, apiData]);

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchDataByPage(1);
    }, []);

    const renderItem = ({ item }) => {
        // Lấy 3 fields đầu tiên (không bao gồm id) để hiển thị
        const displayFields = apiData?.listViews
            ?.filter(field => field.key !== 'id')
            ?.slice(0, 3) || [];

        return (
            <TouchableOpacity style={styles.tableRow} onPress={() => {navigation.navigate('MeetingDetailScreen', { meeting: item, editViews: apiData?.editViews, requiredFields: apiData?.requiredFields, listViews: apiData?.listViews, getFieldValue: apiData?.getFieldValue, getFieldLabel: apiData?.getFieldLabel, refreshMeeting:() => fetchDataByPage(page)})}}>
                {displayFields.map((field, index) => {
                    const rawValue = apiData?.getFieldValue(item, field.key.toLowerCase()) || '';

                    // Kiểm tra và format nếu là dữ liệu ngày
                    let displayValue = rawValue;
                    if (rawValue && (
                        field.key.includes('date') ||
                        field.key.includes('time') ||
                        field.key === 'date_entered' ||
                        field.key === 'date_modified' ||
                        field.key === 'created_date' ||
                        field.key === 'modified_date' ||
                        field.key === 'date_start' ||
                        field.key === 'date_end'
                    )) {
                        displayValue = formatDateTime(rawValue);
                    }
                    
                    return (
                        <Text key={index} style={styles.cell}>
                            {displayValue}
                        </Text>
                    );
                })}
            </TouchableOpacity>
        );
    };

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
                
                <TopNavigation moduleName={mdName} navigation={navigation}/>

                <View style={styles.content}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
                        {/* Search Form */}
                        <View style={{ flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                            <View style={styles.searchBar}>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Tìm kiếm..." 
                                    value={searchText}
                                    onChangeText={setSearchText}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType="search"
                                />
                            </View>
                            {/* Filter Labels */}
                            <View style={styles.searchFormOptions}>
                                <TouchableOpacity 
                                    style={styles.select} 
                                    onPress={() => setShowDropdown1(true)}
                                >
                                    <Text numberOfLines={1} style={{ flex: 1 }}>{selectedType1}</Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.select, { minWidth: 80 }]} 
                                    onPress={() => setShowDropdown2(true)}
                                >
                                    <Text numberOfLines={1} style={{ flex: 1 }}>{selectedType2}</Text>
                                    <Text style={styles.dropdownArrow}>▼</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                                    <Text style={{ color: '#fff' }}>Tìm</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                                    <Text style={{ color: '#666' }}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Add new "+" */}
                        <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                            <TouchableOpacity
                                onPress={() => {
                                    // TODO: Điều hướng hoặc xử lý thêm mới dữ liệu
                                   // console.log('Add new');
                                    navigation.navigate('MeetingCreateScreen',{
                                        editViews: apiData?.editViews,
                                        requiredFields: apiData?.requiredFields,
                                        getFieldLabel: apiData?.getFieldLabel,
                                        getFieldValue: apiData?.getFieldValue,
                                        refreshMeeting: () => fetchDataByPage(page)
                                    });
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
                        {apiData?.detailFields
                            ?.filter(field => field.key !== 'id') // 👉 Lọc bỏ 'id' tại chỗ
                            ?.slice(0, 3) // 👉 Chỉ lấy 3 fields đầu tiên
                            ?.map((field, index) => (
                            <Text key={index} style={styles.headerCell}>{field.label || field.key}</Text>
                            )) || []}
                    </View>

                    {/* Result Counter */}
                    {(filteredData.length !== (apiData?.meetings?.length || 0)) && (
                        <View style={styles.resultCounter}>
                            <Text style={styles.resultText}>
                                Hiển thị {filteredData.length} / {apiData?.meetings?.length || 0} kết quả
                            </Text>
                        </View>
                    )}

                    {/* Table Rows - Scrollable */}
                    <FlatList
                        data={filteredData}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        style={styles.list}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {searchText ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
                                </Text>
                            </View>
                        )}
                    />

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
                
                <BottomNavigation navigation={navigation} />

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
    filterLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginBottom: 4,
    },
    filterLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        flex: 1,
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
    resetButton: {
        backgroundColor: '#f0f0f0',
        padding: 6,
        paddingHorizontal: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#C9B4AB',
        padding: 8,
    },
    resultCounter: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    resultText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
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
    // Empty state styles
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});
