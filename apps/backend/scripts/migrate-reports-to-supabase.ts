import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const jsonPath = path.join(__dirname, '../prisma/monthly_entries.json');

async function main() {
  console.log('Reading JSON from:', jsonPath);
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const rows = JSON.parse(rawData);
  console.log(`Found ${rows.length} rows to insert into Supabase...`);

  let count = 0;
  for (const row of rows) {
    await prisma.monthlyReportEntry.upsert({
      where: {
        chitNo_date_sno: {
          chitNo: String(row.chitNo),
          date: String(row.date),
          sno: Number(row.sno),
        },
      },
      update: {
        sheetNumber: Number(row.sheetNumber),
        memberNumber: row.memberNumber,
        memberName: row.memberName,
        amount: Number(row.amount),
        commission: Number(row.commission || 0),
        moneyOffered: Number(row.moneyOffered || 0),
        templeCharityFund: Number(row.templeCharityFund || 10000),
        status: row.status || 'PAID',
        paymentMethod: row.paymentMethod || 'CASH',
        notes: row.notes,
      },
      create: {
        id: row.id,
        chitNo: String(row.chitNo),
        date: String(row.date),
        sno: Number(row.sno),
        sheetNumber: Number(row.sheetNumber),
        memberNumber: row.memberNumber,
        memberName: row.memberName,
        amount: Number(row.amount),
        commission: Number(row.commission || 0),
        moneyOffered: Number(row.moneyOffered || 0),
        templeCharityFund: Number(row.templeCharityFund || 10000),
        status: row.status || 'PAID',
        paymentMethod: row.paymentMethod || 'CASH',
        notes: row.notes,
      },
    });
    count++;
    if (count % 20 === 0) {
      console.log(`Inserted ${count}/${rows.length} entries...`);
    }
  }

  console.log(`✅ All ${count} monthly report entries successfully stored in Supabase PostgreSQL!`);
  const total = await prisma.monthlyReportEntry.count();
  console.log('Verified Total in Supabase:', total);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
