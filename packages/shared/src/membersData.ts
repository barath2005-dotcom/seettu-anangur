export interface OfficialMemberItem {
  memberNumber: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  sno: number;
  sheetNumber: number;
}

export const OFFICIAL_78_MEMBERS: OfficialMemberItem[] = [
  // Sheet 1 (1 to 13)
  { sno: 1, sheetNumber: 1, memberNumber: 'M-001', fullName: 'பழனிச்சாமி பி எல் ஆர் / Palanisamy B.L.R', phone: '9840100001', email: 'palanisamy.blr@seettu.com', address: 'பி எல் ஆர் / B.L.R, ஆனங்கூர்', status: 'ACTIVE' },
  { sno: 2, sheetNumber: 1, memberNumber: 'M-002', fullName: 'லோகநாதன் பி எல் ஆர் / Loganathan B.L.R', phone: '9840100002', email: 'loganathan.blr@seettu.com', address: 'பி எல் ஆர் / B.L.R, ஆனங்கூர்', status: 'ACTIVE' },
  { sno: 3, sheetNumber: 1, memberNumber: 'M-003', fullName: 'ராஜேஷ் கண்ணா (1) / Rajesh Khanna (1)', phone: '9840100003', email: 'rajeshkhanna1@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 4, sheetNumber: 1, memberNumber: 'M-004', fullName: 'ராஜேஷ் கண்ணா (2) / Rajesh Khanna (2)', phone: '9840100004', email: 'rajeshkhanna2@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 5, sheetNumber: 1, memberNumber: 'M-005', fullName: 'பிரகாஷ் புதூர் / Prakash Pudur', phone: '9840100005', email: 'prakash.pudur@seettu.com', address: 'புதூர் / Pudur', status: 'ACTIVE' },
  { sno: 6, sheetNumber: 1, memberNumber: 'M-006', fullName: 'தீபன் பழனிச்சாமி / Deepan Palanisamy', phone: '9840100006', email: 'deepan.palanisamy@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 7, sheetNumber: 1, memberNumber: 'M-007', fullName: 'கீதா சந்திரன் / Geetha Chandran', phone: '9840100007', email: 'geetha.chandran@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 8, sheetNumber: 1, memberNumber: 'M-008', fullName: 'பிரகாஷ் பண்டாரம் / Prakash Pandaram', phone: '9840100008', email: 'prakash.pandaram@seettu.com', address: 'பண்டாரம் / Pandaram', status: 'ACTIVE' },
  { sno: 9, sheetNumber: 1, memberNumber: 'M-009', fullName: 'ரஞ்சித், ஆனங்கூர் / Ranjith Anangur', phone: '9840100009', email: 'ranjith.anangur@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 10, sheetNumber: 1, memberNumber: 'M-010', fullName: 'தினேஷ் ஆனங்கூர் / Dinesh Anangur', phone: '9840100010', email: 'dinesh.anangur@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 11, sheetNumber: 1, memberNumber: 'M-011', fullName: 'செந்தில் வைரம் / Senthil Vairam', phone: '9840100011', email: 'senthil.vairam@seettu.com', address: 'வைரம் / Vairam', status: 'ACTIVE' },
  { sno: 12, sheetNumber: 1, memberNumber: 'M-012', fullName: 'பிரபு நாகராஜ் / Prabhu Nagaraj', phone: '9840100012', email: 'prabhu.nagaraj@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 13, sheetNumber: 1, memberNumber: 'M-013', fullName: 'சுகுமார் புனிதா / Sukumar Punitha', phone: '9840100013', email: 'sukumar.punitha@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },

  // Sheet 2 (14 to 26)
  { sno: 14, sheetNumber: 2, memberNumber: 'M-014', fullName: 'ரமேஷ் ஆனங்கூர் / Ramesh Anangur', phone: '9840100014', email: 'ramesh.anangur@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 15, sheetNumber: 2, memberNumber: 'M-015', fullName: 'நந்தகுமார் / Nandhakumar', phone: '9840100015', email: 'nandhakumar@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 16, sheetNumber: 2, memberNumber: 'M-016', fullName: 'சரவணன் பூசாரி தோட்டம் / Saravanan Poosari Thottam', phone: '9840100016', email: 'saravanan.poosari@seettu.com', address: 'பூசாரி தோட்டம் / Poosari Thottam', status: 'ACTIVE' },
  { sno: 17, sheetNumber: 2, memberNumber: 'M-017', fullName: 'கோபிநாத் கணேசன் / Gopinath Ganesan', phone: '9840100017', email: 'gopinath.ganesan@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 18, sheetNumber: 2, memberNumber: 'M-018', fullName: 'கணேசன் ஆண்டிகாடு / Ganesan Andikadu', phone: '9840100018', email: 'ganesan.andikadu@seettu.com', address: 'ஆண்டிகாடு / Andikadu', status: 'ACTIVE' },
  { sno: 19, sheetNumber: 2, memberNumber: 'M-019', fullName: 'முத்துக்குமார் மெடிக்கல் / Muthukumar Medical', phone: '9840100019', email: 'muthukumar.medical@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 20, sheetNumber: 2, memberNumber: 'M-020', fullName: 'சிவக்குமார் நாவாலக்காடு / Sivakumar Navalakkadu', phone: '9840100020', email: 'sivakumar.navalakkadu@seettu.com', address: 'நாவாலக்காடு / Navalakkadu', status: 'ACTIVE' },
  { sno: 21, sheetNumber: 2, memberNumber: 'M-021', fullName: 'சாரதா புள்ளிகவுண்டம்பாளையம் / Saradha Pulligoundampalayam', phone: '9840100021', email: 'saradha.pgp@seettu.com', address: 'புள்ளிகவுண்டம்பாளையம் / Pulligoundampalayam', status: 'ACTIVE' },
  { sno: 22, sheetNumber: 2, memberNumber: 'M-022', fullName: 'தேவா புள்ளிகவுண்டம்பாளையம் / Deva Pulligoundampalayam', phone: '9840100022', email: 'deva.pgp@seettu.com', address: 'புள்ளிகவுண்டம்பாளையம் / Pulligoundampalayam', status: 'ACTIVE' },
  { sno: 23, sheetNumber: 2, memberNumber: 'M-023', fullName: 'சரவணன் ஐயாவு / Saravanan Ayyavu', phone: '9840100023', email: 'saravanan.ayyavu@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 24, sheetNumber: 2, memberNumber: 'M-024', fullName: 'மயில்சாமி, ஆனங்கூர் (1) / Mayilsamy Anangur (1)', phone: '9840100024', email: 'mayilsamy1@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 25, sheetNumber: 2, memberNumber: 'M-025', fullName: 'மயில்சாமி, ஆனங்கூர் (2) / Mayilsamy Anangur (2)', phone: '9840100025', email: 'mayilsamy2@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 26, sheetNumber: 2, memberNumber: 'M-026', fullName: 'அருண்குமார் முத்தான் / Arunkumar Muthan', phone: '9840100026', email: 'arunkumar.muthan@seettu.com', address: 'முத்தான் / Muthan', status: 'ACTIVE' },

  // Sheet 3 (27 to 39)
  { sno: 27, sheetNumber: 3, memberNumber: 'M-027', fullName: 'மோகன்ராஜ் கிளாக்காடு / Mohanraj Kilakkadu', phone: '9840100027', email: 'mohanraj.kilakkadu@seettu.com', address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { sno: 28, sheetNumber: 3, memberNumber: 'M-028', fullName: 'சக்திவேல் கிளாக்காடு (1) / Sakthivel Kilakkadu (1)', phone: '9840100028', email: 'sakthivel1@seettu.com', address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { sno: 29, sheetNumber: 3, memberNumber: 'M-029', fullName: 'சக்திவேல் கிளாக்காடு (2) / Sakthivel Kilakkadu (2)', phone: '9840100029', email: 'sakthivel2@seettu.com', address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { sno: 30, sheetNumber: 3, memberNumber: 'M-030', fullName: 'யோகராஜ் கிளாக்காடு / Yogaraj Kilakkadu', phone: '9840100030', email: 'yogaraj.kilakkadu@seettu.com', address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { sno: 31, sheetNumber: 3, memberNumber: 'M-031', fullName: 'பெரியசாமி கிளாக்காடு / Periyasamy Kilakkadu', phone: '9840100031', email: 'periyasamy.kilakkadu@seettu.com', address: 'கிளாக்காடு / Kilakkadu', status: 'ACTIVE' },
  { sno: 32, sheetNumber: 3, memberNumber: 'M-032', fullName: 'தியாகராஜன் / Thiagarajan', phone: '9840100032', email: 'thiagarajan@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 33, sheetNumber: 3, memberNumber: 'M-033', fullName: 'ஸ்ரீ செந்தில் / Sri Senthil', phone: '9840100033', email: 'sri.senthil@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 34, sheetNumber: 3, memberNumber: 'M-034', fullName: 'நந்தகுமார் குமாரபாளையம் / Nandhakumar Kumarapalayam', phone: '9840100034', email: 'nandhakumar.kp@seettu.com', address: 'குமாரபாளையம் / Kumarapalayam', status: 'ACTIVE' },
  { sno: 35, sheetNumber: 3, memberNumber: 'M-035', fullName: 'சேகர் குமாரபாளையம் / Sekar Kumarapalayam', phone: '9840100035', email: 'sekar.kp@seettu.com', address: 'குமாரபாளையம் / Kumarapalayam', status: 'ACTIVE' },
  { sno: 36, sheetNumber: 3, memberNumber: 'M-036', fullName: 'சின்னசாமி பேங்க் / Chinnasamy Bank', phone: '9840100036', email: 'chinnasamy.bank@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 37, sheetNumber: 3, memberNumber: 'M-037', fullName: 'திருமூர்த்தி ஆனந்த் / Thirumoorthy Anand', phone: '9840100037', email: 'thirumoorthy.anand@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 38, sheetNumber: 3, memberNumber: 'M-038', fullName: 'செல்வம் புள்ளிகவுண்டம்பாளையம் / Selvam Pulligoundampalayam', phone: '9840100038', email: 'selvam.pgp@seettu.com', address: 'புள்ளிகவுண்டம்பாளையம் / Pulligoundampalayam', status: 'ACTIVE' },
  { sno: 39, sheetNumber: 3, memberNumber: 'M-039', fullName: 'ஜெயப்பிரகாஷ் கம்புக்காரர் / Jayaprakash Kambukkarar', phone: '9840100039', email: 'jayaprakash.kambukkarar@seettu.com', address: 'கம்புக்காரர் / Kambukkarar', status: 'ACTIVE' },

  // Sheet 4 (40 to 52)
  { sno: 40, sheetNumber: 4, memberNumber: 'M-040', fullName: 'செந்தில் வாத்தியார் (1) / Senthil Vathiyar (1)', phone: '9840100040', email: 'senthil.vathiyar1@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 41, sheetNumber: 4, memberNumber: 'M-041', fullName: 'செந்தில் வாத்தியார் (2) / Senthil Vathiyar (2)', phone: '9840100041', email: 'senthil.vathiyar2@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 42, sheetNumber: 4, memberNumber: 'M-042', fullName: 'ராசு கள்ளங்காடு (1) / Rasu Kallankadu (1)', phone: '9840100042', email: 'rasu1@seettu.com', address: 'கள்ளங்காடு / Kallankadu', status: 'ACTIVE' },
  { sno: 43, sheetNumber: 4, memberNumber: 'M-043', fullName: 'ராசு கள்ளங்காடு (2) / Rasu Kallankadu (2)', phone: '9840100043', email: 'rasu2@seettu.com', address: 'கள்ளங்காடு / Kallankadu', status: 'ACTIVE' },
  { sno: 44, sheetNumber: 4, memberNumber: 'M-044', fullName: 'ஜோதி செல்வம் / Jothi Selvam', phone: '9840100044', email: 'jothi.selvam@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 45, sheetNumber: 4, memberNumber: 'M-045', fullName: 'செல்வம் ஜோதி / Selvam Jothi', phone: '9840100045', email: 'selvam.jothi@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 46, sheetNumber: 4, memberNumber: 'M-046', fullName: 'ராஜ்குமார் சின்னக்காடு / Rajkumar Chinnakkadu', phone: '9840100046', email: 'rajkumar.chinnakkadu@seettu.com', address: 'சின்னக்காடு / Chinnakkadu', status: 'ACTIVE' },
  { sno: 47, sheetNumber: 4, memberNumber: 'M-047', fullName: 'கீர்த்தி காளியப்பன் / Keerthi Kaliappan', phone: '9840100047', email: 'keerthi.kaliappan@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 48, sheetNumber: 4, memberNumber: 'M-048', fullName: 'ராஜேஷ்குமார் மெட்ராஸ் / Rajeshkumar Madras', phone: '9840100048', email: 'rajeshkumar.madras@seettu.com', address: 'மெட்ராஸ் / Chennai', status: 'ACTIVE' },
  { sno: 49, sheetNumber: 4, memberNumber: 'M-049', fullName: 'சின்னசாமி விக்னேஷ் / Chinnasamy Vignesh', phone: '9840100049', email: 'chinnasamy.vignesh@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 50, sheetNumber: 4, memberNumber: 'M-050', fullName: 'ராஜ்குமார் சுப்ரமணி (1) / Rajkumar Subramani (1)', phone: '9840100050', email: 'rajkumar.subramani1@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 51, sheetNumber: 4, memberNumber: 'M-051', fullName: 'ராஜ்குமார் சுப்ரமணி (2) / Rajkumar Subramani (2)', phone: '9840100051', email: 'rajkumar.subramani2@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 52, sheetNumber: 4, memberNumber: 'M-052', fullName: 'பிரபு ஹைடெக் / Prabhu Hitech', phone: '9840100052', email: 'prabhu.hitech@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },

  // Sheet 5 (53 to 65)
  { sno: 53, sheetNumber: 5, memberNumber: 'M-053', fullName: 'சதீஸ்குமார், ஆனங்கூர் / Satheeshkumar Anangur', phone: '9840100053', email: 'satheeshkumar1@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 54, sheetNumber: 5, memberNumber: 'M-054', fullName: 'சதீஸ்குமார் (2) / Satheeshkumar (2)', phone: '9840100054', email: 'satheeshkumar2@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 55, sheetNumber: 5, memberNumber: 'M-055', fullName: 'சதீஸ்குமார் (3) / Satheeshkumar (3)', phone: '9840100055', email: 'satheeshkumar3@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 56, sheetNumber: 5, memberNumber: 'M-056', fullName: 'சதீஸ்குமார் (4) / Satheeshkumar (4)', phone: '9840100056', email: 'satheeshkumar4@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 57, sheetNumber: 5, memberNumber: 'M-057', fullName: 'சதீஸ்குமார் (5) / Satheeshkumar (5)', phone: '9840100057', email: 'satheeshkumar5@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 58, sheetNumber: 5, memberNumber: 'M-058', fullName: 'கண்ணன் எஸ் ஆர் (1) / Kannan S.R (1)', phone: '9840100058', email: 'kannan.sr1@seettu.com', address: 'எஸ் ஆர் / S.R, ஆனங்கூர்', status: 'ACTIVE' },
  { sno: 59, sheetNumber: 5, memberNumber: 'M-059', fullName: 'கண்ணன் எஸ் ஆர் (2) / Kannan S.R (2)', phone: '9840100059', email: 'kannan.sr2@seettu.com', address: 'எஸ் ஆர் / S.R, ஆனங்கூர்', status: 'ACTIVE' },
  { sno: 60, sheetNumber: 5, memberNumber: 'M-060', fullName: 'வெங்கடாசலம் இன்ஜினி ஆண்டிகாடு / Venkatachalam Engineer Andikadu', phone: '9840100060', email: 'venkatachalam.andikadu@seettu.com', address: 'ஆண்டிகாடு / Andikadu', status: 'ACTIVE' },
  { sno: 61, sheetNumber: 5, memberNumber: 'M-061', fullName: 'பாலு ஆண்டிகாடு / Balu Andikadu', phone: '9840100061', email: 'balu.andikadu@seettu.com', address: 'ஆண்டிகாடு / Andikadu', status: 'ACTIVE' },
  { sno: 62, sheetNumber: 5, memberNumber: 'M-062', fullName: 'ரமேஷ் பரமக்காடு / Ramesh Paramakkadu', phone: '9840100062', email: 'ramesh.paramakkadu@seettu.com', address: 'பரமக்காடு / Paramakkadu', status: 'ACTIVE' },
  { sno: 63, sheetNumber: 5, memberNumber: 'M-063', fullName: 'அர்ஜுனன் ஆண்டிகாடு / Arjunan Andikadu', phone: '9840100063', email: 'arjunan.andikadu@seettu.com', address: 'ஆண்டிகாடு / Andikadu', status: 'ACTIVE' },
  { sno: 64, sheetNumber: 5, memberNumber: 'M-064', fullName: 'பிரகாஷ் சுப்பிரமணி / Prakash Subramani', phone: '9840100064', email: 'prakash.subramani@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 65, sheetNumber: 5, memberNumber: 'M-065', fullName: 'ராஜா நெரிஞ்சிக்கொரை / Raja Nerinjikkorai', phone: '9840100065', email: 'raja.nerinjikkorai@seettu.com', address: 'நெரிஞ்சிக்கொரை / Nerinjikkorai', status: 'ACTIVE' },

  // Sheet 6 (66 to 78)
  { sno: 66, sheetNumber: 6, memberNumber: 'M-066', fullName: 'கார்த்தி திண்டுக்கல் / Karthi Dindigul', phone: '9840100066', email: 'karthi.dindigul@seettu.com', address: 'திண்டுக்கல் / Dindigul', status: 'ACTIVE' },
  { sno: 67, sheetNumber: 6, memberNumber: 'M-067', fullName: 'விஸ்வநாதன் அட்வகேட் / Viswanathan Advocate', phone: '9840100067', email: 'viswanathan.advocate@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 68, sheetNumber: 6, memberNumber: 'M-068', fullName: 'கார்த்தி ஐயன் தோட்டம் / Karthi Ayyan Thottam', phone: '9840100068', email: 'karthi.ayyan@seettu.com', address: 'ஐயன் தோட்டம் / Ayyan Thottam', status: 'ACTIVE' },
  { sno: 69, sheetNumber: 6, memberNumber: 'M-069', fullName: 'நவீன் வேப்பங்காடு (1) / Naveen Veppankadu (1)', phone: '9840100069', email: 'naveen.veppankadu1@seettu.com', address: 'வேப்பங்காடு / Veppankadu', status: 'ACTIVE' },
  { sno: 70, sheetNumber: 6, memberNumber: 'M-070', fullName: 'நவீன் வேப்பங்காடு (2) / Naveen Veppankadu (2)', phone: '9840100070', email: 'naveen.veppankadu2@seettu.com', address: 'வேப்பங்காடு / Veppankadu', status: 'ACTIVE' },
  { sno: 71, sheetNumber: 6, memberNumber: 'M-071', fullName: 'தங்கராஜ் வேப்பங்காடு / Thangaraj Veppankadu', phone: '9840100071', email: 'thangaraj.veppankadu@seettu.com', address: 'வேப்பங்காடு / Veppankadu', status: 'ACTIVE' },
  { sno: 72, sheetNumber: 6, memberNumber: 'M-072', fullName: 'ராஜசேகர் தாசில்தார் / Rajasekar Tahsildar', phone: '9840100072', email: 'rajasekar.tahsildar@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 73, sheetNumber: 6, memberNumber: 'M-073', fullName: 'கண்ணன் தங்கவேல் (1) / Kannan Thangavel (1)', phone: '9840100073', email: 'kannan.thangavel1@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 74, sheetNumber: 6, memberNumber: 'M-074', fullName: 'கண்ணன் தங்கவேல் (2) / Kannan Thangavel (2)', phone: '9840100074', email: 'kannan.thangavel2@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
  { sno: 75, sheetNumber: 6, memberNumber: 'M-075', fullName: 'பிரவீன் சாணிகாடு / Praveen Sanikkadu', phone: '9840100075', email: 'praveen.sanikkadu@seettu.com', address: 'சாணிகாடு / Sanikkadu', status: 'ACTIVE' },
  { sno: 76, sheetNumber: 6, memberNumber: 'M-076', fullName: 'சந்திரசேகர் நாராயணிபாளையம் / Chandrasekar Narayanipalayam', phone: '9840100076', email: 'chandrasekar.np@seettu.com', address: 'நாராயணிபாளையம் / Narayanipalayam', status: 'ACTIVE' },
  { sno: 77, sheetNumber: 6, memberNumber: 'M-077', fullName: 'ஜெகதீஷ் நாராயணிபாளையம் / Jegadeesh Narayanipalayam', phone: '9840100077', email: 'jegadeesh.np@seettu.com', address: 'நாராயணிபாளையம் / Narayanipalayam', status: 'ACTIVE' },
  { sno: 78, sheetNumber: 6, memberNumber: 'M-078', fullName: 'ஸ்ரீ பட்டணத்து மாரியம்மன் / Sri Pattanathu Mariamman (Temple Chit Ticket)', phone: '9840100078', email: 'mariamman.temple@seettu.com', address: 'ஆனங்கூர் / Anangur', status: 'ACTIVE' },
];
