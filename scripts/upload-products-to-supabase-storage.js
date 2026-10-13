const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliY2Z6c2JnZXFzb2NwYnFoenN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjYxMjgsImV4cCI6MjEwNjg0MjEyOH0.neMQPjYu2CmtcCDmcg9fB-mMn7gM6yO-vAs2U3VEJWs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PRODUCTS_IMAGES_META = [
  {
    id: 'prod-1',
    fileName: 'prod-1-signature-ballcap.png',
    localRelPath: 'public/images/products/bundle-1.png',
    fallbackUrl: null,
    contentType: 'image/png',
  },
  {
    id: 'prod-2',
    fileName: 'prod-2-vintage-washing-ballcap.png',
    localRelPath: 'public/images/products/bundle-2.png',
    fallbackUrl: null,
    contentType: 'image/png',
  },
  {
    id: 'prod-3',
    fileName: 'prod-3-safari-buckethat.jpg',
    localRelPath: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80',
    contentType: 'image/jpeg',
  },
  {
    id: 'prod-4',
    fileName: 'prod-4-bigsize-buckethat.png',
    localRelPath: 'public/images/products/bundle-3.png',
    fallbackUrl: null,
    contentType: 'image/png',
  },
  {
    id: 'prod-5',
    fileName: 'prod-5-daily-ribbed-beanie.png',
    localRelPath: 'public/images/products/bundle-4.png',
    fallbackUrl: null,
    contentType: 'image/png',
  },
  {
    id: 'prod-6',
    fileName: 'prod-6-cooling-sunvisor.jpg',
    localRelPath: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    contentType: 'image/jpeg',
  },
  {
    id: 'prod-7',
    fileName: 'prod-7-melton-snapback.jpg',
    localRelPath: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=800&q=80',
    contentType: 'image/jpeg',
  },
  {
    id: 'prod-8',
    fileName: 'prod-8-lightweight-campcap.jpg',
    localRelPath: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=800&q=80',
    contentType: 'image/jpeg',
  },
  {
    id: 'prod-1791771105377',
    fileName: 'prod-custom-outdoor-campcap.png',
    localRelPath: 'public/uploads/prod_1791771102337_644pm1.png',
    fallbackUrl: null,
    contentType: 'image/png',
  },
];

async function getImageBuffer(meta) {
  if (meta.localRelPath) {
    const fullPath = path.join(process.cwd(), meta.localRelPath);
    if (fs.existsSync(fullPath)) {
      console.log(`  📂 Reading local file: ${meta.localRelPath}`);
      return fs.readFileSync(fullPath);
    }
  }

  if (meta.fallbackUrl) {
    console.log(`  🌐 Downloading remote image: ${meta.fallbackUrl}`);
    const res = await fetch(meta.fallbackUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // uploads 폴더의 최신 파일 검색 fallback
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    if (files.length > 0) {
      const fallbackFile = path.join(uploadsDir, files[0]);
      console.log(`  📂 Using uploaded fallback file: ${fallbackFile}`);
      return fs.readFileSync(fallbackFile);
    }
  }

  // default bundle-1 fallback
  return fs.readFileSync(path.join(process.cwd(), 'public/images/products/bundle-1.png'));
}

async function uploadAllImages() {
  console.log('🚀 [Supabase Storage Migration] Uploading hat product images to "products" bucket...');

  const uploadedResults = [];

  for (const meta of PRODUCTS_IMAGES_META) {
    console.log(`\n▶ Processing [${meta.id}] -> Storage file: ${meta.fileName}`);

    try {
      const buffer = await getImageBuffer(meta);
      console.log(`  📦 Buffer size: ${(buffer.length / 1024).toFixed(1)} KB`);

      // 1. Supabase Storage [products] 버킷에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(meta.fileName, buffer, {
          contentType: meta.contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error(`  ❌ Storage upload error for ${meta.fileName}:`, uploadError);
        continue;
      }

      // 2. Public URL 가져오기
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(meta.fileName);

      const publicUrl = urlData.publicUrl;
      console.log(`  ✅ Storage Public URL: ${publicUrl}`);

      // 3. Supabase [products] 테이블 해당 레코드 UPDATE
      const { data: updateData, error: updateError } = await supabase
        .from('products')
        .update({
          images: [publicUrl],
          updated_at: new Date().toISOString(),
        })
        .eq('id', meta.id)
        .select('id, title, images');

      if (updateError) {
        console.warn(`  ⚠️ DB Update warning for ${meta.id}:`, updateError.message);
      } else {
        console.log(`  💾 Updated DB product record:`, updateData?.[0]?.title);
      }

      uploadedResults.push({
        id: meta.id,
        fileName: meta.fileName,
        publicUrl,
        size: buffer.length,
      });
    } catch (err) {
      console.error(`  ❌ Error processing ${meta.id}:`, err);
    }
  }

  console.log('\n=============================================================');
  console.log(`🎉 [SUCCESS] Uploaded ${uploadedResults.length} / ${PRODUCTS_IMAGES_META.length} images to Supabase Storage!`);
  console.log('=============================================================\n');

  // 최종 결과 검증
  const { data: currentProducts } = await supabase
    .from('products')
    .select('id, title, images')
    .order('created_at', { ascending: false });

  console.log('📋 Current Products in Supabase with Storage URLs:');
  console.log(JSON.stringify(currentProducts, null, 2));
}

uploadAllImages();
