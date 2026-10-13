import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '업로드할 이미지 파일이 전달되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일(PNG, JPG, WEBP 등)만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (최대 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '파일 용량은 최대 10MB 이하만 가능합니다.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 고유 파일명 생성
    const rawExt = path.extname(file.name) || (file.type === 'image/png' ? '.png' : '.jpg');
    const ext = rawExt.toLowerCase();
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const fileName = `prod_${timestamp}_${randomHex}${ext}`;

    // 1. Supabase Storage [products] 버킷 업로드 시도
    let supabaseUploadSuccess = false;
    let finalImageUrl = '';

    if (supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            finalImageUrl = publicUrlData.publicUrl;
            supabaseUploadSuccess = true;
          }
        } else {
          console.warn('Supabase Storage upload warning:', uploadError?.message);
        }
      } catch (err: any) {
        console.warn('Supabase Storage upload exception:', err.message);
      }
    }

    // 2. Supabase Storage 실패 시 로컬 public/uploads/ 폴더에 안전하게 Fallback 저장
    if (!supabaseUploadSuccess) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      finalImageUrl = `/uploads/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      url: finalImageUrl,
      fileName,
      storage: supabaseUploadSuccess ? 'supabase' : 'local_fallback',
      message: supabaseUploadSuccess
        ? 'Supabase Storage에 성공적으로 저장되었습니다.'
        : '로컬 스토리지에 안전하게 임시 저장되었습니다. (Supabase Storage 버킷 생성 시 즉시 클라우드 저장)',
    });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '이미지 업로드 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
