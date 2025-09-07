import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';

// Helper function to get userId from request
function getUserId(request: NextRequest): string | null {
  const userId = request.nextUrl.searchParams.get('userId') || request.headers.get('x-user-id');
  return userId || 'demo-user'; // Fallback for demo
}

/**
 * Get dividend history for user's fractional ownerships
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrismaClient();
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get user's fractional ownerships
    const ownerships = await prisma.fractionalOwnership.findMany({
      where: {
        ownerId: userId,
        ...(assetId && { assetId })
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetType: true,
            currentPrice: true
          }
        }
      }
    });

    // Calculate dividend distributions
    const dividendHistory = [];
    const totalDividends = {
      thisMonth: 0,
      thisYear: 0,
      allTime: 0
    };

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    for (const ownership of ownerships) {
      // Simulate dividend payments (in real app, this would come from actual dividend records)
      const monthlyDividendRate = 0.005; // 0.5% monthly dividend
      const shareValue = (ownership.shares / ownership.totalShares) * ownership.asset.currentPrice;
      const monthlyDividend = shareValue * monthlyDividendRate;

      // Generate last 12 months of dividend history
      for (let i = 0; i < 12; i++) {
        const paymentDate = new Date(currentYear, currentMonth - i, 15);
        const dividend = {
          id: `${ownership.assetId}-${paymentDate.getTime()}`,
          assetId: ownership.assetId,
          assetName: ownership.asset.name,
          assetType: ownership.asset.assetType,
          shares: ownership.shares,
          totalShares: ownership.totalShares,
          sharePercentage: (ownership.shares / ownership.totalShares) * 100,
          dividendAmount: monthlyDividend,
          dividendRate: monthlyDividendRate * 100,
          paymentDate,
          status: 'paid' as const
        };

        dividendHistory.push(dividend);

        // Calculate totals
        totalDividends.allTime += monthlyDividend;
        if (paymentDate.getFullYear() === currentYear) {
          totalDividends.thisYear += monthlyDividend;
          if (paymentDate.getMonth() === currentMonth) {
            totalDividends.thisMonth += monthlyDividend;
          }
        }
      }
    }

    // Sort by payment date (newest first)
    dividendHistory.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

    // Apply pagination
    const paginatedHistory = dividendHistory.slice(skip, skip + limit);
    const totalCount = dividendHistory.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      dividends: paginatedHistory,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary: {
        totalDividends,
        averageMonthlyDividend: totalDividends.allTime / 12,
        totalAssets: ownerships.length,
        totalShares: ownerships.reduce((sum, o) => sum + o.shares, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching dividend history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Distribute dividends to fractional owners (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrismaClient();
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real app, you'd check if user is admin
    // For now, we'll simulate dividend distribution

    const { assetId, dividendPerShare, description } = await request.json();

    if (!assetId || !dividendPerShare || dividendPerShare <= 0) {
      return NextResponse.json(
        { error: 'Invalid asset ID or dividend amount' },
        { status: 400 }
      );
    }

    // Get all fractional ownerships for the asset
    const ownerships = await prisma.fractionalOwnership.findMany({
      where: { assetId },
      include: {
        owner: {
          select: {
            id: true,
            walletAddress: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        asset: {
          select: {
            name: true,
            assetType: true
          }
        }
      }
    });

    if (ownerships.length === 0) {
      return NextResponse.json(
        { error: 'No fractional owners found for this asset' },
        { status: 404 }
      );
    }

    // Calculate dividend distribution
    const distributions = ownerships.map(ownership => {
      const dividendAmount = ownership.shares * dividendPerShare;
      return {
        ownerId: ownership.ownerId,
        ownerName: ownership.owner.profile?.firstName && ownership.owner.profile?.lastName
          ? `${ownership.owner.profile.firstName} ${ownership.owner.profile.lastName}`
          : ownership.owner.walletAddress.slice(0, 8) + '...',
        shares: ownership.shares,
        dividendAmount,
        assetName: ownership.asset.name
      };
    });

    const totalDividend = distributions.reduce((sum, d) => sum + d.dividendAmount, 0);
    const totalShares = distributions.reduce((sum, d) => sum + d.shares, 0);

    // In a real app, you would:
    // 1. Create dividend records in the database
    // 2. Process actual payments
    // 3. Send notifications to owners

    return NextResponse.json({
      message: 'Dividend distribution calculated successfully',
      distribution: {
        assetId,
        description: description || 'Monthly dividend distribution',
        dividendPerShare,
        totalDividend,
        totalShares,
        totalRecipients: distributions.length,
        distributions,
        distributionDate: new Date()
      }
    });
  } catch (error) {
    console.error('Error distributing dividends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}