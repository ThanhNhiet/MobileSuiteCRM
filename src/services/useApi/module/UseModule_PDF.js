import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { getAosProductsQuotesApi } from "../../api/module/ModuleApi";

const toNum = (v) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};
const fmtMoney = (n) => `$${n.toFixed(2)}`;

export const useModule_PDF = (quoteId) => {
  const [items, setItems] = useState([]);
  const [exporting, setExporting] = useState(false);
  const sharingBusyRef = useRef(false);

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
          <td><div>${qty}</div><div class="muted">${qty}</div></td>
          <td><span class="product">${it.name ?? ""}</span></td>
          <td class="num nowrap">${fmtMoney(list)}</td>
          <td class="num nowrap">${discount ? fmtMoney(discount) : "-"}</td>
          <td class="num">${taxPct}%</td>
          <td class="num nowrap">${fmtMoney(taxAmt)}</td>
          <td class="num nowrap">${fmtMoney(total)}</td>
        </tr>
      `;
    }).join("");

    const totals = items.reduce(
      (acc, it) => {
        acc.total += toNum(it.product_list_price);
        acc.discount += toNum(it.product_discount);
        acc.subtotal += toNum(it.product_total_price);
        acc.tax += toNum(it.vat_amt);
        return acc;
      },
      { total: 0, discount: 0, subtotal: 0, tax: 0 }
    );
    const grand = totals.subtotal + totals.tax;

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
.card{background:#f7f7f9;border-radius:12px;padding:16px}
.grid{display:grid;grid-template-columns: 1fr 260px;gap:16px;align-items:start}
/* Bảng trái */
table.items{width:100%; border-collapse:collapse;}
.items thead th{
  font-weight:600;color:#374151;font-size:12px;padding:10px 6px;text-align:left;border-bottom:1px solid #e5e7eb
}
.items tbody td{
  font-size:13px;padding:8px 6px;vertical-align:top;border-top:1px solid #e5e7eb
}
.num{text-align:right;white-space:nowrap}
.muted{color:#6b7280;font-size:12px;line-height:1.2}
.product{color:#ef4444;text-decoration:none}
.nowrap{white-space:nowrap}
/* Summary phải */
.summary{width:100%;font-size:13px}
.summary .line{display:grid;grid-template-columns:auto 1fr;gap:16px;padding:4px 0}
.summary .label{color:#374151}
.summary .value{text-align:right;white-space:nowrap}
.summary .grand{font-weight:700}
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="grid">

        <table class="items">
          <thead>
            <tr>
              <th></th>
              <th>Group Name:<br><span class="muted">Quantity</span></th>
              <th>Product</th>
              <th>List</th>
              <th>Discount</th>
              <th>Tax</th>
              <th>Tax Amount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="8" class="muted">Không có dữ liệu sản phẩm</td></tr>`}
          </tbody>
        </table>

        <div class="summary">
          <div class="line"><div class="label">Total:</div>     <div class="value">${fmtMoney(totals.total)}</div></div>
          <div class="line"><div class="label">Discount:</div>  <div class="value">${fmtMoney(totals.discount)}</div></div>
          <div class="line"><div class="label">Subtotal:</div>  <div class="value">${fmtMoney(totals.subtotal)}</div></div>
          <div class="line"><div class="label">Tax:</div>       <div class="value">${fmtMoney(totals.tax)}</div></div>
          <div class="line grand"><div class="label">Grand Total:</div><div class="value">${fmtMoney(grand)}</div></div>
        </div>

      </div>
    </div>
  </div>
</body>
</html>`;
  }, [items]);

  // onExport: no-op nếu chưa đúng module (quoteId=null) hoặc đang bận
  const onExport = useCallback(async () => {
    if (!quoteId) return;                 // không làm gì khi không phải AOS_Quotes
    if (exporting || sharingBusyRef.current) return;

    try {
      setExporting(true);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Đã tạo PDF", uri);
        return;
      }
      sharingBusyRef.current = true;
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("Lỗi xuất PDF", e?.message ?? String(e));
    } finally {
      sharingBusyRef.current = false;
      setExporting(false);
    }
  }, [quoteId, html, exporting]);

  return { onExport, exporting, items };
};
