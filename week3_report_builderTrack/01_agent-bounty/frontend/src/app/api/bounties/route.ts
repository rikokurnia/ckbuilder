import { NextResponse } from 'next/server';
import { fiberStore } from '@/lib/fiberStore';

export async function GET() {
  try {
    const bounties = fiberStore.getBounties();
    const invoices = fiberStore.getInvoices();
    const channel = fiberStore.getChannel();

    return NextResponse.json({
      success: true,
      data: {
        bounties,
        invoices,
        channel,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, category, prompt, rewardCkb, creator, paymentHash } = body;

    if (!title || !prompt || !rewardCkb || !paymentHash) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters (title, prompt, rewardCkb, paymentHash)' },
        { status: 400 }
      );
    }

    const task = fiberStore.createBounty(
      title,
      description || title,
      category || 'CODE_AUDIT',
      prompt,
      Number(rewardCkb),
      creator || 'ckb1_connected_wallet',
      paymentHash
    );

    return NextResponse.json({
      success: true,
      data: {
        task,
        channel: fiberStore.getChannel(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
