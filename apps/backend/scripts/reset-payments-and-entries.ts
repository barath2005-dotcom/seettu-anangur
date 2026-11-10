import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning up all monthly entries, payments, and payouts ---');

  // 1. Delete all MonthlyReportEntry rows in Supabase PostgreSQL
  const deletedMonthly = await prisma.monthlyReportEntry.deleteMany({});
  console.log(`Deleted ${deletedMonthly.count} MonthlyReportEntry records from PostgreSQL.`);

  // 2. Delete all Receipts
  const deletedReceipts = await prisma.receipt.deleteMany({});
  console.log(`Deleted ${deletedReceipts.count} Receipt records from PostgreSQL.`);

  // 3. Delete all Payments
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`Deleted ${deletedPayments.count} Payment records from PostgreSQL.`);

  // 4. Delete all Payouts
  const deletedPayouts = await prisma.payout.deleteMany({});
  console.log(`Deleted ${deletedPayouts.count} Payout records from PostgreSQL.`);

  // 5. Reset all CollectionRounds to 0 collected
  await prisma.collectionRound.updateMany({
    data: {
      collectedAmountPaise: 0,
      status: 'PENDING',
      payoutRecipientMemberId: null,
      grossPayoutPaise: null,
      deductionsPaise: 0,
      netPayoutPaise: null,
      payoutStatus: 'DRAFT',
      payoutDisbursedAt: null,
    },
  });
  // Set Round 1 to COLLECTING
  const scheme = await prisma.scheme.findFirst();
  if (scheme) {
    await prisma.collectionRound.updateMany({
      where: { schemeId: scheme.id, roundNumber: 1 },
      data: { status: 'COLLECTING' },
    });
  }
  console.log('Reset all CollectionRounds to 0 collected (Round 1 ready for January).');

  // 6. Reset all SchemeMemberships (hasReceivedPayout = false)
  await prisma.schemeMembership.updateMany({
    data: {
      hasReceivedPayout: false,
      payoutRoundNumber: null,
    },
  });
  console.log('Reset all SchemeMemberships payout statuses.');

  // 7. Also clear local SQLite files if they exist
  const sqliteFiles = [
    path.join(__dirname, '../prisma/dev.db'),
    path.join(__dirname, '../prisma/seed-data.db'),
  ];
  for (const file of sqliteFiles) {
    if (fs.existsSync(file)) {
      try {
        const sqlite = new (require('better-sqlite3'))(file);
        sqlite.exec('DELETE FROM MonthlyReportEntry;');
        sqlite.exec('DELETE FROM Receipt;');
        sqlite.exec('DELETE FROM Payment;');
        sqlite.exec('DELETE FROM Payout;');
        sqlite.close();
        console.log(`Cleaned SQLite file: ${file}`);
      } catch (e) {
        // If better-sqlite3 is not available, we can use sqlite3 cli
      }
    }
  }

  // 8. Remove the dumped monthly_entries.json file
  const jsonFile = path.join(__dirname, '../prisma/monthly_entries.json');
  if (fs.existsSync(jsonFile)) {
    fs.unlinkSync(jsonFile);
    console.log('Removed temporary monthly_entries.json.');
  }

  console.log('--- Cleanup complete! App is completely clean and ready to start from January. ---');
}

main()
  .catch((e) => {
    console.error('Error resetting database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
