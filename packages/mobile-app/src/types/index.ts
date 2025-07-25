export interface User {
  id: string;
  email: string;
  name: string;
  subscriptions: string[];
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  domain: string;
  description?: string;
  logo?: string;
  isSubscribed: boolean;
  categories: string[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  storeId: string;
  storeName: string;
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

export interface CartItem {
  variantId: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image?: string;
  storeId: string;
  storeName: string;
  discountCode?: string;
  validUntil?: string;
  products?: Product[];
}

export interface Checkout {
  id: string;
  webUrl: string;
  totalPrice: string;
  lineItems: CartItem[];
}