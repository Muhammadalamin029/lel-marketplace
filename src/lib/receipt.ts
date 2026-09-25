import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { paymentsApi } from "@/api";

/**
 * Download a payment receipt as a PDF, mirroring web's downloadReceipt
 * (GET /payments/:id/receipt/html → PDF).
 *
 * iOS: render with expo-print and open the native share sheet.
 * Android: the printed file is first copied to a guaranteed `.pdf` name
 * (the raw print output has no extension, which makes Android's share
 * intent fail to resolve a viewer). If sharing still fails, fall back to
 * the system print dialog where the user can "Save as PDF" to Downloads.
 */
export async function downloadReceipt(paymentId: string, receiptNumber?: string): Promise<void> {
  const html = await paymentsApi.getReceiptHtml(paymentId);
  if (!html) throw new Error("Could not load receipt. Please try again.");

  const safeName = (receiptNumber || `receipt-${paymentId}`).replace(/[^A-Za-z0-9._-]/g, "_");
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (!uri) throw new Error("Could not generate receipt. Please try again.");

  // Guarantee a .pdf filename — Android cannot share/route extensionless files.
  let pdfUri = uri;
  try {
    const dest = new File(Paths.cache, `${safeName}.pdf`);
    const bytes = await new File(uri).arrayBuffer();
    const writer = dest.writableStream().getWriter();
    await writer.write(new Uint8Array(bytes));
    await writer.close();
    pdfUri = dest.uri;
  } catch {
    // If the copy fails, fall through with the original URI.
  }

  const canShare = await Sharing.isAvailableAsync().catch(() => false);
  if (canShare) {
    try {
      await Sharing.shareAsync(pdfUri, {
        mimeType: "application/pdf",
        dialogTitle: `Receipt ${safeName}`,
        ...(Platform.OS === "ios" ? { UTI: "com.adobe.pdf" } : {}),
      });
      return;
    } catch (e) {
      // iOS: surface the real error. Android: fall through to print dialog.
      if (Platform.OS === "ios") throw e;
    }
  }

  if (Platform.OS === "android") {
    // Last resort: system print dialog → user picks "Save as PDF" → Downloads.
    await Print.printAsync({ html });
    return;
  }

  throw new Error(`Receipt saved to ${pdfUri}`);
}
