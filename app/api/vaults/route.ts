import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * GET handler for vaults endpoint
 * Retrieves all vaults with pagination and filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const securityLevel = searchParams.get('securityLevel');
    const location = searchParams.get('location');
    const managerId = searchParams.get('managerId');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (securityLevel) where.securityLevel = securityLevel;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (managerId) where.managerId = managerId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    // Get total count for pagination
    const total = await prisma.vault.count({ where });
    
    // Fetch vaults with pagination
    const vaults = await prisma.vault.findMany({
      where,
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
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    
    return Response.json({ vaults, total, page, limit });
  } catch (error) {
    console.error('Error fetching vaults:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vaults' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating new vaults
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, location, securityLevel, capacity, managerId, description } = body;
    
    if (!name || !location || !securityLevel || !capacity || !managerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, location, securityLevel, capacity, managerId' },
        { status: 400 }
      );
    }
    
    // Get Prisma client
    const prisma = await getPrismaClient();
    
    const vault = await prisma.vault.create({
      data: {
        name,
        description: description || null,
        location,
        securityLevel,
        capacity: parseInt(capacity),
        managerId,
      },
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
      },
    });
    
    return NextResponse.json({ vault }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create vault' },
      { status: 500 }
    )
  }
}