// Razorpay configuration and utility functions
import { useRazorpay } from "react-razorpay";

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_1234567890", // Test key for demo
  theme: {
    color: "#3B82F6", // Blue theme to match your app
  },
  currency: "INR" as const,
  company: "MarketConnect",
};

// Validate Razorpay key format
export const validateRazorpayKey = (key: string): boolean => {
  if (!key) return false;
  
  console.log('🔑 Validating Razorpay key:', key);
  console.log('🔑 Key length:', key.length);
  
  // Test keys should start with rzp_test_ and be at least 28 characters total
  // Live keys should start with rzp_live_ and be at least 28 characters total
  const testKeyRegex = /^rzp_test_[A-Za-z0-9]{14,}$/;
  const liveKeyRegex = /^rzp_live_[A-Za-z0-9]{14,}$/;
  
  const isValid = testKeyRegex.test(key) || liveKeyRegex.test(key);
  console.log('🔑 Key validation result:', isValid);
  
  return isValid;
};

// Create Razorpay order options
export const createRazorpayOptions = (
  amount: number,
  orderId: string,
  description: string,
  userDetails?: {
    name?: string;
    email?: string;
    phone?: string;
  },
  onSuccess?: (response: RazorpayResponse) => void,
  onDismiss?: () => void
): RazorpayOptions => {
  console.log('🔧 Creating Razorpay Options Debug:');
  console.log('💰 Amount (INR):', amount);
  console.log('💰 Amount (Paise):', amount * 100);
  console.log('🆔 Order ID:', orderId);
  console.log('📝 Description:', description);
  console.log('🔑 Razorpay Key:', RAZORPAY_CONFIG.key);
  console.log('� Key Valid:', validateRazorpayKey(RAZORPAY_CONFIG.key));
  console.log('�👤 User Details:', userDetails);

  // Validate the Razorpay key
  if (!validateRazorpayKey(RAZORPAY_CONFIG.key)) {
    console.error('❌ Invalid Razorpay key format:', RAZORPAY_CONFIG.key);
    throw new Error(`Invalid Razorpay key format: ${RAZORPAY_CONFIG.key}`);
  }

  const options = {
    key: RAZORPAY_CONFIG.key,
    amount: amount * 100, // Convert to paise
    currency: RAZORPAY_CONFIG.currency,
    name: RAZORPAY_CONFIG.company,
    description: description,
    // order_id: orderId, // Temporarily removed - this might be causing 400 errors
    prefill: {
      name: userDetails?.name || "",
      email: userDetails?.email || "",
      contact: userDetails?.phone || "",
    },
    theme: RAZORPAY_CONFIG.theme,
    handler: (response: RazorpayResponse) => {
      console.log('✅ Razorpay Handler Called:', response);
      if (onSuccess) {
        onSuccess(response);
      }
    },
    modal: {
      ondismiss: () => {
        console.log('🚫 Razorpay Modal Dismissed');
        if (onDismiss) {
          onDismiss();
        }
      },
      // Add error handling for modal
      escape: true,
      backdrop_close: true,
      // Handle Razorpay errors
      onhidden: () => {
        console.log('🔒 Razorpay Modal Hidden');
      }
    },
    // Add additional options for better error handling
    retry: {
      enabled: false
    },
    timeout: 300, // 5 minutes timeout
    remember_customer: false,
  };

  console.log('⚙️ Final Razorpay Options:', options);
  return options;
};

// Payment method configurations
export const PAYMENT_METHODS = {
  upi: {
    name: "UPI Payment",
    description: "Pay using UPI apps like GPay, PhonePe, Paytm",
    icon: "smartphone",
    available: true,
  },
  card: {
    name: "Credit/Debit Card", 
    description: "Visa, Mastercard, RuPay accepted",
    icon: "credit-card",
    available: true,
  },
  netbanking: {
    name: "Net Banking",
    description: "All major banks supported",
    icon: "building",
    available: true,
  },
  wallet: {
    name: "Digital Wallets",
    description: "Paytm, Mobikwik, Amazon Pay",
    icon: "wallet",
    available: true,
  },
  cod: {
    name: "Cash on Delivery",
    description: "Pay when you receive the order",
    icon: "truck",
    available: true, // Only for individual orders
  },
};

// Generate order ID
export const generateOrderId = (type: 'individual' | 'group'): string => {
  const prefix = type === 'individual' ? 'ORD' : 'GRP';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
};

// Validate payment response
export const validatePaymentResponse = (response: RazorpayResponse): boolean => {
  // For demo/test mode, just check if we have a payment ID
  const hasPaymentId = !!response.razorpay_payment_id;
  
  console.log('🔍 Payment Response Validation:');
  console.log('💳 Payment ID:', response.razorpay_payment_id);
  console.log('📝 Order ID:', response.razorpay_order_id);
  console.log('🔐 Signature:', response.razorpay_signature);
  console.log('✅ Valid:', hasPaymentId);
  
  // In demo mode or when no backend integration, payment ID is sufficient
  return hasPaymentId;
};

// Format amount for display
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate delivery charges based on distance
export const calculateDeliveryCharge = (
  distance: number,
  baseCharge: number = 50,
  perKmCharge: number = 5
): number => {
  if (distance <= 5) return baseCharge;
  return baseCharge + Math.ceil(distance - 5) * perKmCharge;
};

// Calculate tax (GST)
export const calculateTax = (amount: number, taxRate: number = 0.05): number => {
  return Math.round(amount * taxRate);
};

// Calculate group discount
export const calculateGroupDiscount = (
  amount: number,
  discountPercentage: string
): number => {
  const discount = parseInt(discountPercentage.replace('%', ''));
  return Math.round(amount * (discount / 100));
};
