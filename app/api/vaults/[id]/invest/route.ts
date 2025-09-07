import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/vaults/[id]/invest
 * Creates a new investment in a specific vault
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vaultId } = params;
    const body = await request.json();
    const { amount, walletAddress } = body;

    if (!vaultId) {
      return NextResponse.json(
        { error: 'Vault ID is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid investment amount is required' },
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

    // Check if vault exists and has capacity
    const vault = await prisma.vault.findUnique({
      where: {
        id: vaultId,
      },
      include: {
        manager: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    // Check vault capacity
    if (vault.currentAssets >= vault.capacity) {
      return NextResponse.json(
        { error: 'Vault has reached maximum capacity' },
        { status: 400 }
      );
    }

    // Calculate token price (simplified - in real system this would be more complex)
    const tokenPrice = 1.0; // Base price per token/share
    const shares = amount / tokenPrice;
    const totalValue = amount;

    // Check if adding this investment would exceed capacity
    const newAssetCount = vault.currentAssets + Math.floor(shares);
    if (newAssetCount > vault.capacity) {
      return NextResponse.json(
        { error: 'Investment would exceed vault capacity' },
        { status: 400 }
      );
    }

    // Create investment record in vault_tracking
    const investment = await prisma.vaultTracking.create({
      data: {
        userId: user.id,
        vaultId: vault.id,
        action: 'deposit',
        amount,
        tokenPrice,
        totalValue,
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

    // Update vault current assets count
    await prisma.vault.update({
      where: {
        id: vaultId,
      },
      data: {
        currentAssets: {
          increment: Math.floor(shares),
        },
      },
    });

    // Create notification for successful investment
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'vault_investment',
        title: 'Investment Successful',
        message: `Successfully invested ${amount} in vault "${vault.name}"`,
        metadata: {
          vaultId: vault.id,
          amount,
          shares,
          investmentId: investment.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      investment: {
        id: investment.id,
        vaultId: investment.vaultId,
        amount: investment.amount,
        shares,
        tokenPrice: investment.tokenPrice,
        totalValue: investment.totalValue,
        investmentDate: investment.timestamp.toISOString(),
        vault: {
          id: investment.vault.id,
          name: investment.vault.name,
          description: investment.vault.description,
          location: investment.vault.location,
          securityLevel: investment.vault.securityLevel,
          capacity: investment.vault.capacity,
          currentAssets: newAssetCount,
          managerId: investment.vault.managerId,
        },
      },
    });
  } catch (error) {
    console.error('Error creating investment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}