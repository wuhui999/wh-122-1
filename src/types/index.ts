export interface PaperSize {
  id: string;
  name: string;
  width: number;
  height: number;
  grammage: number;
  stock: number;
  unitPrice: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  productName: string;
  finishedWidth: number;
  finishedHeight: number;
  quantity: number;
  paperType: string;
  deliveryDate: string;
  bleed: number;
  createdAt: string;
  status: 'pending' | 'scheduled' | 'completed';
}

export interface PositionedProduct {
  x: number;
  y: number;
  width: number;
  height: number;
  orderId: string;
  orderNo: string;
  productName: string;
}

export interface RemnantPiece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export interface CuttingLayout {
  sheetId: string;
  sheetName: string;
  sheetWidth: number;
  sheetHeight: number;
  products: PositionedProduct[];
  remnants: RemnantPiece[];
  productsPerSheet: number;
  utilizedArea: number;
  totalArea: number;
  utilizationRate: number;
}

export interface CuttingScheme {
  id: string;
  name: string;
  paperSize: PaperSize;
  layout: CuttingLayout;
  totalSheets: number;
  totalCost: number;
  totalUtilizationRate: number;
  wasteRate: number;
  totalRemnantArea: number;
  recyclableRemnants: RemnantPiece[];
  orderAllocations: {
    orderId: string;
    orderNo: string;
    quantity: number;
    sheets: number;
  }[];
  createdAt: string;
}

export interface RemnantStock {
  id: string;
  width: number;
  height: number;
  area: number;
  grammage: number;
  paperType: string;
  sourceOrderId: string;
  sourceOrderNo: string;
  sourceSchemeId: string;
  quantity: number;
  status: 'available' | 'reserved' | 'used';
  createdAt: string;
  usedAt?: string;
}

export interface ExportData {
  scheme: CuttingScheme;
  orders: Order[];
  exportDate: string;
}
