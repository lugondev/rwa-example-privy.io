import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET handler for specific vault
 * Retrieves vault by ID with related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const vault = await prisma.vault.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            walletAddress: true,
            email: true,
          },
        },
        assets: {
          select: {
            id: true,
            name: true,
            assetType: true,
            totalValue: true,
            currentPrice: true,
          },
        },
      }
    })
    
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(vault)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vault' },
      { status: 500 }
    )
  }
}

/**
 * PUT handler for updating vault
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Only allow updating specific fields
    const allowedFields = ['name', 'description', 'location', 'securityLevel', 'capacity'];
    const updateData: any = {};
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = field === 'capacity' ? parseInt(body[field]) : body[field];
      }
    });
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const vault = await prisma.vault.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            walletAddress: true,
            email: true,
          },
        },
        assets: {
          select: {
            id: true,
            name: true,
            assetType: true,
            totalValue: true,
            currentPrice: true,
          },
        },
      }
    })
    
    return NextResponse.json({ vault })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update vault' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for removing vault
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    await prisma.vault.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Vault deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete vault' },
      { status: 500 }
    )
  }
}