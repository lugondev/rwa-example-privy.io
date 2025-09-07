import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample users with different KYC statuses
  const user1 = await prisma.user.create({
    data: {
      walletAddress: '0x1234567890123456789012345678901234567890',
      email: 'john.doe@example.com',
      kycStatus: 'approved',
      complianceStatus: 'compliant',
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-01-15'),
          phoneNumber: '+1-555-0123',
          address: '123 Main St',
          city: 'New York',
          country: 'United States',
          postalCode: '10001',
          investorType: 'accredited',
          riskTolerance: 'medium',
          investmentGoals: 'Long-term wealth building through real estate and alternative assets'
        }
      }
    }
  })

  const user2 = await prisma.user.create({
    data: {
      walletAddress: '0x2345678901234567890123456789012345678901',
      email: 'jane.smith@example.com',
      kycStatus: 'pending',
      complianceStatus: 'pending',
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date('1985-06-20'),
          phoneNumber: '+1-555-0456',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          country: 'United States',
          postalCode: '90210',
          investorType: 'retail',
          riskTolerance: 'low',
          investmentGoals: 'Conservative growth with focus on stable returns'
        }
      }
    }
  })

  const user3 = await prisma.user.create({
    data: {
      walletAddress: '0x3456789012345678901234567890123456789012',
      email: 'mike.wilson@example.com',
      kycStatus: 'rejected',
      complianceStatus: 'non_compliant',
      profile: {
        create: {
          firstName: 'Mike',
          lastName: 'Wilson',
          dateOfBirth: new Date('1992-03-10'),
          phoneNumber: '+1-555-0789',
          address: '789 Pine St',
          city: 'Chicago',
          country: 'United States',
          postalCode: '60601',
          investorType: 'institutional',
          riskTolerance: 'high',
          investmentGoals: 'Aggressive growth through diversified alternative investments'
        }
      }
    }
  })

  // Create sample KYC submissions
  await prisma.kycSubmission.create({
    data: {
      userId: user1.id,
      submissionType: 'identity',
      status: 'approved',
      documentType: 'passport',
      documentUrl: 'https://example.com/docs/passport_john_doe.pdf',
      documentHash: 'abc123hash456',
      reviewedAt: new Date(),
      reviewedBy: 'admin@rwa-platform.com'
    }
  })

  await prisma.kycSubmission.create({
    data: {
      userId: user1.id,
      submissionType: 'address',
      status: 'approved',
      documentType: 'utility_bill',
      documentUrl: 'https://example.com/docs/utility_john_doe.pdf',
      documentHash: 'def789hash012',
      reviewedAt: new Date(),
      reviewedBy: 'admin@rwa-platform.com'
    }
  })

  await prisma.kycSubmission.create({
    data: {
      userId: user2.id,
      submissionType: 'identity',
      status: 'pending',
      documentType: 'drivers_license',
      documentUrl: 'https://example.com/docs/license_jane_smith.pdf',
      documentHash: 'ghi345hash678'
    }
  })

  await prisma.kycSubmission.create({
    data: {
      userId: user3.id,
      submissionType: 'identity',
      status: 'rejected',
      documentType: 'passport',
      documentUrl: 'https://example.com/docs/passport_mike_wilson.pdf',
      documentHash: 'jkl901hash234',
      reviewedAt: new Date(),
      reviewedBy: 'admin@rwa-platform.com',
      rejectionReason: 'Document quality insufficient - please resubmit with clearer image'
    }
  })

  // Create sample vaults
  const vault1 = await prisma.vault.create({
    data: {
      name: 'Premium Real Estate Vault',
      description: 'High-security vault for premium real estate assets',
      location: 'New York Financial District',
      securityLevel: 'premium',
      capacity: 100,
      currentAssets: 0,
      managerId: user1.id
    }
  })

  const vault2 = await prisma.vault.create({
    data: {
      name: 'Art & Collectibles Vault',
      description: 'Specialized storage for art and collectible assets',
      location: 'Los Angeles Art District',
      securityLevel: 'enhanced',
      capacity: 50,
      currentAssets: 0,
      managerId: user1.id
    }
  })

  // Create sample assets
  const asset1 = await prisma.asset.create({
    data: {
      name: 'Manhattan Luxury Apartment',
      description: 'Premium 3-bedroom apartment in Manhattan with city views',
      assetType: 'real_estate',
      totalValue: 2500000.00,
      currentPrice: 2500000.00,
      fractionalEnabled: true,
      vaultId: vault1.id,
      ownerId: user1.id,
      metadata: {
        address: '123 Park Avenue, New York, NY 10016',
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1800,
        yearBuilt: 2015,
        amenities: ['doorman', 'gym', 'rooftop_terrace']
      }
    }
  })

  const asset2 = await prisma.asset.create({
    data: {
      name: 'Vintage Rolex Collection',
      description: 'Rare vintage Rolex watches from the 1960s-1980s',
      assetType: 'collectibles',
      totalValue: 150000.00,
      currentPrice: 150000.00,
      fractionalEnabled: true,
      vaultId: vault2.id,
      ownerId: user1.id,
      metadata: {
        pieces: 5,
        models: ['Submariner', 'GMT-Master', 'Daytona'],
        condition: 'excellent',
        authentication: 'certified'
      }
    }
  })

  // Create sample notifications
  await prisma.notification.create({
    data: {
      userId: user1.id,
      type: 'kyc_update',
      title: 'KYC Verification Complete',
      message: 'Your identity verification has been approved. You can now access all platform features.',
      priority: 'high',
      metadata: {
        kycStatus: 'approved',
        completedAt: new Date().toISOString()
      }
    }
  })

  await prisma.notification.create({
    data: {
      userId: user2.id,
      type: 'kyc_update',
      title: 'KYC Documents Under Review',
      message: 'Your submitted documents are currently being reviewed. We will notify you once the process is complete.',
      priority: 'normal',
      metadata: {
        kycStatus: 'pending',
        submittedAt: new Date().toISOString()
      }
    }
  })

  await prisma.notification.create({
    data: {
      userId: user3.id,
      type: 'kyc_update',
      title: 'KYC Verification Required',
      message: 'Your document submission was rejected. Please review the feedback and resubmit with corrected documents.',
      priority: 'urgent',
      metadata: {
        kycStatus: 'rejected',
        rejectionReason: 'Document quality insufficient'
      }
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${await prisma.user.count()} users`)
  console.log(`Created ${await prisma.userProfile.count()} user profiles`)
  console.log(`Created ${await prisma.kycSubmission.count()} KYC submissions`)
  console.log(`Created ${await prisma.vault.count()} vaults`)
  console.log(`Created ${await prisma.asset.count()} assets`)
  console.log(`Created ${await prisma.notification.count()} notifications`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })