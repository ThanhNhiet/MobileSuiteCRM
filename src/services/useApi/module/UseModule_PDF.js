import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  getAosProductsQuotesApi,
  getAosProductsQuotesLangApi,
} from "../../api/module/ModuleApi";

/* -------------------- helpers -------------------- */
const toNum = (v) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
};
const fmtMoney = (n) => `$${n.toFixed(2)}`;
const random3 = () =>
  Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join("");
const slugify = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 64);


export const useModule_PDF = (args) => {
  const {
    quoteId = null,
    record = null,
    detailFields = [],
    getFieldValue = null,
    lang = "vi_VN",
    moduleName = "AOS_Quotes",
  } = args || {};

  const [items, setItems] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [rowsRecord, setRowsRecord] = useState([]);
  const [language, setLanguage] = useState([]);
  const sharingBusyRef = useRef(false);

  const headerKeys = [
    "product_qty",
    "name",
    "product_list_price",
    "product_discount",
    "vat",
    "vat_amt",
    "product_total_price",
  ];

  /* -------- fetch line items -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!quoteId) {
        if (alive) setItems([]);
        return;
      }
      try {
        const data = await getAosProductsQuotesApi(moduleName, quoteId);
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
        if (alive) setItems(mapped);
      } catch {
        if (alive) {
          setItems([]);
          Alert.alert("Error", "Failed to fetch AOS Products Quotes");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [quoteId]);

  /* -------- fetch language labels -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!lang) return;
        const data = await getAosProductsQuotesLangApi(lang);
        const mod = data?.data?.mod_strings || {};
        const languageData = headerKeys.map((k) => {
          const L = `LBL_${k.toUpperCase()}`;
          return { key: k, label: mod[L] || k };
        });
        if (alive) setLanguage(languageData);
      } catch {
        if (alive) {
          setLanguage([]);
          Alert.alert("Error", "Failed to fetch AOS Products Quotes Language");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang]);

  /* -------- safe getter for detail fields -------- */
  const getValue = (key) => {
    if (!key) return "";
    if (typeof getFieldValue === "function") {
      try {
        const v = getFieldValue(key);
        if (v !== null && v !== undefined) return String(v);
      } catch {}
    }
    if (record && record[key] !== undefined && record[key] !== null) {
      return String(record[key]);
    }
    return ""; // không ép N/A
  };

  /* -------- build rowsRecord (thông tin đầu trang) -------- */
  useEffect(() => {
    const desiredOrder =
      lang === "vi_VN"
        ? ["name", "sales_stage", "opportunity", "expiration", "number", "invoice_status"]
        : ["name", "sales_stage", "opportunity", "expiration", "number", "invoice_status"];

    const rows =
      (desiredOrder || []).map((k) => {
        const f = (detailFields || []).find((x) => x.key === k);
        const label = f?.label || k;
        const val = getValue(k);
        return { key: k, label, value: val.trim() ? val : "N/A" };
      }) || [];

    setRowsRecord(rows);
  }, [detailFields, record, getFieldValue, lang, quoteId]);

  /* -------- HTML PDF -------- */
  const html = useMemo(() => {
    // body rows
    const rowsHtml = (items || [])
      .map((it, idx) => {
        const qty = toNum(it?.product_qty);
        const list = toNum(it?.product_list_price);
        const discount = toNum(it?.product_discount);
        const taxPct = toNum(it?.vat);
        const taxAmt = toNum(it?.vat_amt);
        const total = toNum(it?.product_total_price);
        return `
        <tr>
          <td class="num">${idx + 1}</td>
          <td class="num"><div class="muted">${qty}</div></td>
          <td><span class="product">${it?.name ?? ""}</span></td>
          <td class="num nowrap">${fmtMoney(list)}</td>
          <td class="num nowrap">${discount ? fmtMoney(discount) : "-"}</td>
          <td class="num">${taxPct}%</td>
          <td class="num nowrap">${fmtMoney(taxAmt)}</td>
          <td class="num nowrap">${fmtMoney(total)}</td>
        </tr>`;
      })
      .join("");

    // header (th)
    const labelsMap = Object.fromEntries(language.map((x) => [x.key, x.label]));
    const qtyLabel =
      labelsMap["product_qty"] || (lang === "vi_VN" ? "Số lượng" : "Quantity");
    const groupName =
      lang === "vi_VN" ? "Tên Nhóm" : "Group Name";

    const numberCols = new Set([
      "product_list_price",
      "product_discount",
      "sale_price",
      "vat",
      "vat_amt",
      "product_total_price",
    ]);

    const langHtmlField = headerKeys
      .map((k) => {
        if (k === "product_qty") {
          return `<th>${groupName}:<br><span class="muted">${qtyLabel}</span></th>`;
        }
        const label = labelsMap[k] || k;
        const klass = numberCols.has(k) ? ' class="num"' : "";
        return `<th${klass}>${label.replace(/\s+/g, "<br>")}</th>`;
      })
      .join("");

    // info (top card) – nhóm mỗi 3 field/khối
    const rowsHtmlRecord = (rowsRecord || [])
      .reduce((acc, it, idx) => {
        const block = `
          <div class="field">
            <div class="label">${it.label}:</div>
            <div class="value">${it.value}</div>
          </div>`;
        const g = Math.floor(idx / 3);
        acc[g] = (acc[g] || "") + block;
        return acc;
      }, [])
      .map((g) => `<div class="field-group">${g}</div>`)
      .join("");

    // totals
    const totals = (items || []).reduce(
      (acc, it) => {
        acc.total += toNum(it?.product_list_price);
        acc.discount += toNum(it?.product_discount);
        acc.subtotal += toNum(it?.product_total_price);
        acc.tax += toNum(it?.vat_amt);
        return acc;
      },
      { total: 0, discount: 0, subtotal: 0, tax: 0 }
    );
    const grand = totals.subtotal + totals.tax;

    const nameTitle = lang === "en_us" ? "Quote" : "Bảng báo giá";
    const labelTotal = lang === "en_us" ? "Total" : "Tổng";
    const labelDiscount = lang === "en_us" ? "Discount" : "Giảm giá";
    const labelSubtotal = lang === "en_us" ? "Subtotal" : "Tạm tính";
    const labelTax = lang === "en_us" ? "Tax" : "Thuế";
    const labelGrand = lang === "en_us" ? "Grand Total" : "Tổng cộng";

    return `
<!doctype html>
<html lang="${lang === "en_us" ? "en" : "vi"}">
<head>
<meta charset="utf-8" />
<title>${nameTitle}</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827}
.wrap{padding:24px}
.card{background:#f7f7f9;border-radius:12px;padding:16px;margin-bottom:24px}

/* info grid */
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.field{display:grid;grid-template-columns:140px 1fr;align-items:center;gap:12px;margin-bottom:12px}
.label{color:#374151;font-weight:600;font-size:14px;white-space:nowrap}
.value{min-height:32px;background:#f3f4f6;border-radius:8px;padding:6px 10px;font-size:14px;display:flex;align-items:center}

/* table + summary */
.grid{display:grid;grid-template-columns:1fr 260px;gap:16px;align-items:start}
table.items{width:100%;border-collapse:collapse}

/* header */
.items thead th{
  font-weight:600;color:#374151;font-size:12px;padding:6px 4px;text-align:center;
  vertical-align:middle;border-bottom:1px solid #e5e7eb;white-space:normal;word-break:break-word;
}
/* body */
.items tbody td{
  font-size:12px;padding:6px 4px;text-align:center;vertical-align:middle;border-top:1px solid #e5e7eb;
}
.items th.num,.items td.num{ text-align:right; white-space:nowrap; }
.muted{color:#6b7280;font-size:11px;line-height:1.2}
.product{color:#ef4444;text-decoration:none}
.nowrap{white-space:nowrap}

/* summary */
.summary-inline{display:flex;flex-direction:column;gap:8px;font-size:14px}
.summary-inline .item{width:100%;background:#f3f4f6;border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center}
.summary-inline .label{font-weight:600;color:#374151}
.summary-inline .value{white-space:nowrap}
.summary-inline .grand .value{font-weight:700}
</style>
</head>
<body>
  <h1 style="text-align:center;">${nameTitle}</h1>
  <div class="wrap">

    <div class="card">
      <div class="detail-grid">
        ${rowsHtmlRecord || `<div class="muted">Không có dữ liệu</div>`}
      </div>
    </div>

    <div class="card">
      <div class="grid">
        <table class="items">
          <thead>
            <tr>
              <th></th>
              ${langHtmlField}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="8" class="muted">Không có dữ liệu sản phẩm</td></tr>`}
          </tbody>
        </table>

        <div class="summary-inline">
          <div class="item"><span class="label">${labelTotal}:</span><span class="value">${fmtMoney(totals.total)}</span></div>
          <div class="item"><span class="label">${labelDiscount}:</span><span class="value">${fmtMoney(totals.discount)}</span></div>
          <div class="item"><span class="label">${labelSubtotal}:</span><span class="value">${fmtMoney(totals.subtotal)}</span></div>
          <div class="item"><span class="label">${labelTax}:</span><span class="value">${fmtMoney(totals.tax)}</span></div>
          <div class="item grand"><span class="label">${labelGrand}:</span><span class="value">${fmtMoney(grand)}</span></div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
  }, [items, rowsRecord, language, lang]);

  /* -------- export -------- */
  const onExport = useCallback(async () => {
    if (!quoteId || exporting || sharingBusyRef.current) return;
    try {
      setExporting(true);
      const { uri: tmpUri } = await Print.printToFileAsync({ html });
      const now = new Date();
      const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}${String(now.getDate()).padStart(2, "0")}`;
      const fname = `${slugify(record?.name || "Quote")}_${ymd}_${random3()}.pdf`;
      const destUri =
        (FileSystem.documentDirectory ?? FileSystem.cacheDirectory) + fname;

      try {
        await FileSystem.deleteAsync(destUri);
      } catch {}
      await FileSystem.copyAsync({ from: tmpUri, to: destUri });
      try {
        await FileSystem.deleteAsync(tmpUri);
      } catch {}

      await Sharing.shareAsync(destUri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: fname,
      });
    } catch (e) {
      Alert.alert("Lỗi xuất PDF", e?.message ?? String(e));
    } finally {
      sharingBusyRef.current = false;
      setExporting(false);
    }
  }, [quoteId, html, exporting, record?.name]);

  return { onExport, exporting, items, html };
};

