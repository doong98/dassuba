import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('[Toss Webhook Received]:', payload.eventType, payload.data?.orderId);

    const { eventType, data } = payload;
    if (!data || !data.orderId) {
      return NextResponse.json({ success: false, message: 'Invalid webhook payload' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, message: 'DB not configured' });
    }

    // 상태 매핑
    let newStatus: string | null = null;
    if (data.status === 'DONE') {
      newStatus = 'paid';
    } else if (data.status === 'CANCELED') {
      newStatus = 'cancelled';
    } else if (data.status === 'EXPIRED' || data.status === 'ABORTED') {
      newStatus = 'failed';
    }

    if (newStatus) {
      await supabase
        .from('orders')
        .update({
          status: newStatus,
          payment_key: data.paymentKey,
          receipt_url: data.receipt?.url || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', data.orderId);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
