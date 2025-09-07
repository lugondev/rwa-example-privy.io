import { PrismaClient } from '@prisma/client'

/**
 * Global Prisma client instance with singleton pattern
 * Prevents multiple instances in development with hot reloading
 */
let prismaInstance: PrismaClient | null = null

/**
 * Get or create Prisma client instance
 */
export async function getPrismaClient(): Promise<PrismaClient> {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    })
  }
  return prismaInstance
}

/**
 * Database utilities and connection management
 */
export const db = {
  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const prisma = await getPrismaClient()
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database connection failed:', error)
      return false
    }
  },

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    const prisma = await getPrismaClient()
    await prisma.$disconnect()
  },

  /**
   * Get database health status
   */
  async getHealth(): Promise<{ status: 'healthy' | 'unhealthy'; timestamp: Date }> {
    const isConnected = await this.testConnection()
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date()
    }
  },

  /**
   * Get Prisma client instance
   */
  async getClient() {
    return await getPrismaClient()
  }
}

// Export Prisma client instance for direct use
let prismaClientInstance: PrismaClient | null = null

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!prismaClientInstance) {
      // Use dynamic import instead of require for consistency
      throw new Error('Prisma client not initialized. Use getPrismaClient() instead.')
    }
    return prismaClientInstance[prop as keyof PrismaClient]
  }
})

// Export async function to get Prisma client
export default getPrismaClient