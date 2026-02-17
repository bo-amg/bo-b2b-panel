import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin kullanıcı oluştur
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@buyuklereoyuncaklar.com" },
    update: {},
    create: {
      email: "admin@buyuklereoyuncaklar.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      companyName: "Büyüklere Oyuncaklar",
      contactName: "Admin",
    },
  });
  console.log("Admin user created:", admin.email);

  // Test bayi oluştur
  const dealerPassword = await bcrypt.hash("bayi123", 12);
  const dealer = await prisma.user.upsert({
    where: { email: "test@bayifirma.com" },
    update: {},
    create: {
      email: "test@bayifirma.com",
      passwordHash: dealerPassword,
      role: "DEALER",
      companyName: "Test Bayi Ltd.",
      contactName: "Ahmet Yılmaz",
      phone: "0532 123 4567",
      taxId: "1234567890",
      taxOffice: "Beşiktaş",
      address: "Test Cad. No:1",
      city: "İstanbul",
    },
  });
  console.log("Test dealer created:", dealer.email);

  // Global ayarları oluştur
  const settings = await prisma.settings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      discountPercent: 20,
      companyName: "Büyüklere Oyuncaklar",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "info@buyuklereoyuncaklar.com",
      defaultDueDays: 30,
      paymentTerms: "Fatura tarihinden itibaren 30 gün vadeli ödeme",
    },
  });
  console.log("Settings created, discount:", Number(settings.discountPercent) + "%");

  console.log("\n--- Seed tamamlandı ---");
  console.log("Admin giriş: admin@buyuklereoyuncaklar.com / admin123");
  console.log("Bayi giriş: test@bayifirma.com / bayi123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
