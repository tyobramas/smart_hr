import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createCvPdf(filename: string, cvData: {
  name: string;
  title: string;
  contact: string;
  summary: string;
  skills: string[];
  experience: { role: string; company: string; period: string; points: string[] }[];
  education: string;
  certifications?: string[];
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 800;

  // Header
  page.drawText(cvData.name.toUpperCase(), { x: 50, y, size: 20, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 22;
  page.drawText(cvData.title, { x: 50, y, size: 12, font: fontBold, color: rgb(0.2, 0.4, 0.7) });
  y -= 16;
  page.drawText(cvData.contact, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  y -= 20;

  // Divider
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1.5, color: rgb(0.8, 0.8, 0.85) });
  y -= 20;

  // Ringkasan
  page.drawText('RINGKASAN PROFESIONAL', { x: 50, y, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 14;
  
  // Wrap summary
  const words = cvData.summary.split(' ');
  let line = '';
  for (const word of words) {
    if ((line + word).length > 95) {
      page.drawText(line, { x: 50, y, size: 9.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      y -= 13;
      line = '';
    }
    line += word + ' ';
  }
  if (line) {
    page.drawText(line, { x: 50, y, size: 9.5, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 20;
  }

  // Keahlian
  page.drawText('KEAHLIAN UTAMA & KOMPETENSI TEKNIS', { x: 50, y, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 15;
  for (const skill of cvData.skills) {
    page.drawText(`• ${skill}`, { x: 60, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    y -= 13;
  }
  y -= 10;

  // Pengalaman Kerja
  page.drawText('PENGALAMAN KERJA', { x: 50, y, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 15;

  for (const exp of cvData.experience) {
    page.drawText(exp.role, { x: 50, y, size: 10, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(exp.period, { x: 440, y, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    y -= 13;
    page.drawText(exp.company, { x: 50, y, size: 9, font: fontBold, color: rgb(0.3, 0.4, 0.6) });
    y -= 13;

    for (const pt of exp.points) {
      page.drawText(`- ${pt}`, { x: 60, y, size: 8.5, font: fontRegular, color: rgb(0.25, 0.25, 0.25) });
      y -= 12;
    }
    y -= 8;
  }

  // Pendidikan & Sertifikasi
  y -= 5;
  page.drawText('PENDIDIKAN & SERTIFIKASI', { x: 50, y, size: 11, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
  y -= 14;
  page.drawText(`• ${cvData.education}`, { x: 60, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  y -= 13;

  if (cvData.certifications) {
    for (const cert of cvData.certifications) {
      page.drawText(`• ${cert}`, { x: 60, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      y -= 13;
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filename, pdfBytes);
  console.log(`Generated: ${filename}`);
}

async function main() {
  const publicDir = path.join(process.cwd(), 'public', 'sample_cvs');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // ==========================================
  // CV 1: IT / SOFTWARE DEVELOPER
  // ==========================================
  const itCv = {
    name: 'Budi Santoso, S.Kom',
    title: 'Senior Full-Stack & Software Engineer',
    contact: 'Email: budi.santoso@gmail.com | Phone: +62 812-3456-7890 | GitHub: github.com/budisantoso-dev | Jakarta, Indonesia',
    summary: 'Senior Software Engineer dengan 5+ tahun pengalaman membangun aplikasi web skala besar modern berbasis Next.js, TypeScript, React, Node.js, dan PostgreSQL. Terbiasa merancang arsitektur microservices, REST & GraphQL API, database indexing, serta integrasi LLM AI Agent ke dalam sistem enterprise.',
    skills: [
      'Frontend: Next.js (App Router), TypeScript, React, Tailwind CSS, Redux Toolkit, Webpack',
      'Backend: Node.js (Express/NestJS), Go (Golang), Python, RESTful API, WebSocket',
      'Database: PostgreSQL, Supabase, Prisma ORM, Redis, Vector Database (PGVector, Astra DB)',
      'Architecture & Tools: CI/CD Pipeline, Docker, Git, Clean Architecture, Unit & E2E Testing (Jest, Playwright)'
    ],
    experience: [
      {
        role: 'Lead Full-Stack Developer',
        company: 'PT Inovasi Solusi Digital (Jakarta)',
        period: '2022 - Sekarang',
        points: [
          'Memimpin tim engineer dalam mengembangkan platform SaaS berbasis Next.js TypeScript dan PostgreSQL melayani 50.000+ pengguna aktif.',
          'Mengoptimalkan database query dan caching layer menggunakan Redis yang meningkatkan latency respons hingga 45%.',
          'Mengintegrasikan model LLM RAG untuk fitur automasi rekrutmen cerdas dan analisis dokumen CV.'
        ]
      },
      {
        role: 'Full-Stack Software Engineer',
        company: 'PT Nusantara Teknologi Kreatif (Bandung)',
        period: '2020 - 2022',
        points: [
          'Membangun fitur frontend interaktif dan scalable backend services menggunakan React, Node.js, dan PostgreSQL.',
          'Mengimplementasikan sistem authentication RBAC dan webhook payment gateway pihak ketiga dengan SLA 99.9% uptime.'
        ]
      }
    ],
    education: 'S1 Teknik Informatika - Institut Teknologi Bandung (ITB) (2016 - 2020) - IPK 3.82',
    certifications: [
      'Certified Scrum Master (CSM)',
      'AWS Certified Developer - Associate'
    ]
  };

  // ==========================================
  // CV 2: NETWORKING & CLOUD / DEVOPS
  // ==========================================
  const netCv = {
    name: 'Budi Santoso, S.Kom',
    title: 'Senior Network & Cloud Infrastructure Engineer',
    contact: 'Email: budi.santoso@gmail.com | Phone: +62 812-3456-7890 | LinkedIn: linkedin.com/in/budi-santoso-net | Jakarta, Indonesia',
    summary: 'Senior Network & Infrastructure Engineer dengan 6 tahun pengalaman dalam manajemen jaringan skala enterprise, routing switching, firewall security, cloud infrastructure (AWS/GCP), serta container orchestration menggunakan Docker dan Kubernetes. Berpengalaman menangani hybrid data center.',
    skills: [
      'Networking: Cisco Routing & Switching (CCNP Enterprise), MikroTik MTCRE/MTCINE, BGP, OSPF, VLAN, VPN/IPsec, SD-WAN',
      'Network Security: Fortinet FortiGate, Palo Alto, Cisco ASA, IDS/IPS, WAF, Zero Trust Architecture',
      'Cloud & DevOps: AWS (VPC, Direct Connect, EC2, EKS), Docker, Kubernetes, Terraform, Ansible',
      'Monitoring & Tools: Wireshark, Zabbix, Grafana, Prometheus, SolarWinds, Linux Server (RHEL/Ubuntu)'
    ],
    experience: [
      {
        role: 'Lead Network & Cloud Infrastructure Engineer',
        company: 'PT Telekomunikasi Jaringan Nusantara (Jakarta)',
        period: '2022 - Sekarang',
        points: [
          'Merancang dan memelihara infrastruktur jaringan core enterprise dengan 100+ node switch Cisco & FortiGate firewall.',
          'Mengimplementasikan arsitektur hybrid-cloud menghubungkan On-premise Data Center ke AWS via AWS Direct Connect dan IPsec VPN.',
          'Mencapai 99.98% network uptime dan memimpin penanganan insiden keamanan siber (DDoS mitigation, perimeter defense).'
        ]
      },
      {
        role: 'Network Administrator & Systems Support',
        company: 'PT Global Lintas Data (Jakarta)',
        period: '2019 - 2022',
        points: [
          'Konfigurasi routing BGP/OSPF dan traffic engineering pada multi-homed ISP network.',
          'Melakukan automasi backup konfigurasi switch dan router menggunakan Python & Ansible playbook.'
        ]
      }
    ],
    education: 'S1 Teknik Komputer & Jaringan - Universitas Indonesia (UI) (2015 - 2019) - IPK 3.75',
    certifications: [
      'Cisco Certified Network Professional (CCNP Enterprise)',
      'MikroTik Certified Inter-networking Engineer (MTCINE)',
      'AWS Certified Advanced Networking - Specialty'
    ]
  };

  // ==========================================
  // CV 3: PAJAK & AKUNTANSI (TAX SPECIALIST)
  // ==========================================
  const taxCv = {
    name: 'Budi Santoso, S.Kom',
    title: 'Senior Corporate Tax & Accounting Specialist',
    contact: 'Email: budi.santoso@gmail.com | Phone: +62 812-3456-7890 | LinkedIn: linkedin.com/in/budi-santoso-pajak | Jakarta, Indonesia',
    summary: 'Spesialis Perpajakan Korporasi & Akuntansi Berlisensi dengan 6+ tahun pengalaman menangani kepatuhan pajak (tax compliance), perencanaan pajak strategis (tax planning), pelaporan SPT Masa & Tahunan (PPh Badan, PPh 21, 23, 26, 4 ayat 2, dan PPN e-Faktur), serta pendampingan pemeriksaan & audit pajak.',
    skills: [
      'Perpajakan Indonesia: PPh Pasal 21/26, PPh 23, PPh 4 ayat 2, PPh Pasal 25/29 Badan, PPN & PPnBM, Transfer Pricing Doc',
      'Aplikasi Perpajakan: e-Faktur Pajak, e-Bupot Unifikasi, e-SPT, DJP Online, Coretax System Knowledge',
      'Akuntansi & Keuangan: PSAK / IFRS, Laporan Keuangan Fiskal, Rekonsiliasi Fiskal Positif/Negatif, Cashflow Management',
      'Software Akuntansi: SAP ERP FICO, Accurate Online, Jurnal by Mekari, Microsoft Excel Advanced (VLOOKUP, Pivot, Macro)'
    ],
    experience: [
      {
        role: 'Senior Tax & Accounting Manager',
        company: 'PT Megah Nusantara Perkasa (Jakarta)',
        period: '2021 - Sekarang',
        points: [
          'Bertanggung jawab penuh atas tax compliance dan rekonsiliasi fiskal tahunan untuk omzet perusahaan senilai >Rp 150 Miliar/tahun.',
          'Mengelola pelaporan SPT Masa PPN (e-Faktur) dan SPT Unifikasi PPh 21/23 tepat waktu dengan tingkat akurasi 100%.',
          'Berhasil memenangkan sengketa keberatan pajak dan mendampingi proses audit BPK/KPP dengan penghematan sanksi pajak Rp 1.2 Miliar.'
        ]
      },
      {
        role: 'Tax Consultant / Auditor Pajak',
        company: 'KAP & Konsultan Pajak Hartono & Rekan (Jakarta)',
        period: '2018 - 2021',
        points: [
          'Menyusun review kepatuhan pajak (Tax Diagnostic Review) untuk 20+ klien korporasi dari berbagai industri.',
          'Menyusun Laporan Keuangan Fiskal, perhitungan PPh 25 bulanan, dan asistensi pemeriksaan Surat Permintaan Penjelasan Data (SP2DK).'
        ]
      }
    ],
    education: 'S1 Akuntansi & Perpajakan - Universitas Gadjah Mada (UGM) (2014 - 2018) - IPK 3.85',
    certifications: [
      'Sertifikasi Konsultan Pajak - Brevet A, B & C (IKPI)',
      'Chartered Accountant (CA) Indonesia',
      'Certified Tax Technician (CTT)'
    ]
  };

  await createCvPdf(path.join(process.cwd(), 'CV_Budi_Santoso_1_IT_Software.pdf'), itCv);
  await createCvPdf(path.join(process.cwd(), 'CV_Budi_Santoso_2_Networking.pdf'), netCv);
  await createCvPdf(path.join(process.cwd(), 'CV_Budi_Santoso_3_Pajak.pdf'), taxCv);

  await createCvPdf(path.join(publicDir, 'CV_Budi_Santoso_1_IT_Software.pdf'), itCv);
  await createCvPdf(path.join(publicDir, 'CV_Budi_Santoso_2_Networking.pdf'), netCv);
  await createCvPdf(path.join(publicDir, 'CV_Budi_Santoso_3_Pajak.pdf'), taxCv);

  console.log('All 3 CV PDFs generated successfully!');
}

main().catch(console.error);
