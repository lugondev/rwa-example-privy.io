import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';

// Helper function to get userId from request
function getUserId(request: NextRequest): string | null {
  const userId = request.nextUrl.searchParams.get('userId') || request.headers.get('x-user-id');
  return userId || 'demo-user'; // Fallback for demo
}

/**
 * Get fractional ownership details for a specific asset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const prisma = await getPrismaClient();
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetId } = params;

    // Get asset details
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        fractionalOwnerships: {
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
            }
          }
        }
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Calculate total shares and ownership distribution
    const totalShares = asset.fractionalOwnerships.reduce(
      (sum, ownership) => sum + ownership.shares,
      0
    );

    const ownershipDistribution = asset.fractionalOwnerships.map(ownership => ({
      ownerId: ownership.ownerId,
      ownerName: ownership.owner.profile?.firstName && ownership.owner.profile?.lastName
        ? `${ownership.owner.profile.firstName} ${ownership.owner.profile.lastName}`
        : ownership.owner.walletAddress.slice(0, 8) + '...',
      shares: ownership.shares,
      percentage: totalShares > 0 ? (ownership.shares / totalShares) * 100 : 0,
      purchasePrice: ownership.purchasePrice,
      currentValue: totalShares > 0 ? (ownership.shares / totalShares) * asset.currentPrice : 0,
      purchaseDate: ownership.createdAt
    }));

    // Get user's ownership if any
    const userOwnership = asset.fractionalOwnerships.find(
      ownership => ownership.ownerId === userId
    );

    const response = {
      asset: {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        assetType: asset.assetType,
        totalValue: asset.totalValue,
        currentPrice: asset.currentPrice,
        fractionalEnabled: asset.fractionalEnabled
      },
      totalShares,
      availableShares: Math.max(0, 1000000 - totalShares), // Assuming 1M total shares
      ownershipDistribution,
      userOwnership: userOwnership ? {
        shares: userOwnership.shares,
        percentage: totalShares > 0 ? (userOwnership.shares / totalShares) * 100 : 0,
        purchasePrice: userOwnership.purchasePrice,
        currentValue: totalShares > 0 ? (userOwnership.shares / totalShares) * asset.currentPrice : 0,
        purchaseDate: userOwnership.createdAt
      } : null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching fractional ownership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Purchase fractional shares of an asset
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const prisma = await getPrismaClient();
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetId } = params;
    const { shares, pricePerShare } = await request.json();

    // Validate input
    if (!shares || shares <= 0 || !pricePerShare || pricePerShare <= 0) {
      return NextResponse.json(
        { error: 'Invalid shares or price' },
        { status: 400 }
      );
    }

    // Check if asset exists and fractional ownership is enabled
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        fractionalOwnerships: true
      }
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (!asset.fractionalEnabled) {
      return NextResponse.json(
        { error: 'Fractional ownership not enabled for this asset' },
        { status: 400 }
      );
    }

    // Calculate total existing shares
    const totalExistingShares = asset.fractionalOwnerships.reduce(
      (sum, ownership) => sum + ownership.shares,
      0
    );

    const maxShares = 1000000; // Assuming 1M total shares
    const availableShares = maxShares - totalExistingShares;

    if (shares > availableShares) {
      return NextResponse.json(
        { error: `Only ${availableShares} shares available` },
        { status: 400 }
      );
    }

    const totalCost = shares * pricePerShare;

    // Create or update fractional ownership
    const existingOwnership = await prisma.fractionalOwnership.findUnique({
      where: {
        assetId_ownerId: {
          assetId,
          ownerId: userId
        }
      }
    });

    let ownership;
    if (existingOwnership) {
      // Update existing ownership
      ownership = await prisma.fractionalOwnership.update({
        where: {
          assetId_ownerId: {
            assetId,
            ownerId: userId
          }
        },
        data: {
          shares: existingOwnership.shares + shares,
          totalShares: maxShares,
          purchasePrice: existingOwnership.purchasePrice + totalCost
        }
      });
    } else {
      // Create new ownership
      ownership = await prisma.fractionalOwnership.create({
        data: {
          assetId,
          ownerId: userId,
          shares,
          totalShares: maxShares,
          purchasePrice: totalCost
        }
      });
    }

    return NextResponse.json({
      message: 'Shares purchased successfully',
      ownership: {
        shares: ownership.shares,
        totalCost,
        percentage: (ownership.shares / maxShares) * 100
      }
    });
  } catch (error) {
    console.error('Error purchasing fractional shares:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}