import React, { useState } from 'react';
import { CheckCircle2, Download, Home, Package, Eye, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/razorpay';
import { ReceiptGenerator } from '@/utils/receiptGenerator';
import { useToast } from '@/hooks/use-toast';

interface PaymentSuccessProps {
  paymentId: string;
  orderId: string;
  amount: number;
  orderType: 'individual' | 'group';
  productName: string;
  supplierName?: string;
  quantity: number;
  pricePerKg: number;
  subtotal: number;
  tax: number;
  deliveryCharge?: number;
  groupDiscount?: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  businessDetails?: {
    name: string;
    gstNumber?: string;
    address?: string;
    email?: string;
    phone?: string;
    businessType?: string;
  };
  onContinueShopping: () => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  paymentId,
  orderId,
  amount,
  orderType,
  productName,
  supplierName,
  quantity,
  pricePerKg,
  subtotal,
  tax,
  deliveryCharge = 0,
  groupDiscount = 0,
  customerDetails,
  businessDetails,
  onContinueShopping
}) => {
  const { toast } = useToast();
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);

  const receiptData = {
    paymentId,
    orderId,
    amount,
    orderType,
    productName,
    supplierName,
    quantity,
    pricePerKg,
    subtotal,
    tax,
    deliveryCharge,
    groupDiscount,
    customerDetails,
    businessDetails,
    timestamp: new Date(),
    transactionStatus: 'successful' as const
  };

  const handleDownloadReceipt = async () => {
    setIsGeneratingReceipt(true);
    try {
      await ReceiptGenerator.downloadReceipt(receiptData);
      toast({
        title: "Receipt Downloaded",
        description: "Your payment receipt has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Receipt generation error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handlePreviewReceipt = async () => {
    setIsGeneratingReceipt(true);
    try {
      const previewUrl = await ReceiptGenerator.previewReceipt(receiptData);
      setReceiptPreviewUrl(previewUrl);
      // Open in new tab
      window.open(previewUrl, '_blank');
      toast({
        title: "Receipt Preview",
        description: "Receipt opened in new tab.",
      });
    } catch (error) {
      console.error('Receipt preview error:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to generate receipt preview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  };
  // Check if this is a COD order
  const isCODOrder = paymentId.startsWith('COD_');

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center relative">
        {/* Close button */}
        <button
          onClick={onContinueShopping}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isCODOrder ? 'Order Confirmed!' : 'Payment Successful!'}
          </h2>
          <p className="text-gray-600">
            {isCODOrder 
              ? `Your ${orderType === 'individual' ? 'order' : 'group participation'} has been confirmed. Pay when delivered.`
              : `Your ${orderType === 'individual' ? 'order' : 'group participation'} has been confirmed`
            }
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-mono font-semibold">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID:</span>
              <span className="font-mono text-xs">{paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Product:</span>
              <span className="font-semibold">{productName}</span>
            </div>
            {supplierName && (
              <div className="flex justify-between">
                <span className="text-gray-600">Supplier:</span>
                <span>{supplierName}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {isCODOrder ? 'Amount to Pay on Delivery:' : 'Amount Paid:'}
                </span>
                <span className={`font-bold ${isCODOrder ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatAmount(amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onContinueShopping}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreviewReceipt}
              disabled={isGeneratingReceipt}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              {isGeneratingReceipt ? 'Generating...' : 'Preview'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadReceipt}
              disabled={isGeneratingReceipt}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingReceipt ? 'Generating...' : 'Download'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={() => {/* Navigate to orders */}}
            className="w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            View My Orders
          </Button>
        </div>

        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>✅ A confirmation email has been sent to your registered email address.</p>
          <p>📞 For support, contact us at support@marketconnect.com</p>
          {isCODOrder ? (
            <p>💵 Please keep the exact amount ready for cash payment upon delivery.</p>
          ) : (
            <p>🔒 Your payment is secured by Razorpay with 256-bit SSL encryption.</p>
          )}
        </div>
      </div>
    </div>
  );
};
