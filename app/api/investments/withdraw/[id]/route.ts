import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/vaults/investments/[id]/withdraw
 * Withdraws funds from a specific vault investment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const investmentId = params.id;
    const body = await request.json();
    const { amount, walletAddress } = body;

    if (!investmentId) {
      return NextResponse.json(
        { error: 'Investment ID is required' },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the original investment (deposit) record
    const originalInvestment = await prisma.vaultTracking.findFirst({
      where: {
        id: investmentId,
        userId: user.id,
        action: 'deposit',
      },
      include: {
        vault: true,
      },
    });

    if (!originalInvestment) {
      return NextResponse.json(
        { error: 'Investment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Calculate total invested amount for this vault by this user
    const totalInvested = await prisma.vaultTracking.aggregate({
      where: {
        userId: user.id,
        vaultId: originalInvestment.vaultId,
        action: 'deposit',
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate total withdrawn amount for this vault by this user
    const totalWithdrawn = await prisma.vaultTracking.aggregate({
      where: {
        userId: user.id,
        vaultId: originalInvestment.vaultId,
        action: 'withdraw',
      },
      _sum: {
        amount: true,
      },
    });

    const availableBalance = (totalInvested._sum.amount || 0) - (totalWithdrawn._sum.amount || 0);
    const withdrawAmount = amount || availableBalance; // If no amount specified, withdraw all

    if (withdrawAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    if (withdrawAmount > availableBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance for withdrawal' },
        { status: 400 }
      );
    }

    // Create withdrawal record
    const withdrawal = await prisma.vaultTracking.create({
      data: {
        userId: user.id,
        vaultId: originalInvestment.vaultId,
        action: 'withdraw',
        amount: withdrawAmount,
        tokenPrice: originalInvestment.tokenPrice, // Use same token price for consistency
        totalValue: withdrawAmount,
        timestamp: new Date(),
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
    });

    // Update vault current assets count if needed
    // This is a simplified approach - in a real system, you might need more complex logic
    await prisma.vault.update({
      where: {
        id: originalInvestment.vaultId,
      },
      data: {
        currentAssets: {
          decrement: Math.floor(withdrawAmount / originalInvestment.tokenPrice),
        },
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        vaultId: withdrawal.vaultId,
        amount: withdrawal.amount,
        totalValue: withdrawal.totalValue,
        timestamp: withdrawal.timestamp.toISOString(),
        vault: {
          id: withdrawal.vault.id,
          name: withdrawal.vault.name,
          location: withdrawal.vault.location,
        },
      },
      remainingBalance: availableBalance - withdrawAmount,
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}