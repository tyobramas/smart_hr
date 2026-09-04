import fs from 'fs';
import path from 'path';

// Load .env.local natively without external dependencies
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim();
    }
  }
}

import { resolveCandidatePhoneNumber } from '../lib/communication-engine';
import { normalizePhoneNumber } from '../lib/hermes-whatsapp-transport';

async function runTests() {
  console.log('\n=======================================================');
  console.log('🧪 TESTING MULTI-TIER PHONE NUMBER RESOLUTION');
  console.log('=======================================================\n');

  // Mock Supabase admin client for unit testing tiers
  const mockSupabase = {
    from: (table: string) => ({
      select: () => ({
        eq: (col: string, val: string) => ({
          maybeSingle: async () => {
            if (table === 'profiles' && val === 'prof-1') {
              return { data: { id: 'prof-1', user_id: 'user-1', phone: '0812-9988-7766' } };
            }
            return { data: null };
          },
        }),
      }),
    }),
    auth: {
      admin: {
        getUserById: async (userId: string) => {
          if (userId === 'user-meta-only') {
            return {
              data: {
                user: {
                  user_metadata: { phone: '0851-8888-9999' },
                },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: null };
        },
      },
    },
  };

  // Test 1: Tier 0 (Explicit Override)
  console.log('--- TEST 1: Tier 0 (Explicit Parameter Override) ---');
  const res0 = await resolveCandidatePhoneNumber(mockSupabase, {
    candidatePhoneOverride: '0812-3456-7890',
  });
  console.log(`Source: ${res0.source} | Phone: ${res0.phone}`);
  if (res0.phone !== '6281234567890' || res0.source !== 'override') {
    throw new Error('Test 1 failed!');
  }
  console.log('✅ TEST 1 PASSED\n');

  // Test 2: Tier 1a (Profile phone)
  console.log('--- TEST 2: Tier 1a (Profile Object/Query) ---');
  const res1a = await resolveCandidatePhoneNumber(mockSupabase, {
    candidate: {
      id: 'prof-1',
      user_id: 'user-1',
      full_name: 'Test Candidate',
      role: 'candidate',
      phone: '0812-9988-7766',
      created_at: new Date().toISOString(),
    },
  });
  console.log(`Source: ${res1a.source} | Phone: ${res1a.phone}`);
  if (res1a.phone !== '6281299887766' || res1a.source !== 'profile') {
    throw new Error('Test 2 failed!');
  }
  console.log('✅ TEST 2 PASSED\n');

  // Test 3: Tier 1b (Auth metadata)
  console.log('--- TEST 3: Tier 1b (Auth User Metadata) ---');
  const res1b = await resolveCandidatePhoneNumber(mockSupabase, {
    candidate: {
      id: 'prof-2',
      user_id: 'user-meta-only',
      full_name: 'Meta Candidate',
      role: 'candidate',
      created_at: new Date().toISOString(),
    },
  });
  console.log(`Source: ${res1b.source} | Phone: ${res1b.phone}`);
  if (res1b.phone !== '6285188889999' || res1b.source !== 'auth_metadata') {
    throw new Error('Test 3 failed!');
  }
  console.log('✅ TEST 3 PASSED\n');

  // Test 4: Tier 2 (CV Analysis JSON Extraction)
  console.log('--- TEST 4: Tier 2 (CV Analysis JSON Extraction) ---');
  const res2 = await resolveCandidatePhoneNumber(mockSupabase, {
    candidate: {
      id: 'prof-no-phone',
      user_id: 'user-empty',
      full_name: 'CV Candidate',
      role: 'candidate',
      created_at: new Date().toISOString(),
    },
    application: {
      id: 'app-cv-phone',
      cv_analysis_json: {
        candidate_phone: '0877-6655-4433',
        skills_matched: ['React', 'Next.js'],
      },
    },
  });
  console.log(`Source: ${res2.source} | Phone: ${res2.phone}`);
  if (res2.phone !== '6287766554433' || res2.source !== 'cv_extraction') {
    throw new Error('Test 4 failed!');
  }
  console.log('✅ TEST 4 PASSED\n');

  // Test 5: Tier 2 Nested (personal_info in CV Analysis)
  console.log('--- TEST 5: Tier 2 Nested (personal_info.phone in CV Analysis) ---');
  const res2Nested = await resolveCandidatePhoneNumber(mockSupabase, {
    candidate: {
      id: 'prof-no-phone',
      user_id: 'user-empty',
      full_name: 'CV Nested Candidate',
      role: 'candidate',
      created_at: new Date().toISOString(),
    },
    application: {
      id: 'app-cv-nested',
      cv_analysis_json: {
        personal_info: {
          phone: '+62 899-1122-3344',
        },
      },
    },
  });
  console.log(`Source: ${res2Nested.source} | Phone: ${res2Nested.phone}`);
  if (res2Nested.phone !== '6289911223344' || res2Nested.source !== 'cv_extraction') {
    throw new Error('Test 5 failed!');
  }
  console.log('✅ TEST 5 PASSED\n');

  // Test 6: Missing Phone Handling (No throw, graceful return)
  console.log('--- TEST 6: Missing Phone Graceful Fallback ---');
  const resMissing = await resolveCandidatePhoneNumber(mockSupabase, {
    candidate: {
      id: 'prof-empty',
      user_id: 'user-empty',
      full_name: 'Empty Candidate',
      role: 'candidate',
      created_at: new Date().toISOString(),
    },
    application: {
      id: 'app-empty',
      cv_analysis_json: {
        skills_matched: ['Design'],
      },
    },
  });
  console.log(`Source: ${resMissing.source} | Phone: ${resMissing.phone}`);
  if (resMissing.phone !== null || resMissing.source !== 'none') {
    throw new Error('Test 6 failed!');
  }
  console.log('✅ TEST 6 PASSED\n');

  console.log('=======================================================');
  console.log('🎉 ALL MULTI-TIER PHONE RESOLUTION TESTS PASSED!');
  console.log('=======================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
