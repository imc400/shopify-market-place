import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
    },
  });

  console.log('✅ Created test users');

  // Create test stores
  const stores = [
    {
      id: uuidv4(),
      shopifyDomain: 'demo-store-1.myshopify.com',
      name: 'Fashion Hub',
      description: 'Trendy clothing and accessories for modern lifestyle',
      categories: ['clothing', 'accessories', 'fashion'],
      accessToken: 'demo-access-token-1',
    },
    {
      id: uuidv4(),
      shopifyDomain: 'demo-store-2.myshopify.com', 
      name: 'Tech World',
      description: 'Latest gadgets and electronics for tech enthusiasts',
      categories: ['electronics', 'gadgets', 'technology'],
      accessToken: 'demo-access-token-2',
    },
    {
      id: uuidv4(),
      shopifyDomain: 'demo-store-3.myshopify.com',
      name: 'Home & Garden',
      description: 'Beautiful home decor and gardening supplies',
      categories: ['home', 'garden', 'decor'],
      accessToken: 'demo-access-token-3',
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { shopifyDomain: store.shopifyDomain },
      update: {},
      create: store,
    });
  }

  console.log('✅ Created test stores');

  // Create subscriptions
  for (const store of stores) {
    await prisma.subscription.upsert({
      where: {
        userId_storeId: {
          userId: testUser.id,
          storeId: store.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        storeId: store.id,
      },
    });
  }

  console.log('✅ Created test subscriptions');

  // Create test promotions
  const promotions = [
    {
      storeId: stores[0].id,
      title: '50% Off Summer Collection',
      description: 'Get amazing discounts on all summer clothing and accessories. Limited time offer!',
      discountCode: 'SUMMER50',
      validUntil: new Date('2024-08-31'),
    },
    {
      storeId: stores[1].id,
      title: 'New iPhone Launch',
      description: 'Be the first to get the latest iPhone with exclusive pre-order benefits.',
      validUntil: new Date('2024-12-31'),
    },
    {
      storeId: stores[2].id,
      title: 'Spring Garden Sale',
      description: 'Transform your garden this spring with 30% off all plants and tools.',
      discountCode: 'SPRING30',
      validUntil: new Date('2024-06-30'),
    },
  ];

  for (const promotion of promotions) {
    await prisma.promotion.create({
      data: {
        id: uuidv4(),
        ...promotion,
      },
    });
  }

  console.log('✅ Created test promotions');

  // Create sample webhook logs
  const webhookLogs = [
    {
      storeId: stores[0].id,
      topic: 'products/update',
      payload: {
        id: 123456789,
        title: 'Summer Dress',
        status: 'active',
        updated_at: '2024-01-15T10:30:00Z',
      },
      processed: true,
    },
    {
      storeId: stores[1].id,
      topic: 'inventory_levels/update',
      payload: {
        inventory_item_id: 987654321,
        location_id: 123,
        available: 5,
        updated_at: '2024-01-15T11:00:00Z',
      },
      processed: true,
    },
  ];

  for (const log of webhookLogs) {
    await prisma.webhookLog.create({
      data: {
        id: uuidv4(),
        ...log,
      },
    });
  }

  console.log('✅ Created sample webhook logs');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('Email: test@example.com');
  console.log('Password: password123');
  console.log('\nEmail: admin@example.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });