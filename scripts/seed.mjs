import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log('🚀 Starting database seed...');

  // 1. Create or get Admin User
  console.log('Creating Admin User...');
  const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
    email: 'admin@smarthr.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { full_name: 'HR Manager & Recruiter' },
  });

  let adminUserId = adminAuth?.user?.id;

  if (adminErr && adminErr.message.includes('already registered')) {
    console.log('Admin user exists, fetching id...');
    const { data: users } = await supabase.auth.admin.listUsers();
    adminUserId = users?.users?.find((u) => u.email === 'admin@smarthr.com')?.id;
  }

  if (!adminUserId) {
    throw new Error('Failed to create/find admin user');
  }

  // Upsert Admin Profile
  const { data: adminProfile, error: adminProfErr } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: adminUserId,
        full_name: 'HR Manager & Recruiter',
        role: 'admin',
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (adminProfErr) console.error('Admin profile error:', adminProfErr);
  console.log('✅ Admin Profile ready:', adminProfile?.id);

  // 2. Create Candidate Users
  const candidatesData = [
    {
      email: 'budi.santoso@gmail.com',
      password: 'candidate123',
      full_name: 'Budi Santoso',
    },
    {
      email: 'siti.rahma@gmail.com',
      password: 'candidate123',
      full_name: 'Siti Rahmawati',
    },
    {
      email: 'dimas.aditya@gmail.com',
      password: 'candidate123',
      full_name: 'Dimas Aditya Pratama',
    },
  ];

  const candidateProfiles = [];

  for (const cand of candidatesData) {
    let candUserId;
    const { data: candAuth, error: candErr } = await supabase.auth.admin.createUser({
      email: cand.email,
      password: cand.password,
      email_confirm: true,
      user_metadata: { full_name: cand.full_name },
    });

    if (candErr && candErr.message.includes('already registered')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      candUserId = users?.users?.find((u) => u.email === cand.email)?.id;
    } else {
      candUserId = candAuth?.user?.id;
    }

    if (candUserId) {
      const { data: prof } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: candUserId,
            full_name: cand.full_name,
            role: 'candidate',
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (prof) candidateProfiles.push(prof);
    }
  }

  console.log(`✅ ${candidateProfiles.length} Candidate Profiles ready.`);

  // 3. Create Sample Jobs
  const jobsData = [
    {
      title: 'Senior Full-Stack Engineer (Next.js + Postgres)',
      slug: 'senior-fullstack-engineer',
      description:
        'Kami mencari Senior Full-Stack Engineer berpengalaman untuk memimpin pengembangan platform SmartHR. Anda akan merancang arsitektur web modern, mengintegrasikan sistem LLM RAG, dan mengelola database relasional berskala besar.',
      requirements:
        '- Minimal 4 tahun pengalaman menggunakan Next.js App Router, React, dan TypeScript.\n- Mahir PostgreSQL, relasi database, indexing, dan Row Level Security (RLS).\n- Pengalaman dengan Docker, cloud deployment, dan REST/GraphQL APIs.\n- Nilai tambah jika memiliki pengalaman integrasi model AI/LLM.',
      location: 'Jakarta (Hybrid / 3 Hari WFH)',
      employment_type: 'Full-time',
      min_score_threshold: 75,
      is_active: true,
      created_by: adminProfile.id,
    },
    {
      title: 'Talent Acquisition & HR Specialist',
      slug: 'talent-acquisition-hr-specialist',
      description:
        'Bertanggung jawab atas seluruh proses siklus rekrutmen talenta teknologi, mulai dari sourcing, screening profil kandidat dengan bantuan sistem AI, wawancara HR, hingga proses offering.',
      requirements:
        '- Pengalaman minimal 2 tahun sebagai Tech Recruiter / HR Generalist.\n- Memahami alur sourcing kandidat IT dan platform talent job boards.\n- Kemampuan komunikasi interpersonal yang luar biasa dan negosiasi.\n- Terbiasa menggunakan HRIS / ATS.',
      location: 'Jakarta Selatan (On-site)',
      employment_type: 'Full-time',
      min_score_threshold: 70,
      is_active: true,
      created_by: adminProfile.id,
    },
    {
      title: 'DevOps & Cloud Platform Engineer',
      slug: 'devops-cloud-platform-engineer',
      description:
        'Mengelola infrastruktur cloud, automated CI/CD pipeline, monitoring sistem 24/7, dan memastikan availability serta keamanan database production.',
      requirements:
        '- Mahir Linux system administration, Docker containerization, dan Kubernetes.\n- Pengalaman mengelola AWS / GCP infrastructure.\n- Pengalaman dengan database clustering, automated backup, dan security hardening.',
      location: 'Remote (Indonesia)',
      employment_type: 'Remote',
      min_score_threshold: 80,
      is_active: true,
      created_by: adminProfile.id,
    },
  ];

  const createdJobs = [];
  for (const job of jobsData) {
    const { data: jobRes } = await supabase
      .from('jobs')
      .upsert(job, { onConflict: 'slug' })
      .select()
      .single();

    if (jobRes) createdJobs.push(jobRes);
  }

  console.log(`✅ ${createdJobs.length} Jobs ready.`);

  // 4. Create Sample Applications (Candidates applying to jobs)
  if (candidateProfiles.length >= 3 && createdJobs.length >= 2) {
    const sampleApps = [
      {
        candidate_id: candidateProfiles[0].id, // Budi Santoso
        job_id: createdJobs[0].id, // Full-stack
        cv_storage_path: 'cvs/budi_santoso_senior_fullstack.pdf',
        cv_parsed_name: 'Budi Santoso, S.Kom',
        status: 'screened',
        cv_score: 88.5,
        cv_analysis_json: {
          skills_matched: ['Next.js', 'PostgreSQL', 'TypeScript', 'Docker', 'RLS'],
          experience_years: 5,
          recommendation: 'Sangat cocok untuk posisi Senior Full-stack Engineer.',
        },
      },
      {
        candidate_id: candidateProfiles[1].id, // Siti Rahmawati
        job_id: createdJobs[1].id, // HR Specialist
        cv_storage_path: 'cvs/siti_rahmawati_hr_resume.pdf',
        cv_parsed_name: 'Siti Rahmawati, S.Psi',
        status: 'invited_interview',
        cv_score: 93.0,
        cv_analysis_json: {
          skills_matched: ['Tech Sourcing', 'ATS Management', 'Behavioral Interview', 'Communication'],
          experience_years: 3,
          recommendation: 'Kandidat unggulan, telah dijadwalkan interview user.',
        },
      },
      {
        candidate_id: candidateProfiles[2].id, // Dimas Aditya
        job_id: createdJobs[0].id, // Full-stack
        cv_storage_path: 'cvs/dimas_aditya_resume.pdf',
        cv_parsed_name: 'Dimas Aditya Pratama',
        status: 'pending',
        cv_score: null,
        cv_analysis_json: null,
      },
    ];

    for (const app of sampleApps) {
      const { error: appErr } = await supabase
        .from('applications')
        .upsert(app, { onConflict: 'candidate_id,job_id' });

      if (appErr) console.error('Application insert error:', appErr);
    }

    console.log('✅ 3 Sample Applications with CVs successfully seeded!');
  }

  console.log('\n🎉 ALL DATA HAS BEEN SUCCESSFULLY SEEDED TO DATABASE!\n');
}

seed().catch(console.error);
