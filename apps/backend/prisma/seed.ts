import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const memberData = [
  // Sheet 1 (1 to 13)
  { memberNumber: 'M-001', fullName: 'பழனிச்சாமி பி எல் ஆர் / Palanisamy B.L.R', phone: '', email: null, address: 'பி எல் ஆர் / B.L.R, ஆனங்கூர்', status: 'ACTIVE' },
  { memberNumber: 'M-002', fullName: 'லோகநாதன் பி எல் ஆர் / Loganathan B.L.R', phone: '', email: null, address: 'பி எல் ஆர் / B.L.R, ஆனங்கூர்', status: 'ACTIVE' },
  { memberNumber: 'M-003', fullName: 'ராஜேஷ் கண்ணா (1) / Rajesh Khanna (1)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-004', fullName: 'ராஜேஷ் கண்ணா (2) / Rajesh Khanna (2)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-005', fullName: 'பிரகாஷ் புதூர் / Prakash Pudur', phone: '', email: null, address: 'புதூர் / Pudur', status: 'ACTIVE' },
  { memberNumber: 'M-006', fullName: 'தீபன் பழனிச்சாமி / Deepan Palanisamy', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-007', fullName: 'கீதா சந்திரன் / Geetha Chandran', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-008', fullName: 'பிரகாஷ் பண்டாரம் / Prakash Pandaram', phone: '', email: null, address: 'பண்டாரம் / Pandaram', status: 'ACTIVE' },
  { memberNumber: 'M-009', fullName: 'ரஞ்சித், ஆனங்கூர் / Ranjith Anangur', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-010', fullName: 'தினேஷ் ஆனங்கூர் / Dinesh Anangur', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-011', fullName: 'செந்தில் வைரம் / Senthil Vairam', phone: '', email: null, address: 'வைரம் / Vairam', status: 'ACTIVE' },
  { memberNumber: 'M-012', fullName: 'பிரபு நாகராஜ் / Prabhu Nagaraj', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-013', fullName: 'சுகுமார் புனிதா / Sukumar Punitha', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },

  // Sheet 2 (14 to 26)
  { memberNumber: 'M-014', fullName: 'ரமேஷ் ஆனங்கூர் / Ramesh Anangur', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-015', fullName: 'நந்தகுமார் / Nandhakumar', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-016', fullName: 'சரவணன் பூசாரி தோட்டம் / Saravanan Poosari Thottam', phone: '', email: null, address: 'பூசாரி தோட்டம் / Poosari Thottam', status: 'ACTIVE' },
  { memberNumber: 'M-017', fullName: 'கோபிநாத் கணேசன் / Gopinath Ganesan', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-018', fullName: 'கணேசன் ஆண்டிகாடு / Ganesan Andikadu', phone: '', email: null, address: 'ஆண்டிகாடு / Andikadu', status: 'ACTIVE' },
  { memberNumber: 'M-019', fullName: 'முத்துக்குமார் மெடிக்கல் / Muthukumar Medical', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-020', fullName: 'சிவக்குமார் நாவாலக்காடு / Sivakumar Navalakkadu', phone: '', email: null, address: 'நாவாலக்காடு / Navalakkadu', status: 'ACTIVE' },
  { memberNumber: 'M-021', fullName: 'சாரதா புள்ளிகவுண்டம்பாளையம் / Saradha Pulligoundampalayam', phone: '', email: null, address: 'புள்ளிகவுண்டம்பாளையம் / Pulligoundampalayam', status: 'ACTIVE' },
  { memberNumber: 'M-022', fullName: 'தேவா புள்ளிகவுண்டம்பாளையம் / Deva Pulligoundampalayam', phone: '', email: null, address: 'புள்ளிகவுண்டம்பாளையம் / Pulligoundampalayam', status: 'ACTIVE' },
  { memberNumber: 'M-023', fullName: 'சரவணன் ஐயாவு / Saravanan Ayyavu', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-024', fullName: 'மயில்சாமி, ஆனங்கூர் (1) / Mayilsamy Anangur (1)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-025', fullName: 'மயில்சாமி, ஆனங்கூர் (2) / Mayilsamy Anangur (2)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-026', fullName: 'அருண்குமார் முத்தான் / Arunkumar Muthan', phone: '', email: null, address: 'முத்தான் / Muthan', status: 'ACTIVE' },

  // Sheet 3 (27 to 39)
  { memberNumber: 'M-027', fullName: 'மோகன்ராஜ் கிளாக்காடு / Mohanraj Kilakkadu', phone: '', email: null, address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { memberNumber: 'M-028', fullName: 'சக்திவேல் கிளாக்காடு (1) / Sakthivel Kilakkadu (1)', phone: '', email: null, address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { memberNumber: 'M-029', fullName: 'சக்திவேல் கிளாக்காடு (2) / Sakthivel Kilakkadu (2)', phone: '', email: null, address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { memberNumber: 'M-030', fullName: 'யோகராஜ் கிளாக்காடு / Yogaraj Kilakkadu', phone: '', email: null, address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { memberNumber: 'M-031', fullName: 'பெரியசாமி கிளாக்காடு / Periyasamy Kilakkadu', phone: '', email: null, address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { memberNumber: 'M-032', fullName: 'தியாகராஜன் / Thiagarajan', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-033', fullName: 'ஸ்ரீ செந்தில் / Sri Senthil', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-034', fullName: 'நந்தகுமார் குமாரபாளையம் / Nandhakumar Kumarapalayam', phone: '', email: null, address: 'குமாரபாளையம் / Kumarapalayam', status: 'ACTIVE' },
  { memberNumber: 'M-035', fullName: 'சேகர் குமாரபாளையம் / Sekar Kumarapalayam', phone: '', email: null, address: 'குமாரபாளையம் / Kumarapalayam', status: 'ACTIVE' },
  { memberNumber: 'M-036', fullName: 'சின்னசாமி பேங்க் / Chinnasamy Bank', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-037', fullName: 'திருமூர்த்தி ஆனந்த் / Thirumoorthy Anand', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-038', fullName: 'செல்வம் புள்ளிகவுண்டம்பாளையம் / Selvam Pulligoundampalayam', phone: '', email: null, address: 'புள்ளிகவுண்டம்பாளையம் / Pulligoundampalayam', status: 'ACTIVE' },
  { memberNumber: 'M-039', fullName: 'ஜெயப்பிரகாஷ் கம்புக்காரர் / Jayaprakash Kambukkarar', phone: '', email: null, address: 'கம்புக்காரர் / Kambukkarar', status: 'ACTIVE' },

  // Sheet 4 (40 to 52)
  { memberNumber: 'M-040', fullName: 'செந்தில் வாத்தியார் (1) / Senthil Vathiyar (1)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-041', fullName: 'செந்தில் வாத்தியார் (2) / Senthil Vathiyar (2)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-042', fullName: 'ராசு கள்ளங்காடு (1) / Rasu Kallankadu (1)', phone: '', email: null, address: 'கள்ளங்காடு / Kallankadu', status: 'ACTIVE' },
  { memberNumber: 'M-043', fullName: 'ராசு கள்ளங்காடு (2) / Rasu Kallankadu (2)', phone: '', email: null, address: 'கள்ளங்காடு / Kallankadu', status: 'ACTIVE' },
  { memberNumber: 'M-044', fullName: 'ஜோதி செல்வம் / Jothi Selvam', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-045', fullName: 'செல்வம் ஜோதி / Selvam Jothi', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-046', fullName: 'ராஜ்குமார் சின்னக்காடு / Rajkumar Chinnakkadu', phone: '', email: null, address: 'சின்னக்காடு / Chinnakkadu', status: 'ACTIVE' },
  { memberNumber: 'M-047', fullName: 'கீர்த்தி காளியப்பன் / Keerthi Kaliappan', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-048', fullName: 'ராஜேஷ்குமார் மெட்ராஸ் / Rajeshkumar Madras', phone: '', email: null, address: 'மெட்ராஸ் / Chennai', status: 'ACTIVE' },
  { memberNumber: 'M-049', fullName: 'சின்னசாமி விக்னேஷ் / Chinnasamy Vignesh', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-050', fullName: 'ராஜ்குமார் சுப்ரமணி (1) / Rajkumar Subramani (1)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-051', fullName: 'ராஜ்குமார் சுப்ரமணி (2) / Rajkumar Subramani (2)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-052', fullName: 'பிரபு ஹைடெக் / Prabhu Hitech', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },

  // Sheet 5 (53 to 65)
  { memberNumber: 'M-053', fullName: 'சதீஸ்குமார், ஆனங்கூர் / Satheeshkumar Anangur', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-054', fullName: 'சதீஸ்குமார் (2) / Satheeshkumar (2)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-055', fullName: 'சதீஸ்குமார் (3) / Satheeshkumar (3)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-056', fullName: 'சதீஸ்குமார் (4) / Satheeshkumar (4)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-057', fullName: 'சதீஸ்குமார் (5) / Satheeshkumar (5)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-058', fullName: 'கண்ணன் எஸ் ஆர் (1) / Kannan S.R (1)', phone: '', email: null, address: 'எஸ் ஆர் / S.R, ஆனங்கூர்', status: 'ACTIVE' },
  { memberNumber: 'M-059', fullName: 'கண்ணன் எஸ் ஆர் (2) / Kannan S.R (2)', phone: '', email: null, address: 'எஸ் ஆர் / S.R, ஆனங்கூர்', status: 'ACTIVE' },
  { memberNumber: 'M-060', fullName: 'வெங்கடாசலம் இன்ஜினி ஆண்டிகாடு / Venkatachalam Engineer Andikadu', phone: '', email: null, address: 'ஆண்டிகாடு / Andikadu', status: 'ACTIVE' },
  { memberNumber: 'M-061', fullName: 'பாலு ஆண்டிகாடு / Balu Andikadu', phone: '', email: null, address: 'ஆண்டிகாடு / Andikadu', status: 'ACTIVE' },
  { memberNumber: 'M-062', fullName: 'ரமேஷ் பரமக்காடு / Ramesh Paramakkadu', phone: '', email: null, address: 'பரமக்காடு / Paramakkadu', status: 'ACTIVE' },
  { memberNumber: 'M-063', fullName: 'அர்ஜுனன் ஆண்டிகாடு / Arjunan Andikadu', phone: '', email: null, address: 'ஆண்டிகாடு / Andikadu', status: 'ACTIVE' },
  { memberNumber: 'M-064', fullName: 'பிரகாஷ் சுப்பிரமணி / Prakash Subramani', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-065', fullName: 'ராஜா நெரிஞ்சிக்கொரை / Raja Nerinjikkorai', phone: '', email: null, address: 'நெரிஞ்சிக்கொரை / Nerinjikkorai', status: 'ACTIVE' },

  // Sheet 6 (66 to 78)
  { memberNumber: 'M-066', fullName: 'கார்த்தி திண்டுக்கல் / Karthi Dindigul', phone: '', email: null, address: 'திண்டுக்கல் / Dindigul', status: 'ACTIVE' },
  { memberNumber: 'M-067', fullName: 'விஸ்வநாதன் அட்வகேட் / Viswanathan Advocate', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-068', fullName: 'கார்த்தி ஐயன் தோட்டம் / Karthi Ayyan Thottam', phone: '', email: null, address: 'ஐயன் தோட்டம் / Ayyan Thottam', status: 'ACTIVE' },
  { memberNumber: 'M-069', fullName: 'நவீன் வேப்பங்காடு (1) / Naveen Veppankadu (1)', phone: '', email: null, address: 'வேப்பங்காடு / Veppankadu', status: 'ACTIVE' },
  { memberNumber: 'M-070', fullName: 'நவீன் வேப்பங்காடு (2) / Naveen Veppankadu (2)', phone: '', email: null, address: 'வேப்பங்காடு / Veppankadu', status: 'ACTIVE' },
  { memberNumber: 'M-071', fullName: 'தங்கராஜ் வேப்பங்காடு / Thangaraj Veppankadu', phone: '', email: null, address: 'வேப்பங்காடு / Veppankadu', status: 'ACTIVE' },
  { memberNumber: 'M-072', fullName: 'ராஜசேகர் தாசில்தார் / Rajasekar Tahsildar', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-073', fullName: 'கண்ணன் தங்கவேல் (1) / Kannan Thangavel (1)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-074', fullName: 'கண்ணன் தங்கவேல் (2) / Kannan Thangavel (2)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { memberNumber: 'M-075', fullName: 'பிரவீன் சாணிகாடு / Praveen Sanikkadu', phone: '', email: null, address: 'சாணிகாடு / Sanikkadu', status: 'ACTIVE' },
  { memberNumber: 'M-076', fullName: 'சந்திரசேகர் நாராயணிபாளையம் / Chandrasekar Narayanipalayam', phone: '', email: null, address: 'நாராயணிபாளையம் / Narayanipalayam', status: 'ACTIVE' },
  { memberNumber: 'M-077', fullName: 'ஜெகதீஷ் நாராயணிபாளையம் / Jegadeesh Narayanipalayam', phone: '', email: null, address: 'நாராயணிபாளையம் / Narayanipalayam', status: 'ACTIVE' },
  { memberNumber: 'M-078', fullName: 'ஸ்ரீ பட்டணத்து மாரியம்மன் / Sri Pattanathu Mariamman (Temple Chit Ticket)', phone: '', email: null, address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
];

async function main() {
  console.log('--- Seeding Official Sri Pattanathu Mariamman Anangur Seettu Kuzhu Database ---');

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

  // 1. Create all 78 official members from the verified sheet
  console.log(`Creating ${memberData.length} official members...`);
  const members: any[] = [];
  for (const m of memberData) {
    const created = await prisma.member.create({ data: m });
    members.push(created);
  }

  // 2. Create Users (Admin, Staff, Member)
  console.log('Creating Admin, Staff, and Member users...');
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

  // Link User accounts for all 78 members (Password = Member Name)
  console.log('Creating User accounts for all 78 members (Name as password)...');
  for (const m of members) {
    const passwordHash = await bcrypt.hash(m.fullName, 10);
    const memberUser = await prisma.user.create({
      data: {
        email: m.email || `${m.memberNumber.toLowerCase()}@seettu.local`,
        passwordHash,
        name: m.fullName,
        role: 'MEMBER',
        phone: m.phone,
        memberId: m.id,
        isActive: true,
      },
    });

    await prisma.member.update({
      where: { id: m.id },
      data: { userId: memberUser.id },
    });
  }

  // 3. Create Official Chit Scheme: சீட்டு எண் : 08
  console.log('Creating Official Scheme 08 (தேதி : 25.10.26 | ₹10,000 / மாதம்)...');
  const schemeStartDate = new Date(2026, 9, 25); // 25.10.2026
  const schemeEndDate = new Date(2028, 5, 25); // 20 monthly rounds

  const scheme08 = await prisma.scheme.create({
    data: {
      code: 'SCH-CHIT-08',
      name: 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு எண்: 08 (Chit No: 08)',
      schemeType: 'ROTATING_CHIT',
      startDate: schemeStartDate,
      endDate: schemeEndDate,
      totalInstallments: 20,
      frequency: 'MONTHLY',
      contributionAmountPaise: 1000000, // ₹10,000 per member per month
      totalPoolAmountPaise: 78000000, // ₹7,80,000 (78 members * ₹10,000)
      totalMembersCount: 78,
      organizerCommissionPaise: 2500000, // ₹25,000
      status: 'ACTIVE',
      notes: 'அதிகாரப்பூர்வ மாதாந்திர சீட்டு எண் 08. ஒவ்வொரு பௌர்ணமி அன்றும் சீட்டு குலுக்கல், ஏலம் மற்றும் புதிய தவணை வசூல் நடைபெறும்.',
    },
  });

  // 4. Enroll all 78 members in Scheme 08
  console.log('Enrolling all 78 members into Scheme 08...');
  for (let idx = 0; idx < members.length; idx++) {
    await prisma.schemeMembership.create({
      data: {
        schemeId: scheme08.id,
        memberId: members[idx].id,
        slotNumber: idx + 1,
        hasReceivedPayout: false,
        payoutRoundNumber: null,
      },
    });
  }

  // 5. Create 20 monthly collection rounds aligned to Pournami
  console.log('Creating collection rounds...');
  const rounds: any[] = [];
  for (let r = 1; r <= 20; r++) {
    const dueDate = new Date(schemeStartDate);
    dueDate.setMonth(dueDate.getMonth() + (r - 1));

    const status = r === 1 ? 'COLLECTING' : 'PENDING';
    const round = await prisma.collectionRound.create({
      data: {
        schemeId: scheme08.id,
        roundNumber: r,
        dueDate,
        targetAmountPaise: 78000000,
        collectedAmountPaise: 0,
        status,
      },
    });
    rounds.push(round);
  }

  // 6. Record sample initial contributions for Round 1
  console.log('Recording sample contributions for Round 1...');
  const round1 = rounds[0];
  let totalCollectedPaise = 0;

  for (let i = 0; i < 5; i++) {
    const m = members[i];
    const amount = 1000000; // ₹10,000
    const payment = await prisma.payment.create({
      data: {
        schemeId: scheme08.id,
        memberId: m.id,
        roundNumber: 1,
        amountDuePaise: amount,
        amountReceivedPaise: amount,
        balanceRemainingPaise: 0,
        paymentDate: new Date(),
        paymentMethod: 'CASH',
        recordedByUserId: staffUser.id,
        transactionId: `TXN-2026-08-${String(i + 1).padStart(3, '0')}`,
        receiptNumber: `RCT-2026-08-${String(i + 1).padStart(3, '0')}`,
        status: 'SUCCESS',
        notes: `தவணை 1 வசூல் - சீட்டு எண் 08 (${m.fullName})`,
      },
    });

    await prisma.receipt.create({
      data: {
        receiptNumber: payment.receiptNumber,
        paymentId: payment.id,
        memberId: m.id,
        schemeId: scheme08.id,
        amountPaise: amount,
      },
    });
    totalCollectedPaise += amount;
  }

  await prisma.collectionRound.update({
    where: { id: round1.id },
    data: { collectedAmountPaise: totalCollectedPaise },
  });

  // 7. System Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_SEEDED',
      entityType: 'System',
      entityId: 'ALL',
      details: JSON.stringify({
        organization: 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு',
        totalMembers: 78,
        scheme: 'சீட்டு எண் : 08',
        monthlyContribution: '₹10,000',
        date: '25.10.2026',
      }),
      ipAddress: '127.0.0.1',
    },
  });

  console.log('--- Database seeding completed successfully! ---');
  console.log(`Total Members: ${members.length}`);
  console.log(`Official Scheme: ${scheme08.name}`);
  console.log(`Admin User: admin@seettu.com / admin123`);
  console.log(`Staff User: staff@seettu.com / staff123`);
  console.log(`Member User: member@seettu.com / member123 (${members[0].fullName})`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
