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

import { generateWhatsAppContent } from '../lib/hermes-communicator';
import { sendWhatsAppViaHermes } from '../lib/hermes-whatsapp-transport';
import type { CommunicationEventType, CommunicationContext } from '../types/database';

function parseArgs(): { to?: string; event: CommunicationEventType } {
  const args = process.argv.slice(2);
  let to: string | undefined;
  let event: CommunicationEventType = 'screening_passed';

  for (const arg of args) {
    if (arg.startsWith('--to=')) {
      to = arg.split('=')[1];
    } else if (arg.startsWith('--event=')) {
      event = arg.split('=')[1] as CommunicationEventType;
    }
  }

  return { to, event };
}

async function main() {
  console.log('\n=======================================================');
  console.log('📱 TESTING SMART_HR HERMES WHATSAPP NOTIFICATION');
  console.log('=======================================================\n');

  const { to, event } = parseArgs();

  if (!to) {
    console.error('❌ Error: Parameter --to wajib disertakan.');
    console.log('💡 Contoh penggunaan:');
    console.log('   npx tsx scripts/test-hermes-whatsapp.ts --to=6285186813592 --event=screening_passed\n');
    process.exit(1);
  }

  console.log(`Config WHATSAPP_ENABLED : ${process.env.WHATSAPP_ENABLED}`);
  console.log(`Config GATEWAY_URL      : ${process.env.HERMES_GATEWAY_URL || 'http://localhost:8080'}`);
  console.log(`Target Phone Number     : ${to}`);
  console.log(`Event Type              : ${event}\n`);

  const baseUrl = (process.env.APP_BASE_URL || 'https://smarthr.my.id').replace(/\/$/, '');
  const mockAppId = 'test-app-uuid-12345';
  
  let actionUrl = `${baseUrl}/applications/${mockAppId}`;
  if (event === 'screening_passed' || event === 'personality_reminder') {
    actionUrl = `${baseUrl}/applications/${mockAppId}/personality-test`;
  } else if (event.includes('interview')) {
    actionUrl = `${baseUrl}/applications/${mockAppId}/interview`;
  }

  const context: CommunicationContext = {
    candidateName: 'Regi Muhamad',
    jobTitle: 'Senior Fullstack Engineer',
    companyName: 'SmartHR',
    actionUrl,
  };

  console.log(`⏳ Step 1: Merangkai pesan WhatsApp via Hermes untuk event '${event}'...`);
  const startTime = Date.now();
  const generated = await generateWhatsAppContent(event, context);
  const duration = Date.now() - startTime;

  console.log(`✅ Konten selesai dibuat (${duration}ms):`);
  console.log('-------------------------------------------------------');
  console.log(generated.message);
  console.log('-------------------------------------------------------\n');

  const containsHtml = /<[a-z][\s\S]*>/i.test(generated.message);
  if (containsHtml) {
    console.warn('⚠️ PERINGATAN: Teks mengandung tag HTML. Sanitizer gagal.');
  } else {
    console.log('✨ Sanitizer Check: 100% Bersih dari Tag HTML');
  }

  console.log(`\n⏳ Step 2: Mengirim pesan WhatsApp ke ${to}...`);
  const sendResult = await sendWhatsAppViaHermes({
    to,
    message: generated.message,
  });

  if (sendResult.success) {
    console.log(`🚀 Dispatch Berhasil! Message ID: ${sendResult.messageId || 'N/A'}`);
  } else {
    console.error(`❌ Pengiriman Gagal: ${sendResult.error}`);
    process.exit(1);
  }

  console.log('\n=======================================================');
  console.log('🎉 PENGUJIAN WHATSAPP HERMES SELESAI!');
  console.log('=======================================================\n');
}

main().catch((err) => {
  console.error('\n💥 FATAL ERROR PADA TEST WHATSAPP:', err);
  process.exit(1);
});
