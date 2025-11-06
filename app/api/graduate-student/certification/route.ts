import { NextRequest, NextResponse } from 'next/server';
import { getCertificationStatus, checkCertificationReadiness, issueFinalCertification } from '@/lib/services/pedagogy-service';

/**
 * GET /api/graduate-student/certification
 * Get certification status and readiness
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const userId = cookies.get('user_id')?.value;
    const userRole = cookies.get('role')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const certificationStatus = await getCertificationStatus(userId);
    const readiness = await checkCertificationReadiness(userId);

    return NextResponse.json({
      success: true,
      data: {
        requirements: certificationStatus,
        readiness,
        canIssueCertificate: readiness.isReadyForCertification && userRole === 'coordinator'
      }
    });
  } catch (error) {
    console.error('Error fetching certification status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch certification status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graduate-student/certification
 * Issue final certification (coordinator only)
 */
export async function POST(req: NextRequest) {
  try {
    const cookies = req.cookies;
    const coordinatorId = cookies.get('user_id')?.value;
    const userRole = cookies.get('role')?.value;

    if (!coordinatorId || userRole !== 'coordinator') {
      return NextResponse.json(
        { error: 'Unauthorized - coordinator access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { graduateStudentId, programId, certificationNumber, expiryDate } = body;

    // Validate required fields
    if (!graduateStudentId || !programId || !certificationNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: graduateStudentId, programId, certificationNumber' },
        { status: 400 }
      );
    }

    // Check if student is ready for certification
    const readiness = await checkCertificationReadiness(graduateStudentId);

    if (!readiness.isReadyForCertification) {
      return NextResponse.json(
        {
          error: 'Student is not ready for certification',
          details: `${readiness.completedRequirements}/${readiness.totalRequirements} requirements completed`
        },
        { status: 400 }
      );
    }

    const issuedDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const computedExpiryDate = expiryDate || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 5 years default

    const certification = await issueFinalCertification(
      graduateStudentId,
      programId,
      certificationNumber,
      issuedDate,
      computedExpiryDate
    );

    return NextResponse.json({
      success: true,
      message: 'Contract teacher certificate issued successfully',
      data: certification
    });
  } catch (error) {
    console.error('Error issuing certification:', error);
    return NextResponse.json(
      {
        error: 'Failed to issue certification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
