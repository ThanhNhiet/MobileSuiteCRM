const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJiODgxZmI3Yi1hZTE0LWE0OGMtZGE2MC02ODYyYWNkZTRiNTQiLCJqdGkiOiI4YjMzZDUzMDYzNzhmMzk0Yzc5YTQ5MGM4NWFkNjE2YjFkYjM5MjA4MmNiNDQ2ZjQ5YzI0ZDdjNWNlNzZjMjEwNTM5ZWRmZmU3OTk4NTdkMiIsImlhdCI6MTc1MjIxNjM0OS40MTcyMTMsIm5iZiI6MTc1MjIxNjM0OS40MTcyMTksImV4cCI6MTc1MjIxOTk0MS43NTk4NDIsInN1YiI6IjEiLCJzY29wZXMiOltdfQ.Hqmjb6NnTRzlcqDdR6DIFq0xECrD7SL47_M1erdMjmwTRU_-ycpIUdEx4wrUz_mpiVdgRxq4LuqsbwxeJy8XyJVl21ty_8Neben2B6sj6rrwKoPS0N-MtnO7-gIb4iCrPINkl3mjV9-hRrp-ToTl34Ai1wDxreOccpz49wKWPRQ0ypa0-irST2WFzawmBJ1mhpOkGrBmUGqzKSr7FeA87Mve584A_59_DkYf0ByFMxasrVDgHRsEBGDkkaqOCcRR2GUElfEMi5QUtZkJJXsA46Yoft5C0jIMXBxti7I8aqdNgPmUaxcNDyNBexiSjGXPnewJxm6_QuqYtF3KMY0OJg'; // access_token từ bước 1
const AccountApi = {};

// Lấy thông tin trường của mô hình Accounts
AccountApi.getFields = async () => {
    try {
        const response = await fetch('http://192.168.1.22/suitecrm7/Api/V8/meta/fields/Accounts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi trong AccountApi:', error);
        throw error;
    }
};

export default AccountApi;
