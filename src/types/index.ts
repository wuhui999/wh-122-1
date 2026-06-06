export interface PaperSize {
  id: string;
  name: string;
  paperType: string;
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
  isFromRemnant: boolean;
  remnantId?: string;
}

export interface RemnantPiece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export interface RemnantUsage {
  remnantId: string;
  remnantName: string;
  width: number;
  height: number;
  products: PositionedProduct[];
  productsCount: number;
  utilizedArea: number;
  totalArea: number;
  utilizationRate: number;
  usedQuantity: number;
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
  isFromRemnant: boolean;
  remnantId?: string;
  sourceRemnant?: {
    id: string;
    width: number;
    height: number;
  };
}

export interface RemnantOptimizedLayout {
  remnantUsage: RemnantUsage[];
  remnantProductsTotal: number;
  newPaperLayout: CuttingLayout;
  totalProducts: number;
  totalUtilizationRate: number;
}

export interface RemnantUsageInfo {
  usedRemnants: {
    remnantId: string;
    remnantName: string;
    width: number;
    height: number;
    quantity: number;
    productsCount: number;
    utilizedArea: number;
    costSaved: number;
  }[];
  totalRemnantSheets: number;
  totalRemnantProducts: number;
  totalNewPaperSheets: number;
  totalNewPaperProducts: number;
  costSavings: number;
  pureNewPaperCost: number;
  optimizedCost: number;
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
  isRemnantOptimized: boolean;
  remnantUsageInfo?: RemnantUsageInfo;
  remnantLayouts?: CuttingLayout[];
  confirmed?: boolean;
  confirmedAt?: string;
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
