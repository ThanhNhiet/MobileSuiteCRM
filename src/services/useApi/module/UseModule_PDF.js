import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { getAosProductsQuotesApi, getAosProductsQuotesLangApi } from "../../api/module/ModuleApi";

const toNum = (v) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};
const fmtMoney = (n) => `$${n.toFixed(2)}`;

function random3Numbers() {
  const nums = [];
  for (let i = 0; i < 3; i++) {
    nums.push(Math.floor(Math.random() * 10)); 
  }
  return nums;
}


export const useModule_PDF = ({quoteId,record,detailFields,getFieldValue,lang}) => {
  const [items, setItems] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [rowsRecord, setRowsRecord] = useState([]);
  const [language, setLanguage] = useState([]);
  const sharingBusyRef = useRef(false);
  const rowName = ['product_qty','name','product_list_price','product_discount','vat','vat_amt','product_total_price'];

  // Chỉ fetch khi có quoteId hợp lệ
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!quoteId) { setItems([]); return; }
      try {
        const data = await getAosProductsQuotesApi(quoteId);
        const list = Array.isArray(data?.data) ? data.data : [];
        const mapped = list.map((it) => ({
          name: it.attributes?.name,
          product_qty: it.attributes?.product_qty,
          product_list_price: it.attributes?.product_list_price,
          product_discount: it.attributes?.product_discount,
          vat: it.attributes?.vat,
          vat_amt: it.attributes?.vat_amt,
          product_total_price: it.attributes?.product_total_price,
        }));
        if (isMounted) setItems(mapped);
      } catch (e) {
        if (isMounted) {
          setItems([]);
          Alert.alert("Error", "Failed to fetch AOS Products Quotes");
        }
      }
    };
    run();
    return () => { isMounted = false; };
  }, [quoteId]);

  // language
    useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        if (!lang) return;
        const data = await getAosProductsQuotesLangApi(lang);
        if (!data || !data.data.mod_strings) return;

        const mod_strings = data.data.mod_strings;

        // ✅ map trả về mảng mới
        const languageData = rowName.map((item) => {
          const label = `LBL_${item.toUpperCase()}`;
          return { key: item, label: mod_strings[label] || item };
        });

        if (isMounted) setLanguage(languageData);
      } catch (e) {
        if (isMounted) {
          setLanguage([]);
          Alert.alert("Error", "Failed to fetch AOS Products Quotes Language");
        }
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [lang]);

  useEffect(() => {
      if (!Array.isArray(detailFields) || !getFieldValue) return;

      const rowsRecord = detailFields
        .filter((field) =>
          ["name", "number", "expiration", "opportunity", "stage", "invoice_status"].includes(field.key)
        )
        .map((field) => ({
          label: field.label,
          value: getFieldValue(field.key) ?? "",
        }));
       setRowsRecord(rowsRecord);
    }, [detailFields, getFieldValue]);

  const html = useMemo(() => {
    const rowsHtml = items.map((it, idx) => {
      const qty = toNum(it.product_qty);
      const list = toNum(it.product_list_price);
      const discount = toNum(it.product_discount);
      const taxPct = toNum(it.vat);
      const taxAmt = toNum(it.vat_amt);
      const total = toNum(it.product_total_price);
      return `
        <tr>
          <td class="num">${idx + 1}</td>
          <td><div class="muted">${qty}</div></td>
          <td><span class="product">${it.name ?? ""}</span></td>
          <td class="num nowrap">${fmtMoney(list)}</td>
          <td class="num nowrap">${discount ? fmtMoney(discount) : "-"}</td>
          <td class="num">${taxPct}%</td>
          <td class="num nowrap">${fmtMoney(taxAmt)}</td>
          <td class="num nowrap">${fmtMoney(total)}</td>
        </tr>
      `;
    }).join("");

    const numberCols = [
      "product_list_price",
      "product_discount",
      "sale_price",
      "vat",
      "vat_amt",
      "product_total_price",
    ];

    const langHtmlField = language.map((item) => {
      if (item.key === "product_qty") {
        // Cột số lượng có 2 dòng
        if (lang === "en_us") {
          return `<th>Group Name:<br><span class="muted">${item.label}</span></th>`;
        } else if (lang === "vi_VN") {
          return `<th>Tên Nhóm:<br><span class="muted">${item.label}</span></th>`;
        }
      }

      // Các cột số thì gắn class num + có thể xuống dòng
      if (numberCols.includes(item.key)) {
        return `<th class="num">${item.label.replace(/\s+/g, "<br>")}</th>`;
      }

      // Các cột chữ bình thường
      return `<th>${item.label.replace(/\s+/g, "<br>")}</th>`;
    }).join("");

      const rowsHtmlRecord = rowsRecord.reduce((acc, it, idx) => {
      // render field như bình thường
      const fieldHtml = `
        <div class="field">
          <div class="label">${it.label}:</div>
          <div class="value">${it.value}</div>
        </div>
      `;
      // lấy index nhóm (0,1,2,...)
      const groupIndex = Math.floor(idx / 3);
      if (!acc[groupIndex]) acc[groupIndex] = ""; 
      acc[groupIndex] += fieldHtml;
      return acc;
    }, [])
    .map(groupHtml => `<div>${groupHtml}</div>`)
    .join("");


    

    // Tính tổng các cột
    const totals = items.reduce(
      (acc, it) => {
        if (lang === "vi_VN") {
          acc.total += toNum(it.product_list_price);
          acc.labelTotal = "Tổng";
          acc.discount += toNum(it.product_discount);
          acc.labelDiscount = "Giảm giá";
          acc.subtotal += toNum(it.product_total_price);
          acc.labelSubtotal = "Tạm tính";
          acc.tax += toNum(it.vat_amt);
          acc.labelTax = "Thuế";
          return acc;
        } else if (lang === "en_us") {
          acc.total += toNum(it.product_list_price);
          acc.labelTotal = "Total";
          acc.discount += toNum(it.product_discount);
          acc.labelDiscount = "Discount";
          acc.subtotal += toNum(it.product_total_price);
          acc.labelSubtotal = "Subtotal";
          acc.tax += toNum(it.vat_amt);
          acc.labelTax = "Tax";
          return acc;
        }
      },
      { total: 0, discount: 0, subtotal: 0, tax: 0 }
    );
    const grand = totals.subtotal + totals.tax;
    let labelGrand = "";
    let Name = '';
    if (lang === "vi_VN") {
     labelGrand = "Tổng cộng";
     Name = 'Bảng báo giá';
    } else if (lang === "en_us") {
     labelGrand = "Grand Total";
      Name = 'Quote';
    }
    return `
  <!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Bảng báo giá</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827}
.wrap{padding:24px}
.card{background:#f7f7f9;border-radius:12px;padding:16px;margin-bottom:24px}

/* Grid thông tin chi tiết */
.detail-grid{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:24px;
}
.field{
  display:grid;
  grid-template-columns: 140px 1fr;
  align-items:center;
  gap:12px;
  margin-bottom:12px;
}
.label{color:#374151;font-weight:600;font-size:14px;white-space:nowrap}
.value{
  min-height:32px;
  background:#f3f4f6;
  border-radius:8px;
  padding:6px 10px;
  font-size:14px;
  display:flex;
  align-items:center;
}

/* Bảng sản phẩm */
.grid{display:grid;grid-template-columns:1fr 260px;gap:16px;align-items:start}
table.items{width:100%;border-collapse:collapse}

/* Header bảng */
.items thead th {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
  padding: 6px 4px;
  text-align: center;       /* căn giữa ngang */
  vertical-align: middle;   /* căn giữa dọc */
  border-bottom: 1px solid #e5e7eb;

}

/* Nội dung bảng */
.items tbody td {
  font-size: 12px;
  padding: 6px 4px;
  text-align: center;       /* căn giữa ngang */
  vertical-align: middle;   /* căn giữa dọc */
  border-top: 1px solid #e5e7eb;
}

/* Các cột số: căn phải nếu cần giữ thẳng hàng */
.items th.num,
.items td.num {
  text-align: right;        /* căn phải cho số */
  vertical-align: middle;
  white-space: nowrap;
}



/* Summary phải */
.summary-inline {
  display: flex;
  flex-direction: column; /* xếp dọc từng item */
  gap: 8px;               /* khoảng cách giữa các item */
  font-size: 14px;
}

.summary-inline .item {
  width: 100%;                                /* chiếm hết chiều ngang */
  background: #f3f4f6;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;             /* label trái, value phải */
  align-items: center;
}

.summary-inline .label {
  font-weight: 600;
  color: #374151;
}

.summary-inline .value {
  white-space: nowrap;
}

.summary-inline .grand .value {
  font-weight: 700;
}


</style>
</head>
<body>
  <h1 style="text-align:center;">${Name}</h1>
<div class="wrap">
  <!-- Block thông tin chung -->
  <div class="card">
    <div class="detail-grid">
        ${rowsHtmlRecord || `<div class="muted">Không có dữ liệu</div>`}
  </div>
  </div>
  <!-- Block bảng sản phẩm -->
  <div class="card">
    <div class="grid">
      <table class="items">
        <thead>
          <tr>
            <th></th>
            ${langHtmlField || `<th>Không có dữ liệu</th>`}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="8" class="muted">Không có dữ liệu sản phẩm</td></tr>`}
        </tbody>
      </table>

     <div class="summary-inline">
      <div class="item">
        <span class="label">${totals.labelTotal}:</span>
        <span class="value">$${totals.total}.00</span>
      </div>
      <div class="item">
        <span class="label">${totals.labelDiscount}:</span>
        <span class="value">$${totals.discount}.00</span>
      </div>
      <div class="item">
        <span class="label">${totals.labelSubtotal}:</span>
        <span class="value">$${totals.subtotal}.00</span>
      </div>
      <div class="item">
        <span class="label">${totals.labelTax}:</span>
        <span class="value">$${totals.tax}</span>
      </div>
      <div class="item grand">
        <span class="label">${labelGrand}:</span>
        <span class="value">$${grand}.00</span>
      </div>
    </div>
  </div>
  </div>
  </body>
  </html>`;
  }, [items,record]);


  // onExport: no-op nếu chưa đúng module (quoteId=null) hoặc đang bận
    const onExport = useCallback(async () => {
    if (!quoteId || exporting || sharingBusyRef.current) return;
    try {
      setExporting(true);

      // 1) Tạo PDF (Expo lưu ở cache, tên ngẫu nhiên)
      const { uri: tmpUri } = await Print.printToFileAsync({ html }); // lưu ở cacheDirectory

      // 2) Đổi tên: copy sang documentDirectory với tên bạn muốn
      const now = new Date();
      const ts =
        `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_`;
      const fileName = `${record?.name.replace(/\s+/g, "")}_${ts}_${random3Numbers().join("")}.pdf`;
      const destUri = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory) + fileName;

      try { await FileSystem.deleteAsync(destUri); } catch {}
      await FileSystem.copyAsync({ from: tmpUri, to: destUri });
      // (tuỳ thích) xoá file tạm
      try { await FileSystem.deleteAsync(tmpUri); } catch {}

      // 3) Share với tên đẹp
      await Sharing.shareAsync(destUri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",       // iOS
        dialogTitle: fileName,      // Android
      });
    } catch (e) {
      Alert.alert("Lỗi xuất PDF", e?.message ?? String(e));
    } finally {
      sharingBusyRef.current = false;
      setExporting(false);
    }
  }, [quoteId, html, exporting]);

  return { onExport, exporting, items, record };
};
