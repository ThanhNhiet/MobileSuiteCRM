import AccountApi from "../api/AccountApi";

const AccountData = {};

AccountData.getFields = async () => {
    const fields = await AccountApi.getFields();

    if (!fields || !fields.data) {
        return null;
    }

    const attributes = fields.data.attributes;

    const requiredFields = Object.entries(attributes || {})
  .filter(([_, val]) => val.required === true) // chỉ field required
  .map(([key, val]) => {
    const { required, ...rest } = val; // loại bỏ 'required'
    return {
      key,
      ...rest
    };
  });
    // Chỉ lấy các trường bắt buộc
    return requiredFields;
};

export default AccountData;
