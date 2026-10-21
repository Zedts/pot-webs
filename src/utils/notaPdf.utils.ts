import { jsPDF } from "jspdf";
import { PengirimanModel, PenerimaanModel } from "@/types/pengiriman";
import { formatJakartaDate, formatJakartaTime, formatJakartaDateTime, formatRupiah } from "@/utils/shift.utils";

/**
 * Loads an external image URL and converts it to a base64 data URL for jsPDF embedding.
 * Gracefully returns null if network fails, CORS blocks, or URL is invalid.
 */
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generates an official Delivery Order (Surat Jalan / DO) PDF receipt using jsPDF
 * and triggers immediate client-side download.
 */
export async function generateNotaPengirimanPdf(
  pengiriman: PengirimanModel,
  penerimaan?: PenerimaanModel | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. Header Banner
  doc.setFillColor(24, 49, 78); // #18314E
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SURAT JALAN / DELIVERY ORDER (DO)", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 215, 235);
  doc.text("Presensi Oleh² Turki (POT) • Logistik & Distribusi Produk", margin, 19);

  // DO Number & Status on Top Right
  const doNumber = pengiriman.unique_id || `#PG-${pengiriman.id.slice(-6).toUpperCase()}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(doNumber, pageWidth - margin, 12, { align: "right" });

  const statusLabel = pengiriman.status.toUpperCase().replace("_", " ");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 225, 120);
  doc.text(`STATUS: ${statusLabel}`, pageWidth - margin, 19, { align: "right" });

  let cursorY = 36;

  // 2. Transfer Antar Lapak Banner (if applicable)
  if (pengiriman.asal_lapak) {
    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.setDrawColor(199, 210, 254); // Indigo 200
    doc.roundedRect(margin, cursorY, contentWidth, 9, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202); // Indigo 700
    doc.text(
      `TRANSFER ANTAR LAPAK: Dari "${pengiriman.asal_lapak.nama}" ke "${pengiriman.lapak?.nama || "-"}"`,
      margin + 4,
      cursorY + 6
    );
    cursorY += 14;
  }

  // 3. Metadata Cards (2 Columns)
  const colWidth = (contentWidth - 6) / 2;
  const cardHeight = 36;

  // Left Box: Informasi Tujuan & Pengiriman
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, colWidth, cardHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("INFORMASI TUJUAN PENGIRIMAN", margin + 4, cursorY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(pengiriman.lapak?.nama || "Lapak Tujuan", margin + 4, cursorY + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Lokasi: ${pengiriman.lapak?.lokasi || "-"}`, margin + 4, cursorY + 19);
  doc.text(
    `Asal: ${pengiriman.asal_lapak ? pengiriman.asal_lapak.nama : "Gudang Pusat"}`,
    margin + 4,
    cursorY + 25
  );
  doc.text(
    `SPG Bertugas: ${penerimaan?.spg?.nama || pengiriman.lapak?.spg?.nama || "-"}`,
    margin + 4,
    cursorY + 31
  );

  // Right Box: Dokumen & Ekspedisi
  const rightColX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX, cursorY, colWidth, cardHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("INFORMASI DOKUMEN & KURIR", rightColX + 4, cursorY + 6);

  const rawDate = pengiriman.tanggal || pengiriman.createdAt;
  const dateStr = rawDate ? formatJakartaDate(rawDate) : "-";
  const timeStr = rawDate ? `${formatJakartaTime(rawDate)} WIB` : "-";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tanggal Kirim: ${dateStr} • ${timeStr}`, rightColX + 4, cursorY + 13);
  doc.text(`Petugas Pengirim: ${pengiriman.pengirim?.nama || "-"}`, rightColX + 4, cursorY + 19);
  doc.text(
    `Kontak Pengirim: ${pengiriman.pengirim?.no_hp || pengiriman.pengirim?.username || "-"}`,
    rightColX + 4,
    cursorY + 25
  );
  doc.text(`Pembuat Dokumen: ${pengiriman.creator?.nama || "Admin"}`, rightColX + 4, cursorY + 31);

  cursorY += cardHeight + 8;

  // 4. Products Table Header
  const colX = {
    no: margin,
    name: margin + 10,
    kategori: margin + 75,
    qty: margin + 115,
    harga: margin + 145,
    total: margin + 182,
  };

  doc.setFillColor(24, 49, 78);
  doc.rect(margin, cursorY, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("NO", colX.no + 3, cursorY + 5.5);
  doc.text("NAMA PRODUK", colX.name, cursorY + 5.5);
  doc.text("KATEGORI", colX.kategori, cursorY + 5.5);
  doc.text("JUMLAH", colX.qty, cursorY + 5.5, { align: "right" });
  doc.text("HARGA", colX.harga, cursorY + 5.5, { align: "right" });
  doc.text("SUBTOTAL", colX.total, cursorY + 5.5, { align: "right" });

  cursorY += 8;

  // 5. Products Table Rows
  const items = pengiriman.items || [];
  let totalUnits = 0;
  let totalNilai = 0;

  items.forEach((item, idx) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.harga_produk) || 0;
    const subtotal = qty * price;
    totalUnits += qty;
    totalNilai += subtotal;

    // Check page break if list is long
    if (cursorY > pageHeight - 65) {
      doc.addPage();
      cursorY = 20;
    }

    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, cursorY, contentWidth, 7, "F");
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, cursorY + 7, margin + contentWidth, cursorY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${idx + 1}`, colX.no + 3, cursorY + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    // Truncate product name if too long
    const safeName = item.nama_produk.length > 32 ? `${item.nama_produk.slice(0, 30)}...` : item.nama_produk;
    doc.text(safeName, colX.name, cursorY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(item.nama_kategori || "-", colX.kategori, cursorY + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${qty} ${item.jenis_satuan || "pcs"}`, colX.qty, cursorY + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(formatRupiah(price), colX.harga, cursorY + 5, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(subtotal), colX.total, cursorY + 5, { align: "right" });

    cursorY += 7;
  });

  // Table Totals Footer Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, cursorY, contentWidth, 8, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, cursorY, contentWidth, 8, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL KESELURUHAN (${items.length} Macam Produk)`, colX.name, cursorY + 5.5);
  doc.text(`${totalUnits} Unit`, colX.qty, cursorY + 5.5, { align: "right" });
  doc.text(formatRupiah(totalNilai), colX.total, cursorY + 5.5, { align: "right" });

  cursorY += 14;

  // 6. Signatures and Verification Block
  if (cursorY > pageHeight - 60) {
    doc.addPage();
    cursorY = 20;
  }

  const sigBoxWidth = (contentWidth - 10) / 2;
  const sigBoxHeight = 44;

  // Sender Signature Box (Left)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, sigBoxWidth, sigBoxHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("PENGIRIM (KURIR / STAF)", margin + 4, cursorY + 5.5);

  // Embed digital signature if present
  if (pengiriman.ttd_pengirim_url) {
    const base64Sig = await getBase64ImageFromUrl(pengiriman.ttd_pengirim_url);
    if (base64Sig) {
      try {
        doc.addImage(base64Sig, "PNG", margin + 10, cursorY + 8, sigBoxWidth - 20, 22);
      } catch {
        // Fallback if image format issue
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("[ Tanda Tangan Digital Tersimpan ]", margin + sigBoxWidth / 2, cursorY + 20, {
          align: "center",
        });
      }
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("[ Tanda Tangan Manual ]", margin + sigBoxWidth / 2, cursorY + 20, {
      align: "center",
    });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const pengirimNama = pengiriman.pengirim?.nama || pengiriman.creator?.nama || "Petugas Pengirim";
  doc.text(`( ${pengirimNama} )`, margin + sigBoxWidth / 2, cursorY + 39, { align: "center" });

  // Receiver Signature Box (Right)
  const recvX = margin + sigBoxWidth + 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(recvX, cursorY, sigBoxWidth, sigBoxHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("PENERIMA (SPG / OUTLET)", recvX + 4, cursorY + 5.5);

  if (penerimaan) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const stat = penerimaan.status === "sesuai" ? "SESUAI" : "SELISIH";
    const statColor = penerimaan.status === "sesuai" ? [22, 101, 52] : [185, 28, 28];
    doc.setTextColor(statColor[0], statColor[1], statColor[2]);
    doc.text(`Penerimaan: ${stat} (${penerimaan.qty_terima} unit diterima)`, recvX + 4, cursorY + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    if (penerimaan.tanggal) {
      doc.text(`Waktu: ${formatJakartaDateTime(penerimaan.tanggal)} WIB`, recvX + 4, cursorY + 19);
    }
    if (penerimaan.catatan) {
      const note = penerimaan.catatan.length > 38 ? `${penerimaan.catatan.slice(0, 36)}...` : penerimaan.catatan;
      doc.text(`Catatan: ${note}`, recvX + 4, cursorY + 24);
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("[ Tanda Tangan Penerima Saat Barang Sampai ]", recvX + sigBoxWidth / 2, cursorY + 20, {
      align: "center",
    });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const penerimaNama = penerimaan?.spg?.nama || pengiriman.lapak?.spg?.nama || "SPG Penerima Lapak";
  doc.text(`( ${penerimaNama} )`, recvX + sigBoxWidth / 2, cursorY + 39, { align: "center" });

  // 7. Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const printedAt = formatJakartaDateTime(new Date());
  doc.text(
    `Dokumen resmi internal POT Mobile • Dicetak pada ${printedAt} WIB • ID: ${pengiriman.id}`,
    margin,
    pageHeight - 8
  );
  doc.text("Halaman 1 dari 1", pageWidth - margin, pageHeight - 8, { align: "right" });

  // Trigger download
  const cleanId = (pengiriman.unique_id || pengiriman.id).replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Nota_DO_${cleanId}.pdf`);
}
