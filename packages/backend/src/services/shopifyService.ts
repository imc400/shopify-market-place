import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

const env = validateEnv();

const shopify = shopifyApi({
  apiKey: env.SHOPIFY_API_KEY,
  apiSecretKey: env.SHOPIFY_API_SECRET,
  scopes: env.SHOPIFY_SCOPES.split(','),
  hostName: 'localhost:3001',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
  logger: {
    log: (severity, message) => {
      logger.info(`Shopify ${severity}: ${message}`);
    },
  },
});

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  available: boolean;
  tags: string[];
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  available: boolean;
  selectedOptions: SelectedOption[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface LineItem {
  variantId: string;
  quantity: number;
}

export interface Checkout {
  id: string;
  webUrl: string;
  totalPrice: string;
  lineItems: LineItem[];
}

export class ShopifyService {
  private session: any;

  constructor(private shopDomain: string, private accessToken: string) {
    this.session = {
      shop: shopDomain,
      accessToken: accessToken,
    };
  }

  async getProducts(limit: number = 20): Promise<Product[]> {
    try {
      const client = new shopify.clients.Storefront({
        session: this.session,
      });

      const query = `
        query getProducts($first: Int!) {
          products(first: $first) {
            edges {
              node {
                id
                title
                description
                tags
                availableForSale
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                compareAtPriceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 5) {
                  edges {
                    node {
                      id
                      url
                      altText
                    }
                  }
                }
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      availableForSale
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await client.query({
        data: {
          query,
          variables: { first: limit },
        },
      });

      return response.body.data.products.edges.map((edge: any) => {
        const product = edge.node;
        return {
          id: product.id.split('/').pop(),
          title: product.title,
          description: product.description,
          price: product.priceRange.minVariantPrice.amount,
          compareAtPrice: product.compareAtPriceRange?.minVariantPrice?.amount,
          images: product.images.edges.map((imageEdge: any) => ({
            id: imageEdge.node.id.split('/').pop(),
            url: imageEdge.node.url,
            altText: imageEdge.node.altText,
          })),
          variants: product.variants.edges.map((variantEdge: any) => ({
            id: variantEdge.node.id,
            title: variantEdge.node.title,
            price: variantEdge.node.price.amount,
            available: variantEdge.node.availableForSale,
            selectedOptions: variantEdge.node.selectedOptions,
          })),
          available: product.availableForSale,
          tags: product.tags,
        };
      });
    } catch (error) {
      logger.error('Error fetching products from Shopify:', error);
      throw new Error('Failed to fetch products');
    }
  }

  async getProduct(productId: string): Promise<Product> {
    try {
      const client = new shopify.clients.Storefront({
        session: this.session,
      });

      const query = `
        query getProduct($id: ID!) {
          product(id: $id) {
            id
            title
            description
            tags
            availableForSale
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            compareAtPriceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 10) {
              edges {
                node {
                  id
                  url
                  altText
                }
              }
            }
            variants(first: 20) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      `;

      const response = await client.query({
        data: {
          query,
          variables: { id: `gid://shopify/Product/${productId}` },
        },
      });

      const product = response.body.data.product;

      if (!product) {
        throw new Error('Product not found');
      }

      return {
        id: product.id.split('/').pop(),
        title: product.title,
        description: product.description,
        price: product.priceRange.minVariantPrice.amount,
        compareAtPrice: product.compareAtPriceRange?.minVariantPrice?.amount,
        images: product.images.edges.map((edge: any) => ({
          id: edge.node.id.split('/').pop(),
          url: edge.node.url,
          altText: edge.node.altText,
        })),
        variants: product.variants.edges.map((edge: any) => ({
          id: edge.node.id,
          title: edge.node.title,
          price: edge.node.price.amount,
          available: edge.node.availableForSale,
          selectedOptions: edge.node.selectedOptions,
        })),
        available: product.availableForSale,
        tags: product.tags,
      };
    } catch (error) {
      logger.error('Error fetching product from Shopify:', error);
      throw new Error('Failed to fetch product');
    }
  }

  async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    try {
      const client = new shopify.clients.Storefront({
        session: this.session,
      });

      const searchQuery = `
        query searchProducts($query: String!, $first: Int!) {
          products(first: $first, query: $query) {
            edges {
              node {
                id
                title
                description
                tags
                availableForSale
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                compareAtPriceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 3) {
                  edges {
                    node {
                      id
                      url
                      altText
                    }
                  }
                }
                variants(first: 5) {
                  edges {
                    node {
                      id
                      title
                      availableForSale
                      price {
                        amount
                        currencyCode
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await client.query({
        data: {
          query: searchQuery,
          variables: { query, first: limit },
        },
      });

      return response.body.data.products.edges.map((edge: any) => {
        const product = edge.node;
        return {
          id: product.id.split('/').pop(),
          title: product.title,
          description: product.description,
          price: product.priceRange.minVariantPrice.amount,
          compareAtPrice: product.compareAtPriceRange?.minVariantPrice?.amount,
          images: product.images.edges.map((imageEdge: any) => ({
            id: imageEdge.node.id.split('/').pop(),
            url: imageEdge.node.url,
            altText: imageEdge.node.altText,
          })),
          variants: product.variants.edges.map((variantEdge: any) => ({
            id: variantEdge.node.id,
            title: variantEdge.node.title,
            price: variantEdge.node.price.amount,
            available: variantEdge.node.availableForSale,
            selectedOptions: variantEdge.node.selectedOptions,
          })),
          available: product.availableForSale,
          tags: product.tags,
        };
      });
    } catch (error) {
      logger.error('Error searching products in Shopify:', error);
      throw new Error('Failed to search products');
    }
  }

  async createCheckout(lineItems: LineItem[]): Promise<Checkout> {
    try {
      const client = new shopify.clients.Storefront({
        session: this.session,
      });

      const mutation = `
        mutation checkoutCreate($input: CheckoutCreateInput!) {
          checkoutCreate(input: $input) {
            checkout {
              id
              webUrl
              totalPrice {
                amount
                currencyCode
              }
              lineItems(first: 20) {
                edges {
                  node {
                    id
                    quantity
                    variant {
                      id
                    }
                  }
                }
              }
            }
            checkoutUserErrors {
              field
              message
            }
          }
        }
      `;

      const response = await client.query({
        data: {
          query: mutation,
          variables: {
            input: {
              lineItems: lineItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity,
              })),
            },
          },
        },
      });

      const { checkout, checkoutUserErrors } = response.body.data.checkoutCreate;

      if (checkoutUserErrors && checkoutUserErrors.length > 0) {
        throw new Error(`Checkout creation failed: ${checkoutUserErrors[0].message}`);
      }

      return {
        id: checkout.id,
        webUrl: checkout.webUrl,
        totalPrice: checkout.totalPrice.amount,
        lineItems: checkout.lineItems.edges.map((edge: any) => ({
          variantId: edge.node.variant.id,
          quantity: edge.node.quantity,
        })),
      };
    } catch (error) {
      logger.error('Error creating checkout in Shopify:', error);
      throw new Error('Failed to create checkout');
    }
  }
}