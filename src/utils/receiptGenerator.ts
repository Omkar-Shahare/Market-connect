import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptData {
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
  timestamp: Date;
  transactionStatus: 'successful' | 'pending' | 'failed';
}

export class ReceiptGenerator {
  private static addWatermark(pdf: jsPDF, text: string = 'PAID') {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set watermark properties
    pdf.setTextColor(200, 200, 200); // Light gray
    pdf.setFontSize(50);
    pdf.setFont('helvetica', 'bold');
    
    // Calculate position for diagonal watermark
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // Rotate and add watermark
    pdf.text(text, centerX, centerY, {
      angle: 45,
      align: 'center',
      baseline: 'middle'
    });
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  private static addHeader(pdf: jsPDF, receiptData: ReceiptData) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const businessName = receiptData.businessDetails?.name || 'MarketConnect';
    const businessType = receiptData.businessDetails?.businessType || 'Agricultural Marketplace';
    
    // Company Header
    pdf.setFillColor(59, 130, 246); // Blue background
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(businessName, 20, 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(businessType, 20, 26);
    
    // Add GST number if available
    if (receiptData.businessDetails?.gstNumber) {
      pdf.text(`GST: ${receiptData.businessDetails.gstNumber}`, 20, 31);
    }
    
    // Receipt Title
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT RECEIPT', pageWidth - 20, 20, { align: 'right' });
    
    // Status badge
    const statusColor = receiptData.transactionStatus === 'successful' ? [34, 197, 94] : [239, 68, 68];
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.roundedRect(pageWidth - 80, 25, 60, 8, 2, 2, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text(receiptData.transactionStatus.toUpperCase(), pageWidth - 50, 30, { align: 'center' });
  }

  private static addOrderDetails(pdf: jsPDF, receiptData: ReceiptData, startY: number): number {
    let currentY = startY;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Order Details', 20, currentY);
    currentY += 10;
    
    // Order information
    const orderInfo = [
      ['Order ID:', receiptData.orderId],
      ['Payment ID:', receiptData.paymentId],
      ['Date & Time:', receiptData.timestamp.toLocaleString()],
      ['Order Type:', receiptData.orderType === 'individual' ? 'Individual Order' : 'Group Order'],
      ['Product:', receiptData.productName],
      ['Supplier:', receiptData.supplierName || 'N/A'],
      ['Quantity:', `${receiptData.quantity} kg`]
    ];
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    orderInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 80, currentY);
      currentY += 6;
    });
    
    return currentY + 10;
  }

  private static addCustomerDetails(pdf: jsPDF, receiptData: ReceiptData, startY: number): number {
    let currentY = startY;
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Customer Details', 20, currentY);
    currentY += 10;
    
    const customerInfo = [
      ['Name:', receiptData.customerDetails.name],
      ['Email:', receiptData.customerDetails.email],
      ['Phone:', receiptData.customerDetails.phone],
      ['Address:', receiptData.customerDetails.address || 'Not provided']
    ];
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    customerInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 80, currentY);
      currentY += 6;
    });
    
    return currentY + 10;
  }

  private static addBusinessDetails(pdf: jsPDF, receiptData: ReceiptData, startY: number): number {
    if (!receiptData.businessDetails) return startY;
    
    let currentY = startY;
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Business Details', 20, currentY);
    currentY += 10;
    
    const businessInfo: [string, string][] = [];
    
    if (receiptData.businessDetails.name) {
      businessInfo.push(['Business Name:', receiptData.businessDetails.name]);
    }
    if (receiptData.businessDetails.businessType) {
      businessInfo.push(['Business Type:', receiptData.businessDetails.businessType]);
    }
    if (receiptData.businessDetails.gstNumber) {
      businessInfo.push(['GST Number:', receiptData.businessDetails.gstNumber]);
    }
    if (receiptData.businessDetails.email) {
      businessInfo.push(['Email:', receiptData.businessDetails.email]);
    }
    if (receiptData.businessDetails.phone) {
      businessInfo.push(['Phone:', receiptData.businessDetails.phone]);
    }
    if (receiptData.businessDetails.address) {
      businessInfo.push(['Address:', receiptData.businessDetails.address]);
    }
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    businessInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, currentY);
      pdf.setFont('helvetica', 'normal');
      // Handle long text by wrapping
      const maxWidth = 120;
      const lines = pdf.splitTextToSize(value, maxWidth);
      pdf.text(lines, 80, currentY);
      currentY += lines.length * 6;
    });
    
    return currentY + 10;
  }

  private static addPriceBreakdown(pdf: jsPDF, receiptData: ReceiptData, startY: number): number {
    let currentY = startY;
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Price Breakdown', 20, currentY);
    currentY += 10;
    
    // Table header
    pdf.setFillColor(248, 250, 252);
    pdf.rect(20, currentY - 2, pageWidth - 40, 8, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', 25, currentY + 3);
    pdf.text('Amount', pageWidth - 25, currentY + 3, { align: 'right' });
    currentY += 10;
    
    // Price items
    const priceItems = [
      ['Subtotal:', `₹${receiptData.subtotal.toFixed(2)}`],
      ...(receiptData.groupDiscount ? [['Group Discount:', `-₹${receiptData.groupDiscount.toFixed(2)}`]] : []),
      ...(receiptData.deliveryCharge ? [['Delivery Charges:', `₹${receiptData.deliveryCharge.toFixed(2)}`]] : []),
      ['GST (5%):', `₹${receiptData.tax.toFixed(2)}`]
    ];
    
    pdf.setFont('helvetica', 'normal');
    priceItems.forEach(([label, value]) => {
      pdf.text(label, 25, currentY);
      pdf.text(value, pageWidth - 25, currentY, { align: 'right' });
      currentY += 6;
    });
    
    // Total
    pdf.setDrawColor(0, 0, 0);
    pdf.line(20, currentY, pageWidth - 20, currentY);
    currentY += 5;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Amount:', 25, currentY);
    pdf.text(`₹${receiptData.amount.toFixed(2)}`, pageWidth - 25, currentY, { align: 'right' });
    currentY += 10;
    
    return currentY;
  }

  private static addFooter(pdf: jsPDF, startY: number) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = Math.max(startY, pageHeight - 50);
    
    // Terms and conditions
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    const terms = [
      'Terms & Conditions:',
      '• This is a computer-generated receipt and does not require a signature.',
      '• For support, contact us at support@marketconnect.com or +91-XXXX-XXXXXX',
      '• Refunds are subject to our return policy. Please check our website for details.',
      '• Keep this receipt for your records and any future reference.'
    ];
    
    terms.forEach((term, index) => {
      if (index === 0) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      pdf.text(term, 20, currentY);
      currentY += 4;
    });
    
    // QR Code placeholder (you can integrate a QR code library here)
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(pageWidth - 50, pageHeight - 45, 30, 30);
    pdf.setFontSize(6);
    pdf.text('QR Code', pageWidth - 35, pageHeight - 28, { align: 'center' });
    pdf.text('(Verification)', pageWidth - 35, pageHeight - 25, { align: 'center' });
  }

  static async generateReceipt(receiptData: ReceiptData): Promise<Blob> {
    const pdf = new jsPDF();
    
    // Add watermark first (so it's in the background)
    this.addWatermark(pdf);
    
    // Add content
    this.addHeader(pdf, receiptData);
    
    let currentY = 50;
    currentY = this.addOrderDetails(pdf, receiptData, currentY);
    currentY = this.addCustomerDetails(pdf, receiptData, currentY);
    currentY = this.addBusinessDetails(pdf, receiptData, currentY);
    currentY = this.addPriceBreakdown(pdf, receiptData, currentY);
    
    this.addFooter(pdf, currentY);
    
    // Return as blob for download
    return pdf.output('blob');
  }

  static async downloadReceipt(receiptData: ReceiptData, filename?: string) {
    try {
      const pdfBlob = await this.generateReceipt(receiptData);
      const url = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `receipt_${receiptData.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw new Error('Failed to generate receipt');
    }
  }

  static async previewReceipt(receiptData: ReceiptData): Promise<string> {
    try {
      const pdfBlob = await this.generateReceipt(receiptData);
      return URL.createObjectURL(pdfBlob);
    } catch (error) {
      console.error('Error generating receipt preview:', error);
      throw new Error('Failed to generate receipt preview');
    }
  }
}
