import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Button, View } from "react-native";

export default function ExportPdfScreen() {
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Roboto, "Segoe UI", Arial; padding: 24px; }
          h1 { text-align:center; margin-bottom: 8px; }
          .meta { color:#666; font-size:12px; text-align:center; margin-bottom: 24px; }
          table { width:100%; border-collapse: collapse; }
          th, td { border:1px solid #ddd; padding:8px; font-size: 13px; }
          th { background:#f3f4f6; text-align:left; }
          .footer { margin-top:24px; font-size:12px; color:#888; text-align:center; }
        </style>
      </head>
      <body>
        <h1>BÁO CÁO DANH SÁCH</h1>
        <div class="meta">Xuất PDF từ React Native (Expo)</div>
        <table>
          <thead><tr><th>#</th><th>Tên</th><th>Ghi chú</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Nguyễn Văn A</td><td>Khách VIP</td></tr>
            <tr><td>2</td><td>Trần Thị B</td><td>Đã liên hệ</td></tr>
          </tbody>
        </table>
        <div class="footer">© 2025 Your App</div>
      </body>
    </html>
  `;

  const onExport = async () => {
    try {
      // tạo file PDF tạm
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      // chia sẻ/mở file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Đã tạo PDF", uri);
      }
    } catch (e) {
      Alert.alert("Lỗi xuất PDF", e?.message ?? String(e));
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Button title="Xuất PDF" onPress={onExport} />
    </View>
  );
}
