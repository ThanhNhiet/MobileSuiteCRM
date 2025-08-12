import TopNavigationRelationship from '@/src/components/navigations/TopNavigationRelationship';
import { formatDateTime } from '@/src/utils/format/FormatDateTime';
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
import { SystemLanguageUtils } from '../../utils/cacheViewManagement/SystemLanguageUtils';
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
    // State cho tìm kiếm
    const [searchText, setSearchText] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    // State cho dropdown
    const [selectedType1, setSelectedType1] = useState('');
    const [selectedType2, setSelectedType2] = useState('');
    const [showDropdown1, setShowDropdown1] = useState(false);
    const [showDropdown2, setShowDropdown2] = useState(false);

    // Options cho dropdown
    const systemLanguageUtils = SystemLanguageUtils.getInstance();
    // Options cho dropdown
    const [typeOptions1, setTypeOptions1] = useState([]);
    const [typeOptions2, setTypeOptions2] = useState([]);
     useEffect(() => {
        const setFilterTranslations = async () => {
            const filterTranslations = await systemLanguageUtils.translateKeys([
                'all',  // "Tất cả"
                'LBL_ACCOUNTS', // "Khách hàng"
                'LBL_CONTACTS', // "Liên hệ"
                'LBL_TASKS', // "Công việc"
                'LBL_MEETINGS', // "Hội họp" -> tương đương meetings
                'LBL_DROPDOWN_LIST_ALL', // "Tất cả"
                'today',    // "Hôm nay"
                'this_week', // "Tuần này"
                'this_month' // "Tháng này"
            ]);
            setTypeOptions1([
                { value: 'all', label: filterTranslations.all || 'Tất cả' },
                { value: 'Accounts', label: filterTranslations.LBL_ACCOUNTS || 'Khách hàng' },
                { value: 'Contacts', label: filterTranslations.LBL_CONTACTS || 'Liên hệ' },
                { value: 'Tasks', label: filterTranslations.LBL_TASKS || 'Công việc' },
                { value: 'Meetings', label: filterTranslations.LBL_MEETINGS || 'Hội họp' }
                ]);
                // Set time filter options with translations
                setTypeOptions2([
                    { value: 'all', label: filterTranslations.LBL_DROPDOWN_LIST_ALL || 'Tất cả' },
                    { value: 'today', label: filterTranslations.today || 'Hôm nay' },
                    { value: 'this_week', label: filterTranslations.this_week || 'Tuần này' },
                    { value: 'this_month', label: filterTranslations.this_month || 'Tháng này' }
                ]);
            };
        setFilterTranslations();
    }, []);
    useEffect(() => {
        setSelectedType1(typeOptions1[0]?.label); // Mặc định chọn "Tất cả"
        setSelectedType2(typeOptions2[0]?.label); // Mặc định chọn "Tất cả"
    },[typeOptions1, typeOptions2]);
    // Tính danh sách trang hiển thị (tối đa 3 trang)
    const visiblePages = [page];

    // Vô hiệu hóa khi ở đầu/cuối
    const isPrevDisabled = startPage === 1;
    const isNextDisabled = startPage >= totalPages;

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
             const language = await AsyncStorage.getItem('selectedLanguage');

            if (!token && !language) {
                navigation.navigate('LoginScreen');
                return;
            }

            // Lấy dữ liệu với 20 dòng mỗi trang - sử dụng pageNumber thay vì page
            const result = await RelationshipsData.useListData(
                token,
                pageNumber,
                20,
                language,
                relationship.moduleName,
                relationship.relatedLink
            );
            setApiData(result);
            setFilteredData(result?.relationships || []);
        } catch (error) {
            console.error('💥 Lỗi lấy dữ liệu trang', pageNumber, ':', error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDataByPage(page);
    }, [page]);


   
       // Function để tìm kiếm và lọc dữ liệu
       const searchData = async (searchQuery, fieldFilter) => {
              let filtered = apiData?.meetings || [];
              if (
                  fieldFilter &&
                  fieldFilter !== typeOptions1[0].label &&
                  searchQuery &&
                  searchQuery.trim() !== ''
              ) {
                  const valueFilter = typeOptions1.find(option => option.label === fieldFilter)?.value;
      
                  const searchResult = await MeetingData.getSearchKeyWords(valueFilter, searchQuery, page);
   
                  filtered = filtered.filter(meeting => {
                      return searchResult.some(result => result.id === meeting.id);
                  });
              }
              return filtered;
              };
      
          // Function để tìm kiếm và lọc dữ liệu
           const filterData = async (searchQuery, dateFilter) => {
               if (!apiData?.meetings) return [];
              let filtered = apiData?.meetings;
              // Filter theo date created (dropdown 2)
              if (dateFilter && dateFilter !== typeOptions2[0].label) {
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
   
                          case 'This Week':
                              const startOfWeek = new Date(today);
                              startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
                              const endOfWeek = new Date(startOfWeek);
                              endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
                              return meetingDateOnly >= startOfWeek && meetingDateOnly <= endOfWeek;
   
                          case 'This Month':
                              return meetingDate.getMonth() === now.getMonth() && 
                                     meetingDate.getFullYear() === now.getFullYear();
   
                          default:
                              return true;
                      }
                  });
              }
      
              return filtered;
          };
      
   
        const handleSearch =async () => {
            if (searchText.trim() !== '' && selectedType1 !== typeOptions1[0].label ) {
                const filtered = await searchData(searchText, selectedType1);
                setFilteredData(filtered);
            } else if (searchText.trim() === '' && selectedType2 !== typeOptions2[0].label) {
                const filtered =  filterData(searchText, selectedType2);
                setFilteredData(filtered);
            }
        };
   
       // Function để reset search
       const handleReset = () => {
           setSearchText('');
           setSelectedType1(typeOptions1[0].label);
           setSelectedType2(typeOptions2[0].label);
           setFilteredData(apiData?.meetings || []);
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
                    else if (relationship?.displayName === 'Tasks') {
                        navigation.navigate('TaskDetailScreen', { task: item, 
                                                                     editViews: apiData?.editViews, 
                                                                     requiredFields: apiData?.requiredFields,
                                                                     listViews: apiData?.listViews,
                                                                     getFieldValue: apiData?.getFieldValue,
                                                                     getFieldLabel: apiData?.getFieldLabel,
                                                                     refreshTask:() => fetchDataByPage(page)})
                    }
                    else if (relationship?.displayName === 'Accounts') {
                        navigation.navigate('AccountDetailScreen', { account: item, 
                                                                     editViews: apiData?.editViews, 
                                                                     requiredFields: apiData?.requiredFields,
                                                                     listViews: apiData?.listViews,
                                                                     getFieldValue: apiData?.getFieldValue,
                                                                     getFieldLabel: apiData?.getFieldLabel,
                                                                     refreshAccount:() => fetchDataByPage(page)})
                    }
                    else if (relationship?.displayName === 'Meetings') {
                        navigation.navigate('MeetingDetailScreen', { meeting: item, 
                                                                     editViews: apiData?.editViews, 
                                                                     requiredFields: apiData?.requiredFields,
                                                                     listViews: apiData?.listViews,
                                                                     getFieldValue: apiData?.getFieldValue,
                                                                     getFieldLabel: apiData?.getFieldLabel,
                                                                     refreshMeeting:() => fetchDataByPage(page)})
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
                                option.label === selectedValue && styles.selectedItem
                            ]}
                            onPress={() => {
                                onSelect(option.label);
                                onClose();
                            }}
                        >
                            <Text style={[
                                styles.dropdownText,
                                option.label === selectedValue && styles.selectedText
                            ]}>
                                {option.label}
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
                             <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                                <Text style={{ color: '#666' }}>Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Add new "+" */}
                    <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
                        <TouchableOpacity
                            onPress={() => {
                   if (relationship?.displayName === 'Notes') {
                       navigation.navigate('NoteCreateScreen');
                    }
                    else if (relationship?.displayName === 'Tasks') {
                        navigation.navigate('TaskCreateScreen', {
                                                                     editViews: apiData?.editViews, 
                                                                     requiredFields: apiData?.requiredFields,
                                                                     getFieldValue: apiData?.getFieldValue,
                                                                     getFieldLabel: apiData?.getFieldLabel,
                                                                     refreshTask:() => fetchDataByPage(page)
                                                                    });
                    }
                    else if (relationship?.displayName === 'Accounts') {
                        navigation.navigate('AccountCreateScreen', {
                                                                    getFieldLabel: apiData.getFieldLabel,
                                                                    getFieldValue: apiData.getFieldValue,
                                                                    editViews: apiData.editViews,
                                                                    requiredFields: apiData.requiredFields,
                                                                    refreshAccount: () => fetchDataByPage(page)
                                                                    });
                    }
                    else if (relationship?.displayName === 'Meetings') {
                        navigation.navigate('MeetingCreateScreen', {                                
                                                                     editViews: apiData?.editViews,
                                                                     requiredFields: apiData?.requiredFields,
                                                                     getFieldValue: apiData?.getFieldValue,
                                                                     getFieldLabel: apiData?.getFieldLabel,
                                                                     refreshMeeting:() => fetchDataByPage(page)
                                                                    });
                    }
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
                        data={filteredData}
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
