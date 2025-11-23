import { NextRequest, NextResponse } from 'next/server';

import bot from '@/app/lib/telegram/telegram';

export async function GET() {
  return Response.json({ message: 'get request test' });
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (secret !== expected) {
    return new Response(JSON.stringify({ message: 'invalid telegram secret' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return new NextResponse('Error', { status: 500 });
  }
}
