import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/vaults/investments/[address]
 * Retrieves all vault investments for a specific wallet address
 */
export async function GET(request: Request, { params }: { params: { address: string } }) {
  try {
    const { address } = params;

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: {
        walletAddress: address,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get vault tracking records for this user (investments)
    const vaultInvestments = await prisma.vaultTracking.findMany({
      where: {
        userId: user.id,
        action: 'deposit', // Only get deposit actions as investments
      },
      include: {
        vault: {
          include: {
            manager: {
              select: {
                id: true,
                walletAddress: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Transform data to match frontend interface
    const investments = vaultInvestments.map((investment) => {
      const currentValue = investment.totalValue; // This could be calculated based on current vault performance
      const profitLoss = currentValue - investment.totalValue;
      const profitLossPercentage = investment.totalValue > 0 
        ? (profitLoss / investment.totalValue) * 100 
        : 0;

      return {
        id: investment.id,
        vaultId: investment.vaultId,
        vault: {
          id: investment.vault.id,
          name: investment.vault.name,
          description: investment.vault.description,
          location: investment.vault.location,
          securityLevel: investment.vault.securityLevel,
          capacity: investment.vault.capacity,
          currentAssets: investment.vault.currentAssets,
          managerId: investment.vault.managerId,
          createdAt: investment.vault.createdAt.toISOString(),
          updatedAt: investment.vault.updatedAt.toISOString(),
        },
        amount: investment.amount,
        shares: investment.amount / investment.tokenPrice, // Calculate shares based on token price
        investmentDate: investment.timestamp.toISOString(),
        currentValue,
        profitLoss,
        profitLossPercentage,
      };
    });

    return NextResponse.json({
      investments,
      total: investments.length,
    });
  } catch (error) {
    console.error('Error fetching vault investments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}