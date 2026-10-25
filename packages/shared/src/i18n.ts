export type SupportedLanguage = 'en' | 'ta';

export interface Translations {
  // App & Brand
  appName: string;
  appSubtitle: string;
  tagline: string;
  timezoneNotice: string;
  currencyNotice: string;
  liveDbConnected: string;

  // Nav items
  dashboard: string;
  members: string;
  schemes: string;
  payments: string;
  payouts: string;
  reports: string;
  notifications: string;
  staff: string;
  audit: string;
  settings: string;
  signOut: string;
  signIn: string;

  // Auth
  signInTitle: string;
  emailAddress: string;
  password: string;
  signInButton: string;
  quickDemoRoles: string;
  adminRole: string;
  staffRole: string;
  memberRole: string;
  welcomeBack: string;

  // Dashboard Stats
  totalCollected: string;
  expectedThisMonth: string;
  outstandingBalance: string;
  totalPayouts: string;
  totalContributed: string;
  enrolledSchemes: string;
  monthlyTrends: string;
  memberParticipation: string;
  paidMembers: string;
  pendingMembers: string;
  recentTransactions: string;
  viewFullLedger: string;
  recordNewContribution: string;
  upcomingInstallments: string;
  noPendingDues: string;

  // Members Screen
  memberDirectory: string;
  memberId: string;
  fullName: string;
  contact: string;
  phoneNumber: string;
  emailOptional: string;
  address: string;
  status: string;
  active: string;
  inactive: string;
  suspended: string;
  addMember: string;
  saveMember: string;
  cancel: string;
  exportCsv: string;
  allStatus: string;
  searchPlaceholder: string;
  profileAndLedger: string;
  enrolledSchemesTitle: string;
  recentPaymentsTitle: string;
  noMembersFound: string;

  // Schemes Screen
  schemesTitle: string;
  schemesSubtitle: string;
  createNewScheme: string;
  schemeCode: string;
  schemeName: string;
  schemeType: string;
  rotatingChit: string;
  fixedSavings: string;
  installmentAmount: string;
  totalMembers: string;
  totalInstallments: string;
  totalPoolPerRound: string;
  organizerFee: string;
  startDate: string;
  initializeScheme: string;
  viewDetailsAndRounds: string;
  collectionSchedule: string;
  roundNumber: string;
  dueDate: string;
  winnerAwarded: string;

  // Payments & Ledger
  paymentsLedger: string;
  paymentsSubtitle: string;
  receiptNumber: string;
  amountReceived: string;
  paymentMethod: string;
  upi: string;
  cash: string;
  bankTransfer: string;
  chequeOther: string;
  txnReference: string;
  recordPayment: string;
  recordAndGenerateReceipt: string;
  officialReceipt: string;
  printReceipt: string;
  viewReceipt: string;
  remainingBalance: string;
  reversePayment: string;
  reversalReason: string;
  confirmReversal: string;
  roundInstallmentDue: string;
  authorizedSignatory: string;

  // Payouts Screen
  payoutsTitle: string;
  payoutsSubtitle: string;
  recipient: string;
  grossPayout: string;
  deductions: string;
  netPayout: string;
  approvalStatus: string;
  disbursedRef: string;
  approve: string;
  reject: string;
  disburseFunds: string;
  disburseMethod: string;
  confirmDisbursement: string;

  // Reports
  cashFlowTitle: string;
  totalDisbursed: string;
  organizerMargin: string;
  netCashInVault: string;
  schemeSummary: string;
  overdueReportTitle: string;
  progress: string;

  // Notifications
  notificationsInbox: string;
  markAllAsRead: string;
  noNotifications: string;

  // Staff & Settings
  staffManagement: string;
  staffSubtitle: string;
  addStaffAccount: string;
  auditTrailTitle: string;
  auditSubtitle: string;
  regionalConfig: string;
  currencyStandard: string;
  timezoneLabel: string;
  connectedApiEndpoints: string;
  dbBackupTitle: string;
  createDbSnapshot: string;
  languageSelect: string;
  dayMode: string;
  nightMode: string;
  themeToggle: string;
  calendar: string;
  calendarTitle: string;
  calendarSubtitle: string;
  pournamiFullMoon: string;
  amavasaiNoMoon: string;
  chitDayBadge: string;
  nextChitDay: string;
  nextAmavasai: string;
  daysRemaining: string;
  todayIsChitDay: string;
  yearlyLunarSchedule: string;
  lunarNotice: string;
  dayShortSun: string;
  dayShortMon: string;
  dayShortTue: string;
  dayShortWed: string;
  dayShortThu: string;
  dayShortFri: string;
  dayShortSat: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'Sri Pattanathu Mariamman Anangur Seettu Kuzhu',
    appSubtitle: 'Chit Fund & Rotational Savings Management',
    tagline: 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு',
    timezoneNotice: 'Asia/Kolkata • INR',
    currencyNotice: 'Arithmetic computed in integer minor units (paise).',
    liveDbConnected: 'Live Database Connected',

    dashboard: 'Dashboard',
    members: 'Members',
    schemes: 'Chit Schemes',
    payments: 'Payments Ledger',
    payouts: 'Payouts',
    reports: 'Financial Reports',
    notifications: 'Notifications',
    staff: 'Staff & Roles',
    audit: 'Audit Trail',
    settings: 'Settings',
    signOut: 'Sign Out',
    signIn: 'Sign In',

    signInTitle: 'Sign In to System',
    emailAddress: 'Email Address',
    password: 'Password',
    signInButton: 'Sign In to System',
    quickDemoRoles: 'Quick Demo Accounts',
    adminRole: 'Admin',
    staffRole: 'Staff',
    memberRole: 'Member',
    welcomeBack: 'Welcome back',

    totalCollected: 'Total Collected',
    expectedThisMonth: 'Expected This Month',
    outstandingBalance: 'Outstanding Balance',
    totalPayouts: 'Total Payouts',
    totalContributed: 'Total Contributed',
    enrolledSchemes: 'Enrolled Schemes',
    monthlyTrends: 'Monthly Collections vs Payouts',
    memberParticipation: 'Member Participation',
    paidMembers: 'Paid Members',
    pendingMembers: 'Pending Members',
    recentTransactions: 'Recent Transactions',
    viewFullLedger: 'View Full Ledger',
    recordNewContribution: 'Record New Contribution',
    upcomingInstallments: 'Upcoming Installments',
    noPendingDues: 'No pending dues at this moment.',

    memberDirectory: 'Registered Members',
    memberId: 'Member ID',
    fullName: 'Full Name',
    contact: 'Contact',
    phoneNumber: 'Phone Number',
    emailOptional: 'Email (Optional)',
    address: 'Address',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    addMember: 'Add Member',
    saveMember: 'Save Member',
    cancel: 'Cancel',
    exportCsv: 'Export CSV',
    allStatus: 'All Status',
    searchPlaceholder: 'Search by ID, name, or phone...',
    profileAndLedger: 'Profile & Ledger',
    enrolledSchemesTitle: 'Enrolled Schemes',
    recentPaymentsTitle: 'Recent Payments',
    noMembersFound: 'No member records found.',

    schemesTitle: 'Seettu Savings & Chit Schemes',
    schemesSubtitle: 'Manage pool funds, collection rounds, and member assignments',
    createNewScheme: 'Create New Scheme',
    schemeCode: 'Scheme Code',
    schemeName: 'Scheme Name',
    schemeType: 'Scheme Type',
    rotatingChit: 'Monthly Rotating Chit',
    fixedSavings: 'Fixed Pool Savings',
    installmentAmount: 'Installment Amount (₹)',
    totalMembers: 'Total Members',
    totalInstallments: 'Installments Count',
    totalPoolPerRound: 'Total Pool / Round',
    organizerFee: 'Organizer Fee (₹)',
    startDate: 'Start Date',
    initializeScheme: 'Initialize Scheme',
    viewDetailsAndRounds: 'View Details & Rounds',
    collectionSchedule: 'Collection Rounds Schedule',
    roundNumber: 'Round Number',
    dueDate: 'Due Date',
    winnerAwarded: 'Winner Awarded',

    paymentsLedger: 'Financial Payments Ledger',
    paymentsSubtitle: 'Complete immutable record of all installments and receipts',
    receiptNumber: 'Receipt #',
    amountReceived: 'Amount Received',
    paymentMethod: 'Payment Method',
    upi: 'UPI / QR Code',
    cash: 'Cash',
    bankTransfer: 'Bank Transfer / NEFT',
    chequeOther: 'Cheque / Other',
    txnReference: 'Txn Reference',
    recordPayment: 'Record Payment',
    recordAndGenerateReceipt: 'Record & Generate Receipt',
    officialReceipt: 'Official Receipt',
    printReceipt: 'Print Receipt',
    viewReceipt: 'View Receipt',
    remainingBalance: 'Remaining Balance',
    reversePayment: 'Reverse Payment',
    reversalReason: 'Reason for Reversal',
    confirmReversal: 'Confirm Reversal',
    roundInstallmentDue: 'Round Installment Due',
    authorizedSignatory: 'Authorized Signatory',

    payoutsTitle: 'Prize Pool & Payout Management',
    payoutsSubtitle: 'Preparation, Multi-tier Admin Approvals, and Disbursement',
    recipient: 'Recipient',
    grossPayout: 'Gross Payout',
    deductions: 'Deductions',
    netPayout: 'Net Payout',
    approvalStatus: 'Approval Status',
    disbursedRef: 'Disbursed Ref',
    approve: 'Approve',
    reject: 'Reject',
    disburseFunds: 'Disburse Funds',
    disburseMethod: 'Disbursement Method',
    confirmDisbursement: 'Confirm Disbursement',

    cashFlowTitle: 'Cash-Flow Reconciliation',
    totalDisbursed: 'Total Disbursed',
    organizerMargin: 'Auction / Organizer Margin',
    netCashInVault: 'Net Cash in Vault / Bank',
    schemeSummary: 'Scheme Financial Summary',
    overdueReportTitle: 'Overdue / Outstanding Member Installments',
    progress: 'Progress',

    notificationsInbox: 'In-App Notifications',
    markAllAsRead: 'Mark All as Read',
    noNotifications: 'No notifications in your inbox.',

    staffManagement: 'Staff & Access Permissions',
    staffSubtitle: 'Configure role-based access for system administrators and field collection staff',
    addStaffAccount: 'Add Staff Account',
    auditTrailTitle: 'System Audit Trail & Security Logs',
    auditSubtitle: 'Immutable record of financial transactions, administrative actions, and logins',
    regionalConfig: 'System & Regional Configuration',
    currencyStandard: 'Currency Standard',
    timezoneLabel: 'Timezone',
    connectedApiEndpoints: 'Connected API Endpoints',
    dbBackupTitle: 'Database Backup & Recovery',
    createDbSnapshot: 'Create Database Snapshot',
    languageSelect: 'Language / மொழி',
    dayMode: 'Day Mode',
    nightMode: 'Night Mode',
    themeToggle: 'Switch Day/Night Mode',
    calendar: 'Chit Calendar',
    calendarTitle: 'Auspicious Chit & Lunar Calendar',
    calendarSubtitle: 'Chit draws and collections are held on every Full Moon Day (Pournami)',
    pournamiFullMoon: 'Full Moon (Pournami) 🌕',
    amavasaiNoMoon: 'No Moon (Amavasai) 🌑',
    chitDayBadge: 'Chit Draw & Collection Day',
    nextChitDay: 'Next Chit Draw (Pournami)',
    nextAmavasai: 'Next Amavasai (No Moon)',
    daysRemaining: 'days remaining',
    todayIsChitDay: '🌕 Today is Full Moon (Pournami) — Chit Draw Day!',
    yearlyLunarSchedule: 'Yearly Auspicious Lunar Schedule',
    lunarNotice: 'In accordance with temple tradition, rotating chit draws, lucky auctions, and monthly collections occur on every Pournami.',
    dayShortSun: 'Sun',
    dayShortMon: 'Mon',
    dayShortTue: 'Tue',
    dayShortWed: 'Wed',
    dayShortThu: 'Thu',
    dayShortFri: 'Fri',
    dayShortSat: 'Sat',
  },

  ta: {
    appName: 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு',
    appSubtitle: 'சீட்டு நிதி மற்றும் சுழற்சி சேமிப்பு நிர்வாக அமைப்பு',
    tagline: 'ஆனங்கூர் • மாதாந்திர சுழற்சி சீட்டு சேமிப்பு',
    timezoneNotice: 'இந்தியா / கொல்கத்தா • ரூபாய் (₹)',
    currencyNotice: 'நிதி கணக்கீடுகள் பைசா (முழு எண்) துல்லியத்தில் கணக்கிடப்படுகின்றன.',
    liveDbConnected: 'தரவுத்தளத்துடன் நேரலையாக இணைக்கப்பட்டுள்ளது',

    dashboard: 'முகப்பு பலகை',
    members: 'உறுப்பினர்கள்',
    schemes: 'சீட்டுத் திட்டங்கள்',
    payments: 'கட்டணப் பதிவேடு',
    payouts: 'பட்டுவாடா / பரிசு',
    reports: 'நிதி அறிக்கைகள்',
    notifications: 'அறிவிப்புகள்',
    staff: 'பணியாளர்கள்',
    audit: 'தணிக்கைப் பதிவு',
    settings: 'அமைப்புகள்',
    signOut: 'வெளியேறுக',
    signIn: 'உள்நுழைக',

    signInTitle: 'கணக்கில் உள்நுழைக',
    emailAddress: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    signInButton: 'உள்நுழைக',
    quickDemoRoles: 'மாதிரி கணக்குகள்',
    adminRole: 'நிர்வாகி (Admin)',
    staffRole: 'பணியாளர் (Staff)',
    memberRole: 'உறுப்பினர் (Member)',
    welcomeBack: 'நல்வரவு',

    totalCollected: 'மொத்த வசூல்',
    expectedThisMonth: 'இந்த மாத எதிர்பார்ப்பு',
    outstandingBalance: 'நிலுவைத் தொகை',
    totalPayouts: 'வழங்கப்பட்ட சீட்டுத் தொகை',
    totalContributed: 'மொத்த பங்களிப்பு',
    enrolledSchemes: 'இணைந்த சீட்டுகள்',
    monthlyTrends: 'மாதாந்திர வசூல் vs பட்டுவாடா',
    memberParticipation: 'உறுப்பினர் பங்களிப்பு நிலை',
    paidMembers: 'செலுத்திய உறுப்பினர்கள்',
    pendingMembers: 'நிலுவை வைத்துள்ளவர்கள்',
    recentTransactions: 'சமீபத்திய பரிவர்த்தனைகள்',
    viewFullLedger: 'முழு பதிவேட்டைக் காண்க',
    recordNewContribution: 'புதிய தவணை வசூலிக்க',
    upcomingInstallments: 'வரவிருக்கும் தவணைகள்',
    noPendingDues: 'தற்போது நிலுவைத் தவணைகள் ஏதுமில்லை.',

    memberDirectory: 'பதிவுசெய்யப்பட்ட உறுப்பினர்கள்',
    memberId: 'உறுப்பினர் எண்',
    fullName: 'முழு பெயர்',
    contact: 'தொடர்பு எண்',
    phoneNumber: 'தொலைபேசி எண்',
    emailOptional: 'மின்னஞ்சல் (விருப்பத்தேர்வு)',
    address: 'முகவரி',
    status: 'நிலை',
    active: 'செயலில்',
    inactive: 'செயலற்ற',
    suspended: 'நிறுத்திவைக்கப்பட்டது',
    addMember: 'உறுப்பினர் சேர்க்க',
    saveMember: 'உறுப்பினரைச் சேமிக்க',
    cancel: 'ரத்து செய்',
    exportCsv: 'CSV பதிவிறக்கு',
    allStatus: 'அனைத்து நிலை',
    searchPlaceholder: 'எண், பெயர் அல்லது தொலைபேசி மூலம் தேடுக...',
    profileAndLedger: 'சுயவிவரம் & கணக்கு',
    enrolledSchemesTitle: 'இணைக்கப்பட்டுள்ள சீட்டுத் திட்டங்கள்',
    recentPaymentsTitle: 'சமீபத்திய கட்டணங்கள்',
    noMembersFound: 'உறுப்பினர் தகவல்கள் ஏதும் இல்லை.',

    schemesTitle: 'சீட்டு நிதி திட்டங்கள்',
    schemesSubtitle: 'சீட்டுத் தொகை, வசூல் சுற்றுகள் மற்றும் உறுப்பினர் ஒதுக்கீடுகள்',
    createNewScheme: 'புதிய சீட்டுத் திட்டம் தொடங்க',
    schemeCode: 'சீட்டுக் குறியீடு',
    schemeName: 'சீட்டின் பெயர்',
    schemeType: 'சீட்டு வகை',
    rotatingChit: 'மாதாந்திர சுழற்சி சீட்டு',
    fixedSavings: 'நிலையான சேமிப்புத் திட்டம்',
    installmentAmount: 'தவணைத் தொகை (₹)',
    totalMembers: 'மொத்த உறுப்பினர்கள்',
    totalInstallments: 'மொத்த தவணைகள்',
    totalPoolPerRound: 'ஒரு சுற்றின் மொத்தத் தொகை',
    organizerFee: 'அமைப்பாளர் கழிவு (₹)',
    startDate: 'தொடக்கத் தேதி',
    initializeScheme: 'திட்டத்தை உருவாக்கு',
    viewDetailsAndRounds: 'விவரங்கள் & சுற்றுகள்',
    collectionSchedule: 'வசூல் சுற்றுகள் அட்டவணை',
    roundNumber: 'சுற்று எண்',
    dueDate: 'செலுத்த வேண்டிய தேதி',
    winnerAwarded: 'வெற்றி பெற்றவர்',

    paymentsLedger: 'கட்டணப் பரிவர்த்தனை பதிவேடு',
    paymentsSubtitle: 'அனைத்து தவணை கட்டணங்கள் மற்றும் ரசீதுகளின் மாற்றமுடியாத கணக்கு',
    receiptNumber: 'ரசீது எண்',
    amountReceived: 'பெறப்பட்ட தொகை',
    paymentMethod: 'செலுத்தும் முறை',
    upi: 'யூபிஐ (UPI / QR)',
    cash: 'ரொக்கம் (Cash)',
    bankTransfer: 'வங்கிப் பரிமாற்றம் (NEFT)',
    chequeOther: 'காசோலை / இதர',
    txnReference: 'பரிவர்த்தனை குறிப்பு எண்',
    recordPayment: 'கட்டணம் பதிவு செய்க',
    recordAndGenerateReceipt: 'பதிவு செய்து ரசீது வழங்குக',
    officialReceipt: 'அதிகாரப்பூர்வ ரசீது',
    printReceipt: 'ரசீது அச்சிடுக',
    viewReceipt: 'ரசீது காண்க',
    remainingBalance: 'மீதமுள்ள நிலுவை',
    reversePayment: 'கட்டணத்தை ரத்து செய்க',
    reversalReason: 'ரத்து செய்வதற்கான காரணம்',
    confirmReversal: 'ரத்து செய்வதை உறுதிசெய்க',
    roundInstallmentDue: 'சுற்றுக்கான தவணைத் தொகை',
    authorizedSignatory: 'அங்கீகரிக்கப்பட்ட கையொப்பம்',

    payoutsTitle: 'சீட்டுப் பரிசு & பட்டுவாடா நிர்வாகம்',
    payoutsSubtitle: 'பரிசு தயாரிப்பு, நிர்வாக ஒப்புதல் மற்றும் பணப் பட்டுவாடா',
    recipient: 'பரிசு பெறுபவர்',
    grossPayout: 'மொத்த சீட்டுத் தொகை',
    deductions: 'கழிவு / தள்ளுபடி',
    netPayout: 'நிகர பட்டுவாடாத் தொகை',
    approvalStatus: 'ஒப்புதல் நிலை',
    disbursedRef: 'பட்டுவாடா குறிப்பு எண்',
    approve: 'ஒப்புதல் அளி',
    reject: 'நிராகரி',
    disburseFunds: 'பணத்தை வழங்குக',
    disburseMethod: 'வழங்கும் முறை',
    confirmDisbursement: 'பட்டுவாடாவை உறுதி செய்க',

    cashFlowTitle: 'பணப்புழக்க சமரசம் (Cash Flow)',
    totalDisbursed: 'மொத்த பட்டுவாடா',
    organizerMargin: 'அமைப்பாளர் வருவாய் / கழிவு',
    netCashInVault: 'கையிருப்பு / வங்கியில் உள்ள ரொக்கம்',
    schemeSummary: 'சீட்டு நிதி நிலை சுருக்கம்',
    overdueReportTitle: 'நிலுவை வைத்துள்ள உறுப்பினர்கள் அறிக்கை',
    progress: 'முன்னேற்றம்',

    notificationsInbox: 'அறிவிப்புப் பெட்டி',
    markAllAsRead: 'அனைத்தையும் படித்ததாகக் குறி',
    noNotifications: 'புதிய அறிவிப்புகள் ஏதுமில்லை.',

    staffManagement: 'பணியாளர்கள் & அணுகல் உரிமைகள்',
    staffSubtitle: 'நிர்வாகிகள் மற்றும் கள வசூல் பணியாளர்களுக்கான பங்குரிமை அமைப்புகள்',
    addStaffAccount: 'பணியாளர் கணக்கு உருவாக்குக',
    auditTrailTitle: 'பாதுகாப்பு & தணிக்கைப் பதிவேடு',
    auditSubtitle: 'பரிவர்த்தனைகள், நிர்வாக செயல்கள் மற்றும் உள்நுழைவுகளின் மாற்றமுடியாத பதிவு',
    regionalConfig: 'கணினி & பிராந்திய கட்டமைப்பு',
    currencyStandard: 'நாணய முறை',
    timezoneLabel: 'நேர மண்டலம்',
    connectedApiEndpoints: 'இணைக்கப்பட்ட API முகவரிகள்',
    dbBackupTitle: 'தரவுத்தள காப்பு & மீட்பு',
    createDbSnapshot: 'காப்பு நகல் எடுக்கவும் (Snapshot)',
    languageSelect: 'மொழி / Language',
    dayMode: 'பகல் பயன்முறை (Day)',
    nightMode: 'இரவு பயன்முறை (Night)',
    themeToggle: 'பகல் / இரவு வண்ணத்தை மாற்றுக',
    calendar: 'சீட்டு நாட்காட்டி',
    calendarTitle: 'மாதாந்திர பௌர்ணமி & அமாவாசை நாட்காட்டி',
    calendarSubtitle: 'அனைத்து சீட்டுத் தவணைகள், குலுக்கல் மற்றும் ஏலம் ஒவ்வொரு பௌர்ணமி நாளில் நடைபெறும்',
    pournamiFullMoon: 'பௌர்ணமி 🌕',
    amavasaiNoMoon: 'அமாவாசை 🌑',
    chitDayBadge: 'சீட்டு குலுக்கல் & வசூல் நாள்',
    nextChitDay: 'அடுத்த சீட்டு நாள் (பௌர்ணமி)',
    nextAmavasai: 'அடுத்த அமாவாசை',
    daysRemaining: 'நாட்கள் மீதமுள்ளன',
    todayIsChitDay: '🌕 இன்று பௌர்ணமி — சீட்டு குலுக்கல் நாள்!',
    yearlyLunarSchedule: 'வருடாந்திர பௌர்ணமி & அமாவாசை அட்டவணை',
    lunarNotice: 'ஸ்ரீ பட்டணத்து மாரியம்மன் திருக்கோவில் மரபுப்படி, மாதாந்திர சீட்டு வசூல் மற்றும் குலுக்கல் ஒவ்வொரு பௌர்ணமி நாளிலும் மிகச் சிறப்பாக நடைபெறும்.',
    dayShortSun: 'ஞாயிறு',
    dayShortMon: 'திங்கள்',
    dayShortTue: 'செவ்வாய்',
    dayShortWed: 'புதன்',
    dayShortThu: 'வியாழன்',
    dayShortFri: 'வெள்ளி',
    dayShortSat: 'சனி',
  },
};
