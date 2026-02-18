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

function formatCurrencyPdf(amount: number, currency = "TRY"): string {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function currencySymbol(currency = "TRY"): string {
  return currency === "USD" ? "$" : "TL";
}

function formatDatePdf(date: Date | string, language = "TR"): string {
  return new Intl.DateTimeFormat(language === "EN" ? "en-US" : "tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

// PDF label translations
const pdfLabels = {
  TR: {
    proformaTitle: "PROFORMA FATURA",
    invoiceNo: "Fatura No",
    date: "Tarih",
    dueDate: "Vade",
    buyerInfo: "ALICI BİLGİLERİ",
    authorized: "Yetkili",
    address: "Adres",
    city: "Şehir",
    phone: "Tel",
    taxOffice: "V.D.",
    taxId: "V.N.",
    orderItems: "SİPARİŞ KALEMLERİ",
    product: "Ürün",
    sku: "SKU",
    qty: "Adet",
    retailPrice: "Liste Fiyat",
    wholesalePrice: "Toptan Fiyat",
    total: "Toplam",
    subtotalRetail: "Ara Toplam (Liste Fiyat):",
    discount: "İskonto",
    grandTotal: "GENEL TOPLAM:",
    paymentInfo: "ÖDEME BİLGİLERİ",
    bank: "Banka",
    iban: "IBAN",
    accountHolder: "Hesap Sahibi",
    swift: "SWIFT",
    paymentTerms: "Ödeme Koşulları",
    cargoTitle: "KARGO / TESLİMAT",
    footer: "Bu belge proforma fatura niteliğindedir ve resmi fatura yerine geçmez.",
  },
  EN: {
    proformaTitle: "PROFORMA INVOICE",
    invoiceNo: "Invoice No",
    date: "Date",
    dueDate: "Due Date",
    buyerInfo: "BUYER INFORMATION",
    authorized: "Contact",
    address: "Address",
    city: "City",
    phone: "Phone",
    taxOffice: "Tax Office",
    taxId: "Tax ID",
    orderItems: "ORDER ITEMS",
    product: "Product",
    sku: "SKU",
    qty: "Qty",
    retailPrice: "Retail Price",
    wholesalePrice: "Wholesale Price",
    total: "Total",
    subtotalRetail: "Subtotal (Retail Price):",
    discount: "Discount",
    grandTotal: "GRAND TOTAL:",
    paymentInfo: "PAYMENT INFORMATION",
    bank: "Bank",
    iban: "IBAN",
    accountHolder: "Account Holder",
    swift: "SWIFT",
    paymentTerms: "Payment Terms",
    cargoTitle: "SHIPPING / DELIVERY",
    footer: "This document is a proforma invoice and does not replace an official invoice.",
  },
};

interface ProformaProps {
  order: any;
  dealer: any;
  settings: any;
  items: any[];
  currency?: string;
  language?: string;
}

export function ProformaDocument({
  order,
  dealer,
  settings,
  items,
  currency: currencyProp,
  language: languageProp,
}: ProformaProps) {
  const cur = currencyProp || order.currency || "TRY";
  const lang = (languageProp || dealer.language || "TR") as "TR" | "EN";
  const L = pdfLabels[lang];
  const sym = currencySymbol(cur);

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
              {settings.companyPhone && `${lang === "EN" ? "Phone" : "Tel"}: ${settings.companyPhone}\n`}
              {settings.companyEmail && `Email: ${settings.companyEmail}\n`}
              {settings.companyTaxOffice &&
                `${L.taxOffice}: ${settings.companyTaxOffice} `}
              {settings.companyTaxId && `${L.taxId}: ${settings.companyTaxId}`}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>{L.proformaTitle}</Text>
            <Text style={styles.invoiceInfo}>
              {L.invoiceNo}: {order.orderNumber}
              {"\n"}
              {L.date}: {formatDatePdf(order.createdAt, lang)}
              {"\n"}
              {order.dueDate && `${L.dueDate}: ${formatDatePdf(order.dueDate, lang)}`}
            </Text>
          </View>
        </View>

        {/* Buyer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L.buyerInfo}</Text>
          <View style={styles.dealerInfo}>
            <Text style={styles.bold}>{dealer.companyName}</Text>
            <Text>{L.authorized}: {dealer.contactName}</Text>
            {dealer.address && <Text>{L.address}: {dealer.address}</Text>}
            {dealer.city && <Text>{L.city}: {dealer.city}</Text>}
            {dealer.phone && <Text>{L.phone}: {dealer.phone}</Text>}
            {dealer.taxOffice && (
              <Text>
                {L.taxOffice}: {dealer.taxOffice}{" "}
                {dealer.taxId && `${L.taxId}: ${dealer.taxId}`}
              </Text>
            )}
          </View>
        </View>

        {/* Order Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{L.orderItems}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colNo}>#</Text>
              <Text style={styles.colProduct}>{L.product}</Text>
              <Text style={styles.colSku}>{L.sku}</Text>
              <Text style={styles.colQty}>{L.qty}</Text>
              <Text style={styles.colRetail}>{L.retailPrice}</Text>
              <Text style={styles.colWholesale}>{L.wholesalePrice}</Text>
              <Text style={styles.colTotal}>{L.total}</Text>
            </View>

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
                  {formatCurrencyPdf(Number(item.retailPrice), cur)}
                </Text>
                <Text style={styles.colWholesale}>
                  {formatCurrencyPdf(Number(item.wholesalePrice), cur)}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCurrencyPdf(Number(item.lineTotal), cur)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{L.subtotalRetail}</Text>
            <Text style={styles.totalValue}>
              {formatCurrencyPdf(subtotalRetail, cur)} {sym}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {L.discount} (%{Number(order.discountPercent).toFixed(0)}):
            </Text>
            <Text style={[styles.totalValue, { color: "#dc2626" }]}>
              -{formatCurrencyPdf(totalDiscount, cur)} {sym}
            </Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>{L.grandTotal}</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrencyPdf(totalAmount, cur)} {sym}
            </Text>
          </View>
        </View>

        {/* Payment Info */}
        {(settings.bankName || settings.bankIban) && (
          <View style={styles.bankSection}>
            <Text style={[styles.sectionTitle, { color: "#0369a1" }]}>
              {L.paymentInfo}
            </Text>
            {settings.bankName && (
              <Text>
                {L.bank}: <Text style={styles.bold}>{settings.bankName}</Text>
              </Text>
            )}
            {settings.bankIban && (
              <Text>
                {L.iban}: <Text style={styles.bold}>{settings.bankIban}</Text>
              </Text>
            )}
            {settings.bankAccountHolder && (
              <Text>{L.accountHolder}: {settings.bankAccountHolder}</Text>
            )}
            {settings.bankSwift && <Text>{L.swift}: {settings.bankSwift}</Text>}
            {settings.paymentTerms && (
              <Text>
                {"\n"}{L.paymentTerms}: {settings.paymentTerms}
              </Text>
            )}
          </View>
        )}

        {/* Shipping */}
        {settings.cargoInfo && (
          <View style={styles.cargoSection}>
            <Text style={styles.sectionTitle}>{L.cargoTitle}</Text>
            <Text>{settings.cargoInfo}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {L.footer}
          {" | "}{settings.companyName}
        </Text>
      </Page>
    </Document>
  );
}
