// ─── Product & Catalog ───────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrl: string | null;
  images: string[];
  category: string | null;
  brand: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Geography / Locations ────────────────────────────────────────────────────
export interface Country {
  code: string;
  name: string;
  phonePrefix: string;
}

export interface Department {
  code: string;
  name: string;
  countryCode: string;
}

export interface City {
  code: string;
  name: string;
  departmentCode: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

// ─── Preview / Summary ────────────────────────────────────────────────────────
export interface PreviewItem {
  productId: string;
  productName: string;
  unitPrice: number;
  unitBasePrice?: number;
  taxRate?: number;
  taxAmount?: number;
  subtotal?: number;
  quantity: number;
  totalAmount: number;
  imageUrl: string | null;
  taxCategoryName?: string;
  taxCategoryCode?: string;
}

export interface CheckoutPreview {
  subtotalAmount: number;
  productsTotalAmount?: number;
  feeAmount: number;
  deliveryFeeAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  deliveryEstimate: {
    distanceKm: number;
    distanceCostInCents: number;
    valueCostInCents: number;
    discountInCents: number;
    appliedRules: string[];
  };
  items: PreviewItem[];
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'DELIVERED'
  | 'PAYMENT_FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  imageUrl?: string | null;
  unitPrice: number;
  unitBasePrice?: number;
  taxRate?: number;
  taxAmount?: number;
  subtotal?: number;
  quantity: number;
  totalAmount: number;
}

export interface OrderDelivery {
  status: string;
  address: string;
  city: string;
  feeAmount: number;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
}

export interface Order {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPhoneExtension?: string | null;
  deliveryAddress: string;
  deliveryNeighborhood?: string | null;
  deliveryCity: string;
  deliveryDepartment: string;
  deliveryCountry: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  checkoutSessionId?: string | null;
  subtotalAmount: number;
  productsTotalAmount?: number;
  feeAmount: number;
  deliveryFeeAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  expiresAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  accessToken: string;
  items: OrderItem[];
  delivery: OrderDelivery | null;
  termsAccepted?: boolean;
  termsAcceptedAt?: string | null;
  termsPermalink?: string | null;
  transactions?: OrderTransaction[];
  transaction?: OrderTransaction | null;
}

export interface OrderTransaction {
  reference: string;
  status: string;
  totalAmountInCents?: number;
  amountInCents?: number;
  paymentMethod?: string;
  installments?: number;
  createdAt?: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export interface PaymentResult {
  success: boolean;
  status?: string;
  message: string;
  order: Order;
  canRetry?: boolean;
  transaction?: OrderTransaction;
}

export interface PaymentStatusResponse {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus | 'PAYMENT_PENDING' | 'CREATED';
  isPaymentPending: boolean;
  canRetry: boolean;
  attemptsCount: number;
  maxAttempts: number;
  expiresAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  activeTransaction: {
    id: string;
    reference: string;
    gatewayTransactionId: string | null;
    status: string;
    statusMessage: string | null;
    amountInCents: number;
    paymentMethod: string;
    installments: number;
    createdAt: string;
    updatedAt?: string;
  } | null;
  invoice: {
    invoiceNumber: string;
    totalAmount: number;
    issuedAt: string;
  } | null;
  updatedAt?: string;
}

// ─── Merchant / Gateway ───────────────────────────────────────────────────────
export interface MerchantData {
  acceptanceToken: string;
  permalink: string;
  publicKey: string;
  gatewayApiUrl?: string;
}

// ─── Checkout Form ────────────────────────────────────────────────────────────
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  phoneExtension?: string;
  address: string;
  complement?: string;
  neighborhood: string;
  city: string;
  department: string;
  country: string;
  notes?: string;
}

export interface CardInfo {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
  installments: number;
}

// ─── App Checkout State ──────────────────────────────────────────────────────
export type CheckoutStep = 1 | 2 | 3 | 4 | 5;

export interface PersistedSession {
  orderNumber: string;
  accessToken: string;
  step: CheckoutStep;
}
