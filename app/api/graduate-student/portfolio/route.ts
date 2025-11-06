import { NextRequest, NextResponse } from 'next/server';
import { getStudentPortfolio, getPortfolioEvidence, createPortfolioEvidence } from '@/lib/services/pedagogy-service';

/**
 * GET /api/graduate-student/portfolio
 * Get student portfolio and evidence
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const userId = cookies.get('user_id')?.value;
    const competencyId = req.nextUrl.searchParams.get('competencyId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const portfolio = await getStudentPortfolio(userId);

    if (!portfolio) {
      return NextResponse.json({
        success: true,
        data: {
          portfolio: null,
          evidence: []
        },
        message: 'Portfolio not yet created'
      });
    }

    const evidence = await getPortfolioEvidence(
      portfolio.portfolio_id,
      competencyId || undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        portfolio,
        evidence,
        evidenceCount: evidence.length
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch portfolio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graduate-student/portfolio
 * Add evidence to portfolio
 */
export async function POST(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const userId = cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      portfolioId,
      competencyId,
      evidenceTypeKm,
      evidenceTypeEn,
      titleKm,
      titleEn,
      descriptionKm,
      descriptionEn,
      fileUrl
    } = body;

    // Validate required fields
    if (!portfolioId || !competencyId || !evidenceTypeKm || !titleKm) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const evidence = await createPortfolioEvidence(
      portfolioId,
      competencyId,
      evidenceTypeKm,
      evidenceTypeEn || '',
      titleKm,
      titleEn || '',
      descriptionKm || '',
      descriptionEn || '',
      fileUrl || '',
      new Date().toISOString()
    );

    return NextResponse.json({
      success: true,
      message: 'Evidence added to portfolio',
      data: evidence
    });
  } catch (error) {
    console.error('Error adding portfolio evidence:', error);
    return NextResponse.json(
      {
        error: 'Failed to add portfolio evidence',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
