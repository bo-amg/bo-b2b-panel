import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Türkçe karakter desteği için Google Fonts'tan Roboto kullan
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    padding: 40,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e40af",
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 8,
    color: "#666",
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e40af",
    textAlign: "right",
    marginBottom: 8,
  },
  invoiceInfo: {
    fontSize: 9,
    textAlign: "right",
    color: "#666",
    lineHeight: 1.6,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1e40af",
    marginBottom: 6,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 4,
  },
  dealerInfo: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
    lineHeight: 1.5,
  },
  table: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e40af",
    color: "#fff",
    fontSize: 8,
    fontWeight: 700,
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    padding: 6,
    fontSize: 8,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
    padding: 6,
    fontSize: 8,
    backgroundColor: "#f8fafc",
  },
  colNo: { width: "5%" },
  colProduct: { width: "35%" },
  colSku: { width: "12%" },
  colQty: { width: "8%", textAlign: "right" },
  colRetail: { width: "13%", textAlign: "right" },
  colWholesale: { width: "13%", textAlign: "right" },
  colTotal: { width: "14%", textAlign: "right" },
  totalsSection: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 3,
    width: 250,
  },
  totalLabel: {
    width: 150,
    textAlign: "right",
    paddingRight: 15,
    fontSize: 9,
    color: "#666",
  },
  totalValue: {
    width: 100,
    textAlign: "right",
    fontSize: 9,
    fontWeight: 700,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 6,
    width: 250,
    borderTop: "2px solid #1e40af",
    marginTop: 4,
  },
  grandTotalLabel: {
    width: 150,
    textAlign: "right",
    paddingRight: 15,
    fontSize: 11,
    fontWeight: 700,
    color: "#1e40af",
  },
  grandTotalValue: {
    width: 100,
    textAlign: "right",
    fontSize: 11,
    fontWeight: 700,
    color: "#1e40af",
  },
  bankSection: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 4,
    marginTop: 15,
    border: "1px solid #bae6fd",
  },
  cargoSection: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
    border: "1px solid #e5e7eb",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
  },
  bold: {
    fontWeight: 700,
  },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

interface ProformaProps {
  order: any;
  dealer: any;
  settings: any;
  items: any[];
}

export function ProformaDocument({
  order,
  dealer,
  settings,
  items,
}: ProformaProps) {
  const subtotalRetail = items.reduce(
    (sum, item) => sum + Number(item.retailPrice) * item.quantity,
    0
  );
  const totalAmount = Number(order.totalAmount);
  const totalDiscount = subtotalRetail - totalAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{settings.companyName}</Text>
            <Text style={styles.companyInfo}>
              {settings.companyAddress && `${settings.companyAddress}\n`}
              {settings.companyPhone && `Tel: ${settings.companyPhone}\n`}
              {settings.companyEmail && `Email: ${settings.companyEmail}\n`}
              {settings.companyTaxOffice &&
                `V.D.: ${settings.companyTaxOffice} `}
              {settings.companyTaxId && `V.N.: ${settings.companyTaxId}`}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>PROFORMA FATURA</Text>
            <Text style={styles.invoiceInfo}>
              Fatura No: {order.orderNumber}
              {"\n"}
              Tarih: {formatDate(order.createdAt)}
              {"\n"}
              {order.dueDate && `Vade: ${formatDate(order.dueDate)}`}
            </Text>
          </View>
        </View>

        {/* Alıcı Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALICI BİLGİLERİ</Text>
          <View style={styles.dealerInfo}>
            <Text style={styles.bold}>{dealer.companyName}</Text>
            <Text>Yetkili: {dealer.contactName}</Text>
            {dealer.address && <Text>Adres: {dealer.address}</Text>}
            {dealer.city && <Text>Şehir: {dealer.city}</Text>}
            {dealer.phone && <Text>Tel: {dealer.phone}</Text>}
            {dealer.taxOffice && (
              <Text>
                V.D.: {dealer.taxOffice}{" "}
                {dealer.taxId && `V.N.: ${dealer.taxId}`}
              </Text>
            )}
          </View>
        </View>

        {/* Ürün Tablosu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SİPARİŞ KALEMLERİ</Text>
          <View style={styles.table}>
            {/* Tablo Başlığı */}
            <View style={styles.tableHeader}>
              <Text style={styles.colNo}>#</Text>
              <Text style={styles.colProduct}>Ürün</Text>
              <Text style={styles.colSku}>SKU</Text>
              <Text style={styles.colQty}>Adet</Text>
              <Text style={styles.colRetail}>Liste Fiyat</Text>
              <Text style={styles.colWholesale}>Toptan Fiyat</Text>
              <Text style={styles.colTotal}>Toplam</Text>
            </View>

            {/* Tablo Satırları */}
            {items.map((item, index) => (
              <View
                key={item.id}
                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colProduct}>
                  {item.title}
                  {item.variantTitle ? ` - ${item.variantTitle}` : ""}
                </Text>
                <Text style={styles.colSku}>{item.sku || "-"}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colRetail}>
                  {formatCurrency(Number(item.retailPrice))}
                </Text>
                <Text style={styles.colWholesale}>
                  {formatCurrency(Number(item.wholesalePrice))}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCurrency(Number(item.lineTotal))}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Toplamlar */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ara Toplam (Liste Fiyat):</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(subtotalRetail)} TL
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              İskonto (%{Number(order.discountPercent).toFixed(0)}):
            </Text>
            <Text style={[styles.totalValue, { color: "#dc2626" }]}>
              -{formatCurrency(totalDiscount)} TL
            </Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>GENEL TOPLAM:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(totalAmount)} TL
            </Text>
          </View>
        </View>

        {/* Banka Bilgileri */}
        {(settings.bankName || settings.bankIban) && (
          <View style={styles.bankSection}>
            <Text style={[styles.sectionTitle, { color: "#0369a1" }]}>
              ÖDEME BİLGİLERİ
            </Text>
            {settings.bankName && (
              <Text>
                Banka: <Text style={styles.bold}>{settings.bankName}</Text>
              </Text>
            )}
            {settings.bankIban && (
              <Text>
                IBAN: <Text style={styles.bold}>{settings.bankIban}</Text>
              </Text>
            )}
            {settings.bankAccountHolder && (
              <Text>Hesap Sahibi: {settings.bankAccountHolder}</Text>
            )}
            {settings.bankSwift && <Text>SWIFT: {settings.bankSwift}</Text>}
            {settings.paymentTerms && (
              <Text>
                {"\n"}Ödeme Koşulları: {settings.paymentTerms}
              </Text>
            )}
          </View>
        )}

        {/* Kargo Bilgisi */}
        {settings.cargoInfo && (
          <View style={styles.cargoSection}>
            <Text style={styles.sectionTitle}>KARGO / TESLİMAT</Text>
            <Text>{settings.cargoInfo}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Bu belge proforma fatura niteliğindedir ve resmi fatura yerine geçmez.
          | {settings.companyName}
        </Text>
      </Page>
    </Document>
  );
}
