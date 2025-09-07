import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

/**
 * Mock data fallback for when database is empty
 */
const mockAssets = [
  {
    id: '1',
    name: 'Real Estate Token A',
    description: 'Premium commercial real estate in downtown Manhattan',
    type: 'Real Estate',
    currentPrice: 1250.50,
    priceChange24h: 2.5,
    totalSupply: 10000,
    availableShares: 2500,
    marketCap: 5000000,
    image: '/images/real-estate-1.jpg',
    location: 'New York, NY',
    yield: 8.5,
    riskLevel: 'Medium' as const,
    verified: true,
    featured: true,
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Gold Token B',
    description: 'Physical gold bullion stored in secure vault',
    type: 'Physical Collectible',
    currentPrice: 2100.75,
    priceChange24h: -1.2,
    totalSupply: 5000,
    availableShares: 1200,
    marketCap: 3200000,
    image: '/images/gold-1.jpg',
    location: 'London, UK',
    yield: 6.2,
    riskLevel: 'Low' as const,
    verified: true,
    featured: true,
    createdAt: '2024-01-10T00:00:00Z'
  },
  {
    id: '3',
    name: 'Art Collection C',
    description: 'Curated collection of contemporary digital art',
    type: 'Digital NFT',
    currentPrice: 850.25,
    priceChange24h: 5.8,
    totalSupply: 1000,
    availableShares: 750,
    marketCap: 1800000,
    image: '/images/art-1.jpg',
    location: 'Virtual',
    yield: 12.1,
    riskLevel: 'High' as const,
    verified: false,
    featured: false,
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    id: '4',
    name: 'Luxury Watch Collection',
    description: 'Rare vintage watches from premium brands',
    type: 'Physical Collectible',
    currentPrice: 3250.00,
    priceChange24h: 3.2,
    totalSupply: 500,
    availableShares: 150,
    marketCap: 2500000,
    image: '/images/watches-1.jpg',
    location: 'Geneva, Switzerland',
    yield: 9.8,
    riskLevel: 'Medium' as const,
    verified: true,
    featured: true,
    createdAt: '2024-01-20T00:00:00Z'
  },
  {
    id: '5',
    name: 'Residential Property Fund',
    description: 'Diversified portfolio of residential properties',
    type: 'Real Estate',
    currentPrice: 550.75,
    priceChange24h: 1.8,
    totalSupply: 25000,
    availableShares: 8500,
    marketCap: 4200000,
    image: '/images/residential-1.jpg',
    location: 'Los Angeles, CA',
    yield: 7.2,
    riskLevel: 'Low' as const,
    verified: true,
    featured: false,
    createdAt: '2024-01-25T00:00:00Z'
  },
  {
    id: '6',
    name: 'Rare Wine Collection',
    description: 'Investment-grade vintage wines from top vineyards',
    type: 'Physical Collectible',
    currentPrice: 1850.00,
    priceChange24h: -0.5,
    totalSupply: 2000,
    availableShares: 600,
    marketCap: 1650000,
    image: '/images/wine-1.jpg',
    location: 'Bordeaux, France',
    yield: 11.4,
    riskLevel: 'High' as const,
    verified: true,
    featured: false,
    createdAt: '2024-02-01T00:00:00Z'
  }
]

/**
 * GET handler for assets endpoint
 * Retrieves assets with pagination, sorting, and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minYield = searchParams.get('minYield')
    const maxYield = searchParams.get('maxYield')
    const location = searchParams.get('location')
    const riskLevel = searchParams.get('riskLevel')
    
    console.log('Assets API called with params:', { page, limit, sortBy, sortOrder, search, type, category, minPrice, maxPrice, minYield, maxYield, location, riskLevel })
    
    const skip = (page - 1) * limit
    let assets: any[] = []
    let totalAssets = 0
    let useDatabase = false
    
    // Try to get database assets first
    try {
      const prisma = await getPrismaClient()
      // Test database connection
      await prisma.$queryRaw`SELECT 1`
      
      // Build where clause
      const whereClause: any = {}
      if (type && type !== 'all') {
        whereClause.assetType = type
      }
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }
      
      // Build orderBy clause
      let orderBy: any = { createdAt: sortOrder as 'asc' | 'desc' }
      
      if (sortBy === 'currentPrice') {
        orderBy = { currentPrice: sortOrder as 'asc' | 'desc' }
      } else if (sortBy === 'name') {
        orderBy = { name: sortOrder as 'asc' | 'desc' }
      }
      
      // Get total count
      const totalCount = await prisma.asset.count({ where: whereClause })
      
      const dbAssets = await prisma.asset.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          vault: true,
          fractionalOwnerships: true
        }
      })
      
      if (dbAssets.length > 0) {
        // Transform database assets to frontend format
        assets = dbAssets.map((asset: any) => {
          const totalShares = asset.fractionalOwnerships.reduce((sum: number, fo: any) => sum + fo.totalShares, 0) || 10000
          const ownedShares = asset.fractionalOwnerships.reduce((sum: number, fo: any) => sum + fo.shares, 0) || 0
          const availableShares = Math.max(0, totalShares - ownedShares)
          
          return {
            id: asset.id,
            name: asset.name,
            description: asset.description || `Premium ${asset.assetType} investment opportunity`,
            type: asset.assetType,
            currentPrice: asset.currentPrice,
            priceChange24h: Math.random() * 10 - 5, // Mock change data since we don't store historical prices
            totalSupply: totalShares,
            availableShares,
            marketCap: asset.totalValue || asset.currentPrice * totalShares,
            image: asset.metadata?.image || `/images/${asset.assetType.toLowerCase()}-${asset.id}.jpg`,
            location: asset.metadata?.location || 'N/A',
            yield: asset.vault?.interestRate || Math.random() * 15 + 3, // Mock yield data
            riskLevel: asset.metadata?.riskLevel || (['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]),
            verified: asset.metadata?.verified || Math.random() > 0.3,
            createdAt: asset.createdAt.toISOString()
          }
        })
        useDatabase = true
        totalAssets = totalCount
        console.log(`Found ${assets.length} assets from database`)
      }
    } catch (dbError) {
      console.warn('Database connection failed, using mock data:', dbError)
    }
    
    // If database failed or no assets, use mock data
    if (!useDatabase || assets.length === 0) {
      console.log('Using mock data fallback')
      let filteredAssets = [...mockAssets]
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        filteredAssets = filteredAssets.filter(asset => 
          asset.name.toLowerCase().includes(searchLower) ||
          asset.description.toLowerCase().includes(searchLower)
        )
      }
      
      // Apply type filter
      if (type && type !== 'all') {
        filteredAssets = filteredAssets.filter(asset => asset.type === type)
      }
      
      // Apply price filters
      if (minPrice) {
        const min = parseFloat(minPrice)
        filteredAssets = filteredAssets.filter(asset => asset.currentPrice >= min)
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice)
        filteredAssets = filteredAssets.filter(asset => asset.currentPrice <= max)
      }
      
      // Apply risk level filter
      if (riskLevel && riskLevel !== 'all') {
        filteredAssets = filteredAssets.filter(asset => asset.riskLevel === riskLevel)
      }
      
      // Apply yield filters
      if (minYield) {
        const min = parseFloat(minYield)
        filteredAssets = filteredAssets.filter(asset => asset.yield >= min)
      }
      if (maxYield) {
        const max = parseFloat(maxYield)
        filteredAssets = filteredAssets.filter(asset => asset.yield <= max)
      }
      
      // Apply location filter
      if (location) {
        const locationLower = location.toLowerCase()
        filteredAssets = filteredAssets.filter(asset => 
          asset.location.toLowerCase().includes(locationLower)
        )
      }
      
      // Apply category filter (for mock data, we'll use a simple mapping)
      if (category && category !== 'all') {
        // Map categories to asset types for filtering
        const categoryMap: { [key: string]: string[] } = {
          'Commercial': ['Real Estate'],
          'Residential': ['Real Estate'],
          'Gold': ['Physical Collectible'],
          'Silver': ['Physical Collectible'],
          'Watches': ['Physical Collectible'],
          'Wine': ['Physical Collectible'],
          'Art': ['Digital NFT'],
          'Music': ['Digital NFT']
        }
        
        const allowedTypes = categoryMap[category] || []
        if (allowedTypes.length > 0) {
          filteredAssets = filteredAssets.filter(asset => allowedTypes.includes(asset.type))
        }
      }
      
      // Apply sorting
      if (sortBy === 'currentPrice') {
        filteredAssets.sort((a, b) => sortOrder === 'desc' ? b.currentPrice - a.currentPrice : a.currentPrice - b.currentPrice)
      } else if (sortBy === 'priceChange24h') {
        filteredAssets.sort((a, b) => sortOrder === 'desc' ? b.priceChange24h - a.priceChange24h : a.priceChange24h - b.priceChange24h)
      } else if (sortBy === 'marketCap') {
        filteredAssets.sort((a, b) => sortOrder === 'desc' ? b.marketCap - a.marketCap : a.marketCap - b.marketCap)
      } else if (sortBy === 'name') {
        filteredAssets.sort((a, b) => sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name))
      } else {
        // Default sort by createdAt
        filteredAssets.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
        })
      }
      
      // Store total before pagination
      totalAssets = filteredAssets.length
      
      // Apply pagination
      assets = filteredAssets.slice(skip, skip + limit)
    }
    
    console.log(`Returning ${assets.length} assets`)
    return NextResponse.json({
      assets,
      total: totalAssets,
      page,
      limit,
      totalPages: Math.ceil(totalAssets / limit)
    })
  } catch (error) {
    console.error('Assets API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating new assets
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrismaClient()
    const body = await request.json()
    
    const asset = await prisma.asset.create({
      data: body
    })
    
    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    console.error('POST Assets API error:', error)
    return NextResponse.json(
      { error: 'Failed to create asset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}