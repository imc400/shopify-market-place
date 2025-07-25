import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ShopifyService } from '../services/shopifyService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface StoreData {
  shopifyDomain: string;
  name: string;
  description?: string;
  accessToken: string;
  categories?: string[];
  logo?: string;
}

async function addStore(storeData: StoreData) {
  try {
    logger.info(`🔍 Testing connection to ${storeData.shopifyDomain}...`);
    
    // Test Shopify connection
    const shopifyService = new ShopifyService(storeData.shopifyDomain, storeData.accessToken);
    const products = await shopifyService.getProducts(1);
    
    logger.info(`✅ Connection successful! Found ${products.length > 0 ? 'products' : 'no products'} in store`);

    // Check if store already exists
    const existingStore = await prisma.store.findUnique({
      where: { shopifyDomain: storeData.shopifyDomain },
    });

    if (existingStore) {
      logger.warn(`⚠️  Store ${storeData.shopifyDomain} already exists`);
      return existingStore;
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        id: uuidv4(),
        shopifyDomain: storeData.shopifyDomain,
        name: storeData.name,
        description: storeData.description,
        accessToken: storeData.accessToken,
        categories: storeData.categories || [],
        logo: storeData.logo,
        isActive: true,
      },
    });

    logger.info(`🎉 Store "${store.name}" added successfully!`);
    logger.info(`   ID: ${store.id}`);
    logger.info(`   Domain: ${store.shopifyDomain}`);
    logger.info(`   Categories: ${store.categories.join(', ')}`);

    return store;
  } catch (error) {
    logger.error('❌ Failed to add store:', error);
    throw error;
  }
}

// Script para uso desde línea de comandos
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log(`
🚀 Add Store Script

Usage: npm run add-store <domain> <name> <access_token> [description] [categories]

Examples:
  npm run add-store mi-tienda.myshopify.com "Mi Tienda" shpat_xxx123 "Descripción de mi tienda" "clothing,accessories"
  npm run add-store demo-store.myshopify.com "Demo Store" shpat_abc456
    `);
    process.exit(1);
  }

  const [domain, name, accessToken, description, categoriesStr] = args;
  const categories = categoriesStr ? categoriesStr.split(',').map(c => c.trim()) : [];

  const storeData: StoreData = {
    shopifyDomain: domain,
    name,
    accessToken,
    description,
    categories,
  };

  try {
    await addStore(storeData);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run script if called directly
if (require.main === module) {
  main();
}

export { addStore };