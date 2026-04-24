import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/auth-utils';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const idx = c.indexOf('=');
      return [c.slice(0, idx), c.slice(idx + 1)];
    })
  );
  const token = cookies['sb-auth-token'];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const type = formData.get('type') as string;

  // Get all files from the form data
  const files: { file: File; fileExt: string; fileName: string }[] = [];
  const fileList = formData.getAll('files') as File[];

  for (const file of fileList) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${payload.userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    files.push({ file, fileExt: fileExt || '', fileName });
  }

  const uploadedFiles = [];

  try {
    for (const { file, fileName } of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error } = await supabaseAdmin.storage
        .from('posts')
        .upload(fileName, buffer, { contentType: file.type });

      if (error) {
        throw new Error(error.message);
      }

      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/posts/${fileName}`;
      uploadedFiles.push({
        id: fileName,
        url,
      });
    }

    return NextResponse.json({
      files: uploadedFiles,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
