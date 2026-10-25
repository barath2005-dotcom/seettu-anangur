import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Seettu Manager Database ---');

  // Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.collectionRound.deleteMany();
  await prisma.schemeMembership.deleteMany();
  await prisma.scheme.deleteMany();
  await prisma.user.deleteMany();
  await prisma.member.deleteMany();

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedStaffPassword = await bcrypt.hash('staff123', 10);
  const hashedMemberPassword = await bcrypt.hash('member123', 10);

  // 1. Create Members
  console.log('Creating members...');
  const memberData = [
    { memberNumber: 'M-001', fullName: 'Ramesh Kumar', phone: '9840123456', email: 'ramesh@example.com', address: '12, Anna Salai, Chennai, TN', status: 'ACTIVE' },
    { memberNumber: 'M-002', fullName: 'Priya Sundaram', phone: '9840234567', email: 'priya@example.com', address: '45, Gandhi Road, Madurai, TN', status: 'ACTIVE' },
    { memberNumber: 'M-003', fullName: 'Karthik Narayanan', phone: '9840345678', email: 'karthik@example.com', address: '88, Cross Cut Road, Coimbatore, TN', status: 'ACTIVE' },
    { memberNumber: 'M-004', fullName: 'Anitha Balaji', phone: '9840456789', email: 'anitha@example.com', address: '23, West Masi St, Madurai, TN', status: 'ACTIVE' },
    { memberNumber: 'M-005', fullName: 'Saravanan Muthu', phone: '9840567890', email: 'saravanan@example.com', address: '5, Big Bazaar St, Tiruchirappalli, TN', status: 'ACTIVE' },
    { memberNumber: 'M-006', fullName: 'Deepa Chandran', phone: '9840678901', email: 'deepa@example.com', address: '102, 100 Feet Road, Chennai, TN', status: 'ACTIVE' },
    { memberNumber: 'M-007', fullName: 'Vignesh Pandian', phone: '9840789012', email: 'vignesh@example.com', address: '19, Periyar Nagar, Salem, TN', status: 'ACTIVE' },
    { memberNumber: 'M-008', fullName: 'Meena Rajagopal', phone: '9840890123', email: 'meena@example.com', address: '77, South Car St, Tirunelveli, TN', status: 'ACTIVE' },
    { memberNumber: 'M-009', fullName: 'Vijay Sethupathi', phone: '9840901234', email: 'vijay@example.com', address: '14, Mount Road, Chennai, TN', status: 'ACTIVE' },
    { memberNumber: 'M-010', fullName: 'Kavitha Krishnan', phone: '9840912345', email: 'kavitha@example.com', address: '31, Race Course, Coimbatore, TN', status: 'ACTIVE' },
  ];

  const members: any[] = [];
  for (const m of memberData) {
    const created = await prisma.member.create({ data: m });
    members.push(created);
  }

  // 2. Create Users
  console.log('Creating users (Admin, Staff, Member)...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@seettu.com',
      passwordHash: hashedAdminPassword,
      name: 'Super Admin',
      role: 'ADMIN',
      phone: '9840000001',
      isActive: true,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@seettu.com',
      passwordHash: hashedStaffPassword,
      name: 'Suresh Babu (Collection Staff)',
      role: 'STAFF',
      phone: '9840000002',
      isActive: true,
    },
  });

  // Member user linked to Ramesh Kumar (M-001)
  const memberUser = await prisma.user.create({
    data: {
      email: 'member@seettu.com',
      passwordHash: hashedMemberPassword,
      name: 'Ramesh Kumar (Member)',
      role: 'MEMBER',
      phone: '9840123456',
      memberId: members[0].id,
      isActive: true,
    },
  });

  await prisma.member.update({
    where: { id: members[0].id },
    data: { userId: memberUser.id },
  });

  // 3. Create Schemes
  console.log('Creating Seettu schemes and collection rounds...');
  const now = new Date();
  const startDate1 = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Started last month
  const endDate1 = new Date(startDate1);
  endDate1.setMonth(endDate1.getMonth() + 20);

  const scheme1 = await prisma.scheme.create({
    data: {
      code: 'SCH-100K-01',
      name: 'Gold Monthly Chit Fund (1 Lakh)',
      schemeType: 'ROTATING_CHIT',
      startDate: startDate1,
      endDate: endDate1,
      totalInstallments: 20,
      frequency: 'MONTHLY',
      contributionAmountPaise: 500000, // ₹5,000 / month
      totalPoolAmountPaise: 10000000, // ₹1,00,000 per round
      totalMembersCount: 20,
      organizerCommissionPaise: 250000, // ₹2,500 organizer fee
      status: 'ACTIVE',
      notes: 'Standard 20-month monthly chit fund. ₹5,000 installment due on 5th of every month.',
    },
  });

  // Create Collection Rounds for Scheme 1
  const rounds: any[] = [];
  for (let r = 1; r <= 20; r++) {
    const dueDate = new Date(startDate1);
    dueDate.setMonth(dueDate.getMonth() + (r - 1));
    dueDate.setDate(5); // Due 5th of each month

    const status = r === 1 ? 'COMPLETED' : r === 2 ? 'COLLECTING' : 'PENDING';
    const round = await prisma.collectionRound.create({
      data: {
        schemeId: scheme1.id,
        roundNumber: r,
        dueDate,
        targetAmountPaise: 10000000,
        collectedAmountPaise: r === 1 ? 10000000 : r === 2 ? 3500000 : 0,
        status,
        ...(r === 1 && {
          payoutRecipientMemberId: members[0].id,
          grossPayoutPaise: 10000000,
          deductionsPaise: 500000,
          netPayoutPaise: 9500000,
          payoutStatus: 'DISBURSED',
          payoutDisbursedAt: new Date(startDate1.getTime() + 10 * 24 * 60 * 60 * 1000),
        }),
      },
    });
    rounds.push(round);
  }

  // Enroll 10 members in Scheme 1
  for (let idx = 0; idx < members.length; idx++) {
    await prisma.schemeMembership.create({
      data: {
        schemeId: scheme1.id,
        memberId: members[idx].id,
        slotNumber: idx + 1,
        hasReceivedPayout: idx === 0,
        payoutRoundNumber: idx === 0 ? 1 : null,
      },
    });
  }

  // Create Scheme 2: Business Pool
  const startDate2 = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate2 = new Date(startDate2);
  endDate2.setMonth(endDate2.getMonth() + 10);

  const scheme2 = await prisma.scheme.create({
    data: {
      code: 'SCH-500K-01',
      name: 'Diamond Business Pool (5 Lakhs)',
      schemeType: 'ROTATING_CHIT',
      startDate: startDate2,
      endDate: endDate2,
      totalInstallments: 10,
      frequency: 'MONTHLY',
      contributionAmountPaise: 5000000, // ₹50,000 / month
      totalPoolAmountPaise: 50000000, // ₹5,00,000
      totalMembersCount: 10,
      organizerCommissionPaise: 1000000,
      status: 'ACTIVE',
      notes: 'High-value business rotational savings pool.',
    },
  });

  for (let r = 1; r <= 10; r++) {
    const dueDate = new Date(startDate2);
    dueDate.setMonth(dueDate.getMonth() + (r - 1));
    dueDate.setDate(10);

    await prisma.collectionRound.create({
      data: {
        schemeId: scheme2.id,
        roundNumber: r,
        dueDate,
        targetAmountPaise: 50000000,
        collectedAmountPaise: r === 1 ? 15000000 : 0,
        status: r === 1 ? 'COLLECTING' : 'PENDING',
      },
    });
  }

  // Enroll first 5 members in Scheme 2
  for (let idx = 0; idx < 5; idx++) {
    await prisma.schemeMembership.create({
      data: {
        schemeId: scheme2.id,
        memberId: members[idx].id,
        slotNumber: idx + 1,
      },
    });
  }

  // 4. Create Payments & Receipts
  console.log('Recording initial payments and receipts...');
  // Round 1 payments for Scheme 1 (all 10 members paid ₹5,000)
  for (let idx = 0; idx < members.length; idx++) {
    const paymentDate = new Date(startDate1);
    paymentDate.setDate(4 + (idx % 3));

    const payment = await prisma.payment.create({
      data: {
        transactionId: `TXN-R1-M${idx + 1}`,
        receiptNumber: `REC-2026-R1-${1001 + idx}`,
        schemeId: scheme1.id,
        memberId: members[idx].id,
        roundNumber: 1,
        amountDuePaise: 500000,
        amountReceivedPaise: 500000,
        balanceRemainingPaise: 0,
        paymentDate,
        paymentMethod: idx % 2 === 0 ? 'UPI' : 'CASH',
        externalReference: idx % 2 === 0 ? `UPI-REF-${883900 + idx}` : null,
        recordedByUserId: staffUser.id,
        status: 'SUCCESS',
        idempotencyKey: `idemp-r1-m${idx + 1}`,
        notes: 'Round 1 installment paid in full',
      },
    });

    await prisma.receipt.create({
      data: {
        receiptNumber: payment.receiptNumber,
        paymentId: payment.id,
        memberId: members[idx].id,
        schemeId: scheme1.id,
        amountPaise: 500000,
      },
    });
  }

  // Round 2 payments for Scheme 1 (7 members paid ₹5,000)
  for (let idx = 0; idx < 7; idx++) {
    const paymentDate = new Date(now);
    paymentDate.setDate(2 + idx);

    const payment = await prisma.payment.create({
      data: {
        transactionId: `TXN-R2-M${idx + 1}`,
        receiptNumber: `REC-2026-R2-${2001 + idx}`,
        schemeId: scheme1.id,
        memberId: members[idx].id,
        roundNumber: 2,
        amountDuePaise: 500000,
        amountReceivedPaise: 500000,
        balanceRemainingPaise: 0,
        paymentDate,
        paymentMethod: idx % 3 === 0 ? 'BANK_TRANSFER' : 'UPI',
        externalReference: `TXN-REF-${992000 + idx}`,
        recordedByUserId: adminUser.id,
        status: 'SUCCESS',
        idempotencyKey: `idemp-r2-m${idx + 1}`,
        notes: 'Round 2 installment',
      },
    });

    await prisma.receipt.create({
      data: {
        receiptNumber: payment.receiptNumber,
        paymentId: payment.id,
        memberId: members[idx].id,
        schemeId: scheme1.id,
        amountPaise: 500000,
      },
    });
  }

  // 5. Create Payout for Round 1
  console.log('Creating payout record for Round 1 winner...');
  await prisma.payout.create({
    data: {
      schemeId: scheme1.id,
      roundId: rounds[0].id,
      roundNumber: 1,
      recipientMemberId: members[0].id,
      grossPayoutPaise: 10000000,
      deductionsPaise: 500000,
      netPayoutPaise: 9500000,
      disbursedDate: new Date(startDate1.getTime() + 10 * 24 * 60 * 60 * 1000),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-AXIS-9920192',
      approvalStatus: 'DISBURSED',
      preparedByUserId: staffUser.id,
      approvedByUserId: adminUser.id,
      approvedAt: new Date(startDate1.getTime() + 8 * 24 * 60 * 60 * 1000),
      notes: 'Disbursed to Ramesh Kumar Axis Bank A/c 910020030040',
    },
  });

  // 6. Create Notifications
  console.log('Creating sample notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: memberUser.id,
        title: 'Payout Disbursed',
        message: 'Your payout of ₹95,000 for Round 1 in Gold Monthly Chit Fund has been disbursed via NEFT.',
        type: 'PAYOUT_APPROVED',
        isRead: true,
      },
      {
        userId: memberUser.id,
        title: 'Payment Received',
        message: 'Received ₹5,000 for Round 2 in Gold Monthly Chit Fund. Receipt: REC-2026-R2-2001',
        type: 'PAYMENT_RECEIVED',
        isRead: false,
      },
      {
        userId: adminUser.id,
        title: 'Round 2 Due Reminder',
        message: 'Round 2 collection for Gold Monthly Chit Fund (1 Lakh) is active. 7 of 10 members paid.',
        type: 'INSTALLMENT_DUE',
        isRead: false,
      },
    ],
  });

  // 7. Audit Logs
  console.log('Recording audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_INIT',
        entityType: 'System',
        details: JSON.stringify({ message: 'Seettu Manager system database initialized' }),
        ipAddress: '127.0.0.1',
      },
      {
        userId: adminUser.id,
        action: 'CREATE_SCHEME',
        entityType: 'Scheme',
        entityId: scheme1.id,
        details: JSON.stringify({ code: scheme1.code, name: scheme1.name }),
        ipAddress: '127.0.0.1',
      },
      {
        userId: adminUser.id,
        action: 'APPROVE_PAYOUT',
        entityType: 'Payout',
        details: JSON.stringify({ recipient: members[0].fullName, netPayoutPaise: 9500000 }),
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('  Admin:  admin@seettu.com  / admin123');
  console.log('  Staff:  staff@seettu.com  / staff123');
  console.log('  Member: member@seettu.com / member123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
