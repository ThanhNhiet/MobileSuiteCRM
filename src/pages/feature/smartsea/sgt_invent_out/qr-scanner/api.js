import axiosInstance from '../../../../../configs/AxiosConfig';
import { searchModuleByKeywordApi_noAssignedUser } from '../../../../../services/api/module/ModuleApi';

/**
 * Tìm kiếm sản phẩm tồn kho dựa trên từ khóa quét mã vạch và ID kho
 * 
 * @param {string} keyword - Từ khóa quét được từ mã vạch (vd: part_number)
 * @param {string} warehouseId - ID của kho xuất (sgt_warehouse_id_c)
 * @returns {Promise<object>} Dữ liệu sản phẩm trả về từ API
 */
export const searchProductByBarcode = async (keyword, warehouseId) => {
    try {
        if (!warehouseId) {
            throw new Error('Vui lòng chọn Kho xuất trước khi quét mã vạch!');
        }

        const endpoint = `/Api/V8/custom/sgt_invent_out/procurment_inventory_data?keyword=${encodeURIComponent(keyword)}&wh_id=${encodeURIComponent(warehouseId)}`;
        const response = await axiosInstance.get(endpoint);

        if (response && response.data) {
            // API thường trả về dạng { success: true, data: [...] } hoặc trả thẳng mảng
            let data = response.data;
            if (data.data) {
                data = data.data; // Trường hợp bọc trong data.data
            }

            let inventoryData = null;
            if (Array.isArray(data)) {
                if (data.length === 0) {
                    throw new Error('Không tìm thấy sản phẩm trong kho này.');
                }
                inventoryData = data[0];
            } else {
                inventoryData = data;
            }

            // Lấy thêm thông tin chi tiết sản phẩm (name, part_number, uom, price)
            const productResponse = await searchModuleByKeywordApi_noAssignedUser('AOS_Products', keyword, 1, 'id,name,part_number,uom,price,impa');

            let productData = null;
            if (productResponse && productResponse.data && productResponse.data.length > 0) {
                productData = productResponse.data[0];
            } else {
                throw new Error('Không tìm thấy chi tiết sản phẩm trong hệ thống (AOS_Products).');
            }

            // Parse số lượng tồn
            let inventoryQty = 0;
            if (Array.isArray(inventoryData.sgt_procurment_inventory_qty_cansell)) {
                inventoryQty = inventoryData.sgt_procurment_inventory_qty_cansell[0];
            } else {
                inventoryQty = inventoryData.sgt_procurment_inventory_qty_cansell || inventoryData.qty_cansell || 0;
            }

            // Combine dữ liệu
            return {
                id: productData.id,
                name: productData.name,
                part_number: productData.part_number,
                impa: productData.impa,
                uom: productData.uom,
                price: productData.price,
                procurment_inventory_id: inventoryData.sgt_procurment_inventory_id,
                inventory_qty: inventoryQty
            };
        }

        throw new Error('Định dạng dữ liệu trả về không hợp lệ.');
    } catch (error) {
        console.error('Lỗi khi tìm sản phẩm qua mã vạch:', error);
        throw error.response?.data?.message || error.message || 'Không thể tìm thấy sản phẩm từ hệ thống.';
    }
};
