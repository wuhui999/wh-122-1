import { Order, PaperSize, CuttingLayout, PositionedProduct, RemnantPiece, CuttingScheme } from '../types';

const BLEED_DEFAULT = 3;
const MIN_REMNANT_WIDTH = 100;
const MIN_REMNANT_HEIGHT = 100;
const MIN_RECYCLABLE_AREA_RATIO = 0.1;

interface PackingSpace {
  x: number;
  y: number;
  width: number;
  height: number;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function sortOrdersByArea(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const areaA = (a.finishedWidth + a.bleed * 2) * (a.finishedHeight + a.bleed * 2);
    const areaB = (b.finishedWidth + b.bleed * 2) * (b.finishedHeight + b.bleed * 2);
    return areaB - areaA;
  });
}

function tryRotate(width: number, height: number, spaceWidth: number, spaceHeight: number): { rotated: boolean; fit: boolean } {
  if (width <= spaceWidth && height <= spaceHeight) {
    return { rotated: false, fit: true };
  }
  if (height <= spaceWidth && width <= spaceHeight) {
    return { rotated: true, fit: true };
  }
  return { rotated: false, fit: false };
}

function findBestFit(
  spaces: PackingSpace[],
  itemWidth: number,
  itemHeight: number
): { index: number; rotated: boolean } | null {
  let bestFit: { index: number; rotated: boolean; wasteArea: number } | null = null;

  for (let i = 0; i < spaces.length; i++) {
    const space = spaces[i];
    const { rotated, fit } = tryRotate(itemWidth, itemHeight, space.width, space.height);
    
    if (fit) {
      const placedWidth = rotated ? itemHeight : itemWidth;
      const placedHeight = rotated ? itemWidth : itemHeight;
      const wasteArea = space.width * space.height - placedWidth * placedHeight;

      if (!bestFit || wasteArea < bestFit.wasteArea) {
        bestFit = { index: i, rotated, wasteArea };
      }
    }
  }

  return bestFit ? { index: bestFit.index, rotated: bestFit.rotated } : null;
}

function splitSpace(space: PackingSpace, itemWidth: number, itemHeight: number): PackingSpace[] {
  const newSpaces: PackingSpace[] = [];

  if (space.width - itemWidth > 0) {
    newSpaces.push({
      x: space.x + itemWidth,
      y: space.y,
      width: space.width - itemWidth,
      height: space.height,
    });
  }

  if (space.height - itemHeight > 0) {
    newSpaces.push({
      x: space.x,
      y: space.y + itemHeight,
      width: itemWidth,
      height: space.height - itemHeight,
    });
  }

  return newSpaces;
}

function splitRemainingSpaces(spaces: PackingSpace[], minWidth: number, minHeight: number): RemnantPiece[] {
  const remnants: RemnantPiece[] = [];
  
  for (const space of spaces) {
    if (space.width >= minWidth && space.height >= minHeight) {
      remnants.push({
        id: generateId(),
        x: space.x,
        y: space.y,
        width: space.width,
        height: space.height,
        area: space.width * space.height,
      });
    }
  }
  
  return remnants;
}

export function calculateLayout(
  orders: Order[],
  paperSize: PaperSize,
  maxProductsPerSheet: number = 100
): CuttingLayout {
  const sortedOrders = sortOrdersByArea(orders);
  const positionedProducts: PositionedProduct[] = [];
  const spaces: PackingSpace[] = [
    { x: 0, y: 0, width: paperSize.width, height: paperSize.height }
  ];

  const orderRemaining = new Map<string, number>();
  let totalProducts = 0;

  for (const order of sortedOrders) {
    orderRemaining.set(order.id, order.quantity);
  }

  let continuePacking = true;
  while (continuePacking && totalProducts < maxProductsPerSheet) {
    let placed = false;

    for (const order of sortedOrders) {
      const remaining = orderRemaining.get(order.id) || 0;
      if (remaining <= 0) continue;

      const itemWidth = order.finishedWidth + (order.bleed || BLEED_DEFAULT) * 2;
      const itemHeight = order.finishedHeight + (order.bleed || BLEED_DEFAULT) * 2;

      const bestFit = findBestFit(spaces, itemWidth, itemHeight);
      
      if (bestFit) {
        const space = spaces[bestFit.index];
        const placedWidth = bestFit.rotated ? itemHeight : itemWidth;
        const placedHeight = bestFit.rotated ? itemWidth : itemHeight;

        positionedProducts.push({
          x: space.x,
          y: space.y,
          width: placedWidth,
          height: placedHeight,
          orderId: order.id,
          orderNo: order.orderNo,
          productName: order.productName,
        });

        spaces.splice(bestFit.index, 1);
        const newSpaces = splitSpace(space, placedWidth, placedHeight);
        spaces.push(...newSpaces);

        orderRemaining.set(order.id, remaining - 1);
        totalProducts++;
        placed = true;
        break;
      }
    }

    if (!placed) {
      continuePacking = false;
    }
  }

  const totalArea = paperSize.width * paperSize.height;
  const utilizedArea = positionedProducts.reduce(
    (sum, p) => sum + p.width * p.height,
    0
  );
  const utilizationRate = totalArea > 0 ? utilizedArea / totalArea : 0;

  const remnants = splitRemainingSpaces(
    spaces,
    MIN_REMNANT_WIDTH,
    MIN_REMNANT_HEIGHT
  );

  return {
    sheetId: paperSize.id,
    sheetName: paperSize.name,
    sheetWidth: paperSize.width,
    sheetHeight: paperSize.height,
    products: positionedProducts,
    remnants,
    productsPerSheet: positionedProducts.length,
    utilizedArea,
    totalArea,
    utilizationRate,
  };
}

export function calculateSchemes(
  orders: Order[],
  paperSizes: PaperSize[]
): CuttingScheme[] {
  const schemes: CuttingScheme[] = [];

  for (const paperSize of paperSizes) {
    if (paperSize.stock <= 0) continue;

    const layout = calculateLayout(orders, paperSize);
    
    if (layout.productsPerSheet === 0) continue;

    const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalSheets = Math.ceil(totalQuantity / layout.productsPerSheet);
    const totalCost = totalSheets * paperSize.unitPrice;
    const totalUtilizationRate = layout.utilizationRate;
    const wasteRate = 1 - totalUtilizationRate;

    const totalRemnantArea = layout.remnants.reduce((sum, r) => sum + r.area, 0) * totalSheets;
    
    const recyclableArea = paperSize.width * paperSize.height * MIN_RECYCLABLE_AREA_RATIO;
    const recyclableRemnants = layout.remnants.filter(
      r => r.area >= recyclableArea
    );

    const orderAllocations = orders.map(order => {
      const productsInLayout = layout.products.filter(p => p.orderId === order.id).length;
      const sheetsForOrder = productsInLayout > 0 
        ? Math.ceil(order.quantity / productsInLayout) 
        : 0;
      
      return {
        orderId: order.id,
        orderNo: order.orderNo,
        quantity: order.quantity,
        sheets: sheetsForOrder,
      };
    });

    schemes.push({
      id: generateId(),
      name: `${paperSize.name} 方案`,
      paperSize,
      layout,
      totalSheets,
      totalCost,
      totalUtilizationRate,
      wasteRate,
      totalRemnantArea,
      recyclableRemnants,
      orderAllocations,
      createdAt: new Date().toISOString(),
    });
  }

  return schemes.sort((a, b) => {
    const scoreA = a.totalUtilizationRate * 0.6 + (1 / a.totalCost) * 0.4;
    const scoreB = b.totalUtilizationRate * 0.6 + (1 / b.totalCost) * 0.4;
    return scoreB - scoreA;
  });
}

export function calculateMultipleLayouts(
  orders: Order[],
  paperSizes: PaperSize[],
  variations: number = 3
): CuttingScheme[] {
  const allSchemes: CuttingScheme[] = [];

  for (const paperSize of paperSizes) {
    if (paperSize.stock <= 0) continue;

    const layouts: CuttingLayout[] = [];
    
    const normalLayout = calculateLayout(orders, paperSize);
    layouts.push(normalLayout);

    const reversedOrders = [...orders].reverse();
    const reversedLayout = calculateLayout(reversedOrders, paperSize);
    layouts.push(reversedLayout);

    const sortedByWidth = [...orders].sort((a, b) => 
      (b.finishedWidth + b.bleed * 2) - (a.finishedWidth + a.bleed * 2)
    );
    const widthSortedLayout = calculateLayout(sortedByWidth, paperSize);
    layouts.push(widthSortedLayout);

    const uniqueLayouts = new Map<string, CuttingLayout>();
    for (const layout of layouts) {
      const key = `${layout.productsPerSheet}-${layout.utilizationRate.toFixed(4)}`;
      if (!uniqueLayouts.has(key)) {
        uniqueLayouts.set(key, layout);
      }
    }

    for (const layout of uniqueLayouts.values()) {
      if (layout.productsPerSheet === 0) continue;

      const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);
      const totalSheets = Math.ceil(totalQuantity / layout.productsPerSheet);
      const totalCost = totalSheets * paperSize.unitPrice;
      const wasteRate = 1 - layout.utilizationRate;
      const totalRemnantArea = layout.remnants.reduce((sum, r) => sum + r.area, 0) * totalSheets;
      
      const recyclableArea = paperSize.width * paperSize.height * MIN_RECYCLABLE_AREA_RATIO;
      const recyclableRemnants = layout.remnants.filter(r => r.area >= recyclableArea);

      const orderAllocations = orders.map(order => {
        const productsInLayout = layout.products.filter(p => p.orderId === order.id).length;
        const sheetsForOrder = productsInLayout > 0 
          ? Math.ceil(order.quantity / productsInLayout) 
          : 0;
        
        return {
          orderId: order.id,
          orderNo: order.orderNo,
          quantity: order.quantity,
          sheets: sheetsForOrder,
        };
      });

      const layoutIndex = allSchemes.filter(s => s.paperSize.id === paperSize.id).length + 1;
      
      allSchemes.push({
        id: generateId(),
        name: `${paperSize.name} 方案${layoutIndex > 1 ? layoutIndex : ''}`,
        paperSize,
        layout,
        totalSheets,
        totalCost,
        totalUtilizationRate: layout.utilizationRate,
        wasteRate,
        totalRemnantArea,
        recyclableRemnants,
        orderAllocations,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return allSchemes.sort((a, b) => {
    const scoreA = a.totalUtilizationRate * 0.6 + (1 / Math.max(a.totalCost, 1)) * 0.4;
    const scoreB = b.totalUtilizationRate * 0.6 + (1 / Math.max(b.totalCost, 1)) * 0.4;
    return scoreB - scoreA;
  }).slice(0, variations * paperSizes.length);
}

export { MIN_REMNANT_WIDTH, MIN_REMNANT_HEIGHT, MIN_RECYCLABLE_AREA_RATIO };
