export interface TradingPurchaseOrderItem {
  id: string;
  poNumber: string;
  vendorName: string;
  commodityType: 'Industrial Fasteners & Cables' | 'Electrical Switchgear' | 'Pumps & Motors' | 'Safety Workwear';
  quantity: number;
  totalCost: number;
  paymentTerms: string;
  status: 'PO Issued' | 'In Transit' | 'Received at Warehouse';
}

export interface TradingSalesOrderItem {
  id: string;
  orderNumber: string;
  clientName: string;
  phone: string;
  itemsDescription: string;
  subtotal: number;
  gstAmount: number;
  totalPayable: number;
  status: 'Invoiced' | 'Dispatched' | 'Payment Settled';
  orderDate: string;
}

export interface DvrEnterpriseData {
  purchaseOrders: TradingPurchaseOrderItem[];
  salesOrders: TradingSalesOrderItem[];
}
