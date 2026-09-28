import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const programmes = await prisma.programme.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' },
      include: {
        feeConfig: true,
      },
    });

    const result = programmes.map((p) => {
      const config = p.feeConfig;
      const requiresApplicationFee = Boolean(config?.requiresApplicationFee && (config?.applicationFeeAmount || 0) > 0);
      const applicationFee = config?.requiresApplicationFee ? (config?.applicationFeeAmount || 0) : 0;
      const schoolFee = config?.schoolFeeAmount || 0;
      const currency = config?.currency || 'NGN';

      return {
        id: p.id,
        code: p.code,
        name: p.nameEnglish,
        nameEnglish: p.nameEnglish,
        nameArabic: p.nameArabic,
        description: p.description,
        requiresApplicationFee,
        applicationFeeAmount: applicationFee,
        schoolFeeAmount: schoolFee,
        currency,
        feeConfig: {
          requiresApplicationFee,
          applicationFee,
          schoolFee,
          currency,
        },
      };
    });

    return NextResponse.json({ status: 'success', programmes: result });
  } catch (error: any) {
    console.error('[PUBLIC_PROGRAMMES_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch programmes.' }, { status: 500 });
  }
}
