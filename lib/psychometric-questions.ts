export type QuestionType = "likert" | "forced_choice" | "mbti_dichotomy";

export interface PsychometricQuestion {
  id: string;
  type: QuestionType;
  framework: "DISC" | "BIG_FIVE" | "PAPI_KOSTICK" | "MBTI";
  category: string;
  text: string;
  // For forced_choice and mbti_dichotomy
  optionA?: { label: string; text: string; traitCode: string };
  optionB?: { label: string; text: string; traitCode: string };
  // For likert reverse scoring (e.g. 1 becomes 5, 2 becomes 4)
  isReverseScored?: boolean;
}

export const ALL_50_PSYCHOMETRIC_QUESTIONS: PsychometricQuestion[] = [
  // =========================================================================
  // 1. DISC FRAMEWORK (15 SOAL) - Situational Work Preferences (Likert 1-5)
  // =========================================================================
  {
    id: "disc_1",
    type: "likert",
    framework: "DISC",
    category: "Dominance",
    text: "Ketika proyek mengalami hambatan kritis, saya langsung mengambil alih komando dan membuat keputusan tegas tanpa ragu.",
  },
  {
    id: "disc_2",
    type: "likert",
    framework: "DISC",
    category: "Dominance",
    text: "Saya sangat kompetitif dan terdorong oleh target kinerja yang menantang batas kemampuan saya.",
  },
  {
    id: "disc_3",
    type: "likert",
    framework: "DISC",
    category: "Dominance",
    text: "Saya lebih menyukai diskusi singkat yang langsung fokus pada aksi nyata daripada analisis teori yang berlarut-larut.",
  },
  {
    id: "disc_4",
    type: "likert",
    framework: "DISC",
    category: "Dominance",
    text: "Saya berani mengambil risiko besar asalkan berpotensi mendatangkan hasil signifikan bagi perusahaan.",
  },
  {
    id: "disc_5",
    type: "likert",
    framework: "DISC",
    category: "Influence",
    text: "Saya mampu mencairkan suasana kerja yang tegang dan memotivasi tim dengan antusiasme positif.",
  },
  {
    id: "disc_6",
    type: "likert",
    framework: "DISC",
    category: "Influence",
    text: "Saya sangat menikmati presentasi di depan publik dan meyakinkan pemangku kepentingan mengenai ide baru.",
  },
  {
    id: "disc_7",
    type: "likert",
    framework: "DISC",
    category: "Influence",
    text: "Saya mudah membangun relasi profesional baru dan menjalin kerja sama lintas departemen.",
  },
  {
    id: "disc_8",
    type: "likert",
    framework: "DISC",
    category: "Influence",
    text: "Saya senang memberikan pujian dan pengakuan terbuka saat rekan kerja berhasil menyelesaikan tugas.",
  },
  {
    id: "disc_9",
    type: "likert",
    framework: "DISC",
    category: "Steadiness",
    text: "Saya lebih menyukai ritme kerja yang stabil, terjadwal rapi, dan terhindar dari konflik interpersonal.",
  },
  {
    id: "disc_10",
    type: "likert",
    framework: "DISC",
    category: "Steadiness",
    text: "Saya adalah pendengar yang sabar dan selalu siap membantu rekan kerja yang sedang kewalahan.",
  },
  {
    id: "disc_11",
    type: "likert",
    framework: "DISC",
    category: "Steadiness",
    text: "Saya memiliki kesetiaan tinggi pada tim dan konsisten menjaga keharmonisan lingkungan kerja.",
  },
  {
    id: "disc_12",
    type: "likert",
    framework: "DISC",
    category: "Steadiness",
    text: "Saya tetap tenang, sabar, dan tidak mudah terpancing emosi saat menghadapi situasi kerja bertekanan.",
  },
  {
    id: "disc_13",
    type: "likert",
    framework: "DISC",
    category: "Compliance",
    text: "Saya selalu memverifikasi ulang hasil kerja berkali-kali untuk menjamin tidak ada kesalahan sekecil apa pun (zero error).",
  },
  {
    id: "disc_14",
    type: "likert",
    framework: "DISC",
    category: "Compliance",
    text: "Saya mendasarkan seluruh keputusan teknis pada data faktual, metrik analitik, dan prosedur resmi (SOP).",
  },
  {
    id: "disc_15",
    type: "likert",
    framework: "DISC",
    category: "Compliance",
    text: "Saya sangat disiplin mendokumentasikan alur kerja, log sistem, dan laporan teknis secara terstruktur.",
  },

  // =========================================================================
  // 2. BIG FIVE / OCEAN (10 SOAL) - Core Traits with Reverse-Keyed Balancers
  // =========================================================================
  {
    id: "ocean_1",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Openness",
    text: "Saya selalu tertarik mempelajari teknologi atau metodologi kerja baru di luar zona nyaman saya.",
  },
  {
    id: "ocean_2",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Openness",
    text: "Saya lebih menyukai pendekatan kerja konvensional yang sudah terbukti daripada bereksperimen dengan metode baru yang belum pasti.",
    isReverseScored: true,
  },
  {
    id: "ocean_3",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Conscientiousness",
    text: "Saya selalu menyelesaikan seluruh pekerjaan sebelum tenggat waktu dengan perencanaan matang dan terorganisir.",
  },
  {
    id: "ocean_4",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Conscientiousness",
    text: "Terkadang saya menunda-nunda pekerjaan administratif hingga mendekati batas waktu akhir penyerahan.",
    isReverseScored: true,
  },
  {
    id: "ocean_5",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Extraversion",
    text: "Saya merasa berenergi dan bersemangat ketika berinteraksi dalam tim besar yang dinamis.",
  },
  {
    id: "ocean_6",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Extraversion",
    text: "Saya merasa lebih produktif dan nyaman ketika bekerja mandiri di tempat yang tenang tanpa banyak interupsi.",
    isReverseScored: true,
  },
  {
    id: "ocean_7",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Agreeableness",
    text: "Saya selalu mengedepankan kerja sama, kompromi positif, dan memercayai niat baik rekan kerja.",
  },
  {
    id: "ocean_8",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Agreeableness",
    text: "Saya cenderung skeptis dan meneliti motif di balik usulan rekan kerja sebelum menyetujuinya.",
    isReverseScored: true,
  },
  {
    id: "ocean_9",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Emotional_Stability",
    text: "Saya jarang merasa cemas atau panik ketika rencana kerja mendadak berubah di luar kendali.",
  },
  {
    id: "ocean_10",
    type: "likert",
    framework: "BIG_FIVE",
    category: "Emotional_Stability",
    text: "Kritik langsung dari atasan atau kegagalan kerja terkadang membuat suasana hati saya terbebani cukup lama.",
    isReverseScored: true,
  },

  // =========================================================================
  // 3. PAPI KOSTICK (10 SOAL) - Ipsative Forced-Choice (Pilih A vs B)
  // =========================================================================
  {
    id: "papi_1",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Peran Kepemimpinan vs Eksekusi Teknis",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Saya ingin memimpin, mengarahkan tim, dan memikul tanggung jawab atas arah strategi.",
      traitCode: "L_LEADERSHIP",
    },
    optionB: {
      label: "B",
      text: "Saya lebih fokus mengeksekusi tugas spesifik saya secara mandiri hingga mencapai kesempurnaan.",
      traitCode: "T_TASK",
    },
  },
  {
    id: "papi_2",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Motivasi Prestasi vs Harmoni Tim",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Saya selalu mengejar target kinerja tinggi dan ingin menjadi yang terbaik di bidang saya.",
      traitCode: "A_ACHIEVEMENT",
    },
    optionB: {
      label: "B",
      text: "Saya lebih mengutamakan suasana kerja yang akrab, rukun, dan saling mendukung.",
      traitCode: "H_HARMONY",
    },
  },
  {
    id: "papi_3",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Kepatuhan Aturan vs Fleksibilitas",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Saya selalu mematuhi instruksi resmi dan regulasi baku tanpa membuat pengecualian.",
      traitCode: "R_RULES",
    },
    optionB: {
      label: "B",
      text: "Saya fleksibel mencari solusi alternatif kreatif meskipun sedikit berbeda dari SOP.",
      traitCode: "F_FLEXIBLE",
    },
  },
  {
    id: "papi_4",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Tempo Kerja Aktif vs Analisa Mendalam",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Saya terbiasa bekerja dengan tempo sangat cepat dan berpindah lincah antartugas.",
      traitCode: "P_PACE",
    },
    optionB: {
      label: "B",
      text: "Saya lebih suka mendalami satu masalah secara seksama sebelum beralih ke tugas lain.",
      traitCode: "D_DEPTH",
    },
  },
  {
    id: "papi_5",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Ketegasan Kritik vs Menjaga Perasaan",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Saya langsung menegur dan mengoreksi kesalahan rekan kerja secara blak-blakan demi efisiensi.",
      traitCode: "D_DIRECT",
    },
    optionB: {
      label: "B",
      text: "Saya memilih kata-kata secara hati-hati agar tidak menyinggung atau merusak hubungan pertemanan.",
      traitCode: "E_EMPATHY",
    },
  },
  {
    id: "papi_6",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Fokus Detail vs Gambaran Besar",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Saya teliti memeriksa setiap baris angka, sintaks, dan parameter terkecil.",
      traitCode: "D_DETAIL",
    },
    optionB: {
      label: "B",
      text: "Saya lebih fokus pada visi arsitektur keseluruhan daripada terjebak pada detail mikro.",
      traitCode: "B_BIGPICTURE",
    },
  },
  {
    id: "papi_7",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Inisiatif Mandiri vs Menunggu Konfirmasi",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Ketika situasi darurat tanpa atasan, saya langsung berani mengambil inisiatif solusi.",
      traitCode: "I_INITIATIVE",
    },
    optionB: {
      label: "B",
      text: "Saya lebih memilih menunggu instruksi jelas dan konfirmasi atasan sebelum bertindak.",
      traitCode: "S_SAFETY",
    },
  },
  {
    id: "papi_8",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Sosialisasi vs Kemandirian Kerja",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Saya menyukai lingkungan kerja yang ramai, aktif berkomunikasi, dan banyak berdiskusi.",
      traitCode: "S_SOCIAL",
    },
    optionB: {
      label: "B",
      text: "Saya paling produktif jika diberi ruang hening dan konsentrasi penuh tanpa gangguan.",
      traitCode: "I_INDEPENDENT",
    },
  },
  {
    id: "papi_9",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Orientasi Hasil vs Kepatuhan Proses",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Bagi saya, tercapainya target akhir dengan sukses adalah prioritas nomor satu.",
      traitCode: "R_RESULT",
    },
    optionB: {
      label: "B",
      text: "Bagi saya, proses yang sesuai dengan standar etika dan prosedur mutu adalah hal terpenting.",
      traitCode: "P_PROCESS",
    },
  },
  {
    id: "papi_10",
    type: "forced_choice",
    framework: "PAPI_KOSTICK",
    category: "Kestabilan Organisasi vs Tantangan Baru",
    text: "Pilihlah salah satu dari dua pernyataan berikut yang PALING menggambarkan diri Anda:",
    optionA: {
      label: "A",
      text: "Saya mencari stabilitas, kepastian karier jangka panjang, dan loyalitas pada perusahaan.",
      traitCode: "L_LOYALTY",
    },
    optionB: {
      label: "B",
      text: "Saya menyukai dinamika perubahan cepat, tantangan baru, dan peluang eksplorasi karier.",
      traitCode: "G_GROWTH",
    },
  },

  // =========================================================================
  // 4. MBTI DICHOTOMY (15 SOAL) - 4 Cognitive Dimensions (A vs B)
  // =========================================================================
  // Extraversion (E) vs Introversion (I) - 4 Soal
  {
    id: "mbti_1",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Sumber Energi & Interaksi",
    text: "Setelah melewati minggu kerja yang padat dan melelahkan, bagaimana cara Anda memulihkan energi?",
    optionA: {
      label: "A",
      text: "Berkumpul, mengobrol santai, atau beraktivitas bersama rekan/teman.",
      traitCode: "E",
    },
    optionB: {
      label: "B",
      text: "Menyendiri di rumah, membaca, istirahat tenang, atau menikmati hobi pribadi.",
      traitCode: "I",
    },
  },
  {
    id: "mbti_2",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Pola Berpikir & Mengemukakan Gagasan",
    text: "Saat menghadapi masalah rumit dalam pekerjaan:",
    optionA: {
      label: "A",
      text: "Saya lebih suka mendiskusikannya langsung sambil bertukar pikiran dengan orang lain (brainstorming).",
      traitCode: "E",
    },
    optionB: {
      label: "B",
      text: "Saya merenungkan dan memikirkannya matang-matang secara internal terlebih dahulu sebelum bicara.",
      traitCode: "I",
    },
  },
  {
    id: "mbti_3",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Jejaring Sosial di Kantor",
    text: "Dalam lingkungan kantor yang baru:",
    optionA: {
      label: "A",
      text: "Saya mudah bergaul dan cepat mengenal banyak rekan dari berbagai divisi.",
      traitCode: "E",
    },
    optionB: {
      label: "B",
      text: "Saya cenderung lebih dekat dengan beberapa rekan kerja dalam lingkaran kecil yang akrab.",
      traitCode: "I",
    },
  },
  {
    id: "mbti_4",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Fokus Perhatian",
    text: "Dalam bekerja sehari-hari:",
    optionA: {
      label: "A",
      text: "Saya berorientasi pada peristiwa luar, interaksi sosial, dan aksi dinamis.",
      traitCode: "E",
    },
    optionB: {
      label: "B",
      text: "Saya berorientasi pada gagasan mendalam, refleksi analitis, dan konsep internal.",
      traitCode: "I",
    },
  },

  // Sensing (S) vs Intuition (N) - 4 Soal
  {
    id: "mbti_5",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Pemrosesan Informasi",
    text: "Ketika mempelajari suatu proyek atau sistem kerja baru:",
    optionA: {
      label: "A",
      text: "Saya fokus pada fakta konkrit, data nyata, langkah-langkah praktis, dan detail spesifik.",
      traitCode: "S",
    },
    optionB: {
      label: "B",
      text: "Saya fokus pada gambaran besar, pola konseptual, hubungan tren masa depan, dan inovasi.",
      traitCode: "N",
    },
  },
  {
    id: "mbti_6",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Gaya Penyelesaian Masalah",
    text: "Ketika menyelesaikan kendala operasional:",
    optionA: {
      label: "A",
      text: "Saya mengandalkan pengalaman masa lalu dan metode yang sudah terbukti berhasil.",
      traitCode: "S",
    },
    optionB: {
      label: "B",
      text: "Saya mencari pendekatan baru yang belum pernah dicoba dan menciptakan alternatif inovatif.",
      traitCode: "N",
    },
  },
  {
    id: "mbti_7",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Perhatian terhadap Detail",
    text: "Dalam membaca dokumen atau laporan:",
    optionA: {
      label: "A",
      text: "Saya langsung menangkap rincian data spesifik dan fakta akurat yang tertulis.",
      traitCode: "S",
    },
    optionB: {
      label: "B",
      text: "Saya membaca secara cepat untuk menangkap makna tersirat, visi, dan implikasi jangka panjangnya.",
      traitCode: "N",
    },
  },
  {
    id: "mbti_8",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Orientasi Realitas",
    text: "Orang lain lebih sering mengenal Anda sebagai sosok yang:",
    optionA: {
      label: "A",
      text: "Pragmatis, realistis, berpijak pada kenyataan lapangan, dan cermat.",
      traitCode: "S",
    },
    optionB: {
      label: "B",
      text: "Visioner, imajinatif, penuh ide strategis, dan berorientasi masa depan.",
      traitCode: "N",
    },
  },

  // Thinking (T) vs Feeling (F) - 4 Soal
  {
    id: "mbti_9",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Pengambilan Keputusan",
    text: "Ketika harus membuat keputusan sulit di tempat kerja:",
    optionA: {
      label: "A",
      text: "Saya mendasarkannya pada logika objektif, analisis sebab-akibat, dan keadilan tanpa pandang bulu.",
      traitCode: "T",
    },
    optionB: {
      label: "B",
      text: "Saya mempertimbangkan dampak emosional pada orang lain, nilai kemanusiaan, dan keharmonisan tim.",
      traitCode: "F",
    },
  },
  {
    id: "mbti_10",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Menyampaikan Masukan (Feedback)",
    text: "Saat memberikan evaluasi pada rekan kerja yang melakukan kesalahan:",
    optionA: {
      label: "A",
      text: "Saya menyampaikan fakta apa adanya secara lugas, objektif, dan fokus pada perbaikan kinerja.",
      traitCode: "T",
    },
    optionB: {
      label: "B",
      text: "Saya menyampaikannya secara halus, empatik, dan memastikan motivasi serta perasaannya tetap terjaga.",
      traitCode: "F",
    },
  },
  {
    id: "mbti_11",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Prioritas Keberhasilan Proyek",
    text: "Menurut Anda, apa indikator keberhasilan tim yang paling utama?",
    optionA: {
      label: "A",
      text: "Tercapainya standar efisiensi, target kualitas tinggi, dan akurasi hasil kerja.",
      traitCode: "T",
    },
    optionB: {
      label: "B",
      text: "Terbangunnya moral tim yang solid, hubungan kerja yang harmonis, dan kepuasan semua pihak.",
      traitCode: "F",
    },
  },
  {
    id: "mbti_12",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Resolusi Konflik",
    text: "Saat terjadi silang pendapat antartim:",
    optionA: {
      label: "A",
      text: "Saya mencari solusi paling logis dan rasional berdasarkan prinsip efektivitas.",
      traitCode: "T",
    },
    optionB: {
      label: "B",
      text: "Saya mencari titik temu kompromi yang membuat semua orang merasa didengar dan dihargai.",
      traitCode: "F",
    },
  },

  // Judging (J) vs Perceiving (P) - 3 Soal
  {
    id: "mbti_13",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Struktur & Manajemen Waktu",
    text: "Bagaimana gaya Anda dalam mengatur jadwal harian?",
    optionA: {
      label: "A",
      text: "Saya memiliki to-do list terencana, terstruktur rapi, dan mematuhi jadwal ketat.",
      traitCode: "J",
    },
    optionB: {
      label: "B",
      text: "Saya menyukai fleksibilitas, menyesuaikan alur secara spontan sesuai situasi yang berkembang.",
      traitCode: "P",
    },
  },
  {
    id: "mbti_14",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Penyelesaian Tugas & Deadline",
    text: "Mengenai penyelesaian tugas:",
    optionA: {
      label: "A",
      text: "Saya lebih tenang jika pekerjaan selesai jauh sebelum deadline agar ada kepastian.",
      traitCode: "J",
    },
    optionB: {
      label: "B",
      text: "Saya merasa kreativitas dan dorongan energi saya justru memuncak saat mendekati tenggat waktu.",
      traitCode: "P",
    },
  },
  {
    id: "mbti_15",
    type: "mbti_dichotomy",
    framework: "MBTI",
    category: "Sikap terhadap Ketidakpastian",
    text: "Ketika memulai suatu proyek baru:",
    optionA: {
      label: "A",
      text: "Saya butuh kejelasan batas waktu, pembagian peran baku, dan rencana bertahap yang pasti.",
      traitCode: "J",
    },
    optionB: {
      label: "B",
      text: "Saya nyaman memulai secara bertahap sambil membuka ruang adaptasi terhadap opsi-opsi baru.",
      traitCode: "P",
    },
  },
];

export const MBTI_ARCHETYPE_LOOKUP: Record<string, { label: string; desc: string }> = {
  INTJ: {
    label: "The Mastermind Strategist",
    desc: "Pemikir strategis dengan visi jangka panjang yang sangat analitis, independen, dan berorientasi pada kesempurnaan arsitektur sistem.",
  },
  INTP: {
    label: "The Innovative Logician",
    desc: "Pemecah masalah konseptual yang cerdas, gemar mengeksplorasi teori arsitektur kompleks, analitis, dan memiliki rasa ingin tahu tinggi.",
  },
  ENTJ: {
    label: "The Decisive Commander",
    desc: "Pemimpin visioner dan berani yang piawai merumuskan strategi besar, cepat mengambil keputusan tegas, dan berorientasi pada hasil tinggi.",
  },
  ENTP: {
    label: "The Visionary Debater",
    desc: "Inovator cerdas dan dinamis yang piawai melihat peluang baru, gesit memecahkan masalah kompleks, dan berani menantang status quo.",
  },
  INFJ: {
    label: "The Insightful Counselor",
    desc: "Pribadi berintegritas tinggi dengan intuisi mendalam mengenai orang lain, tenang, berkomitmen, dan selalu mencari makna serta keselarasan.",
  },
  INFP: {
    label: "The Empathetic Idealist",
    desc: "Pribadi yang berdedikasi pada nilai-nilai integritas, kreatif, memiliki empati mendalam, dan selalu mencari cara untuk mengembangkan potensi tim.",
  },
  ENFJ: {
    label: "The Inspiring Protagonist",
    desc: "Pemimpin karismatik dan empatik yang mampu menginspirasi serta menggerakkan tim menuju tujuan bersama secara harmonis.",
  },
  ENFP: {
    label: "The Creative Champion",
    desc: "Sosok antusias, ramah, imajinatif, mudah beradaptasi, dan mampu menularkan semangat inovasi ke seluruh lingkungan kerja.",
  },
  ISTJ: {
    label: "The Reliable Inspector",
    desc: "Pribadi yang sangat bertanggung jawab, tertib, disiplin, berorientasi pada fakta/data akurat, dan menjunjung tinggi prosedur mutu.",
  },
  ISFJ: {
    label: "The Dedicated Protector",
    desc: "Pekerja keras yang setia, teliti, sabar, peduli pada keharmonisan tim, dan sangat dapat diandalkan dalam menjaga stabilitas operasional.",
  },
  ESTJ: {
    label: "The Efficient Organizer",
    desc: "Eksekutor tangguh yang terstruktur, praktis, mengutamakan keteraturan operasional, dan tegas dalam menegakkan standar mutu.",
  },
  ESFJ: {
    label: "The Supportive Contributor",
    desc: "Pribadi yang hangat, kooperatif, tanggap terhadap kebutuhan tim, dan menciptakan lingkungan kerja yang teratur serta suportif.",
  },
  ISTP: {
    label: "The Practical Troubleshooter",
    desc: "Praktisi analitis yang tenang di bawah tekanan, piawai menemukan akar masalah teknis, dan mengutamakan efisiensi fungsional.",
  },
  ISFP: {
    label: "The Versatile Artist",
    desc: "Pribadi yang tenang, adaptif, menghargai kebebasan berkarya, peka terhadap harmoni lingkungan kerja, dan bekerja dengan ketulusan.",
  },
  ESTP: {
    label: "The Dynamic Dynamo",
    desc: "Sosok berenergi tinggi, pragmatis, cepat bertindak dalam situasi darurat, dan berani mengambil keputusan berisiko secara lincah.",
  },
  ESFP: {
    label: "The Engaging Performer",
    desc: "Pribadi yang ramah, spontan, antusias, mudah berkolaborasi, dan mampu membangun hubungan kerja yang menyenangkan.",
  },
};
