/**
 * Xử lý logic gộp dữ liệu sản phẩm vừa quét được vào danh sách lineitems hiện tại
 * 
 * @param {Array} currentLineItems - Danh sách lineitems_data hiện có
 * @param {Object} scannedProduct - Dữ liệu sản phẩm trả về từ API
 * @param {number} inputQty - Số lượng xuất do người dùng nhập
 * @returns {Array} Danh sách lineitems_data mới
 */
export const mergeScannedProduct = (currentLineItems, scannedProduct, inputQty) => {
    const qty = parseFloat(inputQty) || 0;
    if (qty <= 0) return currentLineItems;

    let newItems = Array.isArray(currentLineItems) ? [...currentLineItems] : [];
    
    // API thường trả về data đã map theo cấu hình, hoặc raw field names
    const productId = scannedProduct.product_id || scannedProduct.id || '';
    const procurmentInventoryId = scannedProduct.procurment_inventory_id || '';
    
    // Tìm xem sản phẩm đã có trong list chưa (cùng product_id và procurment_inventory_id)
    const existingIndex = newItems.findIndex(item => 
        item.product_id === productId && 
        item.procurment_inventory_id === procurmentInventoryId
    );

    if (existingIndex >= 0) {
        // Cập nhật số lượng
        const existingItem = newItems[existingIndex];
        const oldQty = parseFloat(existingItem.qty) || 0;
        const newQty = oldQty + qty;
        const price = parseFloat(existingItem.price) || 0;
        
        newItems[existingIndex] = {
            ...existingItem,
            qty: newQty,
            total_amount: newQty * price
        };
    } else {
        // Thêm mới
        const price = parseFloat(scannedProduct.price) || 0;
        const newItem = {
            no: newItems.length + 1,
            product_id: productId,
            name: scannedProduct.name || '',
            code_name: scannedProduct.code_name || scannedProduct.part_number || '',
            uom: scannedProduct.uom || '',
            qty: qty,
            price: price,
            inventory_qty: scannedProduct.inventory_qty || scannedProduct.qty_cansell || 0,
            total_amount: qty * price,
            procurment_inventory_id: procurmentInventoryId
        };
        newItems.push(newItem);
    }
    
    // Cập nhật lại số thứ tự (no)
    return newItems.map((item, index) => ({
        ...item,
        no: index + 1
    }));
};
