const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJiODgxZmI3Yi1hZTE0LWE0OGMtZGE2MC02ODYyYWNkZTRiNTQiLCJqdGkiOiI5Njg0NTJiZTA4MzU3MWQ4MzUzNWY4YzlkZjMzMzQ4NDA0ZjZiMzA1MWE1MTU4ZjA0MmY1YjA2N2M1MTg4OGU1ZjhlMWNiMmQ5ZDY4NGI0MCIsImlhdCI6MTc1MjQ3NzAwMS44NDg0NTcsIm5iZiI6MTc1MjQ3NzAwMS44NDg0NjYsImV4cCI6MTc1MjQ4MDU5NC40MzMxMTIsInN1YiI6IjEiLCJzY29wZXMiOltdfQ.Sa5lYkisK1kmCiNYBQGSRyRR1TKhE0xN_BsUsSDpo5A2WY-oPker4j6kdFOeK_hnjlG6OUOPzvzLBhTqoPPqSgUZ3OaNQ0yxwpI11PrgmRfQJrYI6lXFregFpbhUehcTflch9nhuu_0gy5yT4gLe8ZSq_y_I5qNSSOWoW9SM-dSAeFNX2jHy5NZHeNBj31mVnpQtpOYTjaDmpFXVG19WOXaokBW_EUb-p2GIJsw8kjmSOeYjXa_QBR_qSsBOwSEyJi2Nk-TTS-cZfAToHDTOHCSCGmEaiP5MUmM_CugbgKSF_D7tDjKDCtWx0YQ6eSUgJQwmS1Wyr3jzij1z-0JnvA'; // access_token từ bước 1
const AccountApi = {};

// Lấy thông tin trường của mô hình Accounts
AccountApi.getFields = async () => {
    try {
        const response = await fetch('http://192.168.225.55/suitecrm7/Api/V8/meta/fields/Accounts', {
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
