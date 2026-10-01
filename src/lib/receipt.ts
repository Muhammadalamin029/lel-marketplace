import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { paymentsApi } from "@/api";

async function sharePdfFile(pdfUri: string, safeName: string): Promise<boolean> {
  const canShare = await Sharing.isAvailableAsync().catch(() => false);
  if (!canShare) return false;
  try {
    await Sharing.shareAsync(pdfUri, {
      mimeType: "application/pdf",
      dialogTitle: `Receipt ${safeName}`,
      ...(Platform.OS === "ios" ? { UTI: "com.adobe.pdf" } : {}),
    });
    return true;
  } catch (e) {
    // iOS: surface the real error. Android: fall through to print dialog.
    if (Platform.OS === "ios") throw e;
    return false;
  }
}

/**
 * Download a payment receipt as a PDF.
 *
 * Primary path: server-generated vector PDF (`GET /payments/:id/receipt.pdf`)
 * — byte-identical to web and emailed receipts. Fallback: render the receipt
 * HTML with expo-print (native vector print) if the binary download fails.
 *
 * iOS: render with expo-print and open the native share sheet.
 * Android: the printed file is first copied to a guaranteed `.pdf` name
 * (the raw print output has no extension, which makes Android's share
 * intent fail to resolve a viewer). If sharing still fails, fall back to
 * the system print dialog where the user can "Save as PDF" to Downloads.
 */
export async function downloadReceipt(paymentId: string, receiptNumber?: string): Promise<void> {
  const safeName = (receiptNumber || `receipt-${paymentId}`).replace(/[^A-Za-z0-9._-]/g, "_");

  // Primary: server vector PDF.
  try {
    const bytes = await paymentsApi.getReceiptPdf(paymentId);
    const dest = new File(Paths.cache, `${safeName}.pdf`);
    const writer = dest.writableStream().getWriter();
    await writer.write(new Uint8Array(bytes));
    await writer.close();
    if (await sharePdfFile(dest.uri, safeName)) return;
  } catch {
    // Fall through to the expo-print fallback below.
  }

  // Fallback: native print of the receipt HTML.
  const html = await paymentsApi.getReceiptHtml(paymentId);
  if (!html) throw new Error("Could not load receipt. Please try again.");

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

  if (await sharePdfFile(pdfUri, safeName)) return;

  if (Platform.OS === "android") {
    // Last resort: system print dialog → user picks "Save as PDF" → Downloads.
    await Print.printAsync({ html });
    return;
  }

  throw new Error(`Receipt saved to ${pdfUri}`);
}
