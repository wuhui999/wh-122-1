import { Order, PaperSize, CuttingLayout, PositionedProduct, RemnantPiece, CuttingScheme, RemnantStock, RemnantUsageInfo, RemnantUsage } from '../types';

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
          isFromRemnant: false,
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
    isFromRemnant: false,
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
      isRemnantOptimized: false,
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
        isRemnantOptimized: false,
      });
    }
  }

  return allSchemes.sort((a, b) => {
    const scoreA = a.totalUtilizationRate * 0.6 + (1 / Math.max(a.totalCost, 1)) * 0.4;
    const scoreB = b.totalUtilizationRate * 0.6 + (1 / Math.max(b.totalCost, 1)) * 0.4;
    return scoreB - scoreA;
  }).slice(0, variations * paperSizes.length);
}

function canFitInRemnant(
  order: Order,
  remnant: RemnantStock
): { canFit: boolean; rotated: boolean; itemWidth: number; itemHeight: number } {
  const itemWidth = order.finishedWidth + (order.bleed || BLEED_DEFAULT) * 2;
  const itemHeight = order.finishedHeight + (order.bleed || BLEED_DEFAULT) * 2;

  if (itemWidth <= remnant.width && itemHeight <= remnant.height) {
    return { canFit: true, rotated: false, itemWidth, itemHeight };
  }
  if (itemHeight <= remnant.width && itemWidth <= remnant.height) {
    return { canFit: true, rotated: true, itemWidth, itemHeight };
  }
  return { canFit: false, rotated: false, itemWidth, itemHeight };
}

function calculateLayoutOnRemnant(
  orders: Order[],
  remnant: RemnantStock,
  maxProductsPerSheet: number = 100
): CuttingLayout {
  const sortedOrders = sortOrdersByArea(orders);
  const positionedProducts: PositionedProduct[] = [];
  const spaces: PackingSpace[] = [
    { x: 0, y: 0, width: remnant.width, height: remnant.height }
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
          isFromRemnant: true,
          remnantId: remnant.id,
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

  const totalArea = remnant.width * remnant.height;
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
    sheetId: remnant.id,
    sheetName: `余料 ${remnant.width}×${remnant.height}`,
    sheetWidth: remnant.width,
    sheetHeight: remnant.height,
    products: positionedProducts,
    remnants,
    productsPerSheet: positionedProducts.length,
    utilizedArea,
    totalArea,
    utilizationRate,
    isFromRemnant: true,
    remnantId: remnant.id,
    sourceRemnant: {
      id: remnant.id,
      width: remnant.width,
      height: remnant.height,
    },
  };
}

function findSuitableRemnants(
  orders: Order[],
  remnantStock: RemnantStock[],
  paperSize: PaperSize
): RemnantStock[] {
  const suitableRemnants: RemnantStock[] = [];
  
  const orderPaperTypes = [...new Set(orders.map(o => o.paperType))];
  
  for (const remnant of remnantStock) {
    if (remnant.status !== 'available') continue;
    if (remnant.grammage !== paperSize.grammage) continue;
    if (remnant.paperType !== paperSize.paperType) continue;
    if (!orderPaperTypes.includes(remnant.paperType)) continue;
    
    const matchingOrders = orders.filter(o => o.paperType === remnant.paperType);
    const canFitAny = matchingOrders.some(order => canFitInRemnant(order, remnant).canFit);
    if (canFitAny) {
      suitableRemnants.push(remnant);
    }
  }
  
  return suitableRemnants.sort((a, b) => b.area - a.area);
}

function groupOrdersByPaper(orders: Order[]): Map<string, Order[]> {
  const groups = new Map<string, Order[]>();
  
  for (const order of orders) {
    const key = `${order.paperType}-${order.finishedWidth + order.bleed * 2 <= order.finishedHeight + order.bleed * 2 ? order.finishedWidth + order.bleed * 2 : order.finishedHeight + order.bleed * 2}`;
    const actualKey = `${order.paperType}`;
    if (!groups.has(actualKey)) {
      groups.set(actualKey, []);
    }
    groups.get(actualKey)!.push(order);
  }
  
  return groups;
}

function findMatchingPaperSizes(
  orders: Order[],
  paperSizes: PaperSize[]
): PaperSize[] {
  const orderPaperTypes = [...new Set(orders.map(o => o.paperType))];
  return paperSizes.filter(p => 
    p.stock > 0 && orderPaperTypes.includes(p.paperType)
  );
}

function calculateSchemesForPaperGroup(
  orders: Order[],
  paperSize: PaperSize,
  remnantStock: RemnantStock[],
  allOrders: Order[]
): CuttingScheme[] {
  const schemes: CuttingScheme[] = [];
  
  const filteredOrders = orders.filter(o => o.paperType === paperSize.paperType);
  if (filteredOrders.length === 0) return schemes;

  const suitableRemnants = findSuitableRemnants(filteredOrders, remnantStock, paperSize);
  
  const normalLayout = calculateLayout(filteredOrders, paperSize);
  if (normalLayout.productsPerSheet === 0) return schemes;
  
  const totalQuantity = filteredOrders.reduce((sum, o) => sum + o.quantity, 0);
  const pureNewPaperSheets = Math.ceil(totalQuantity / normalLayout.productsPerSheet);
  const pureNewPaperCost = pureNewPaperSheets * paperSize.unitPrice;

  let remainingQuantity = totalQuantity;
  const remnantLayouts: CuttingLayout[] = [];
  const usedRemnantsInfo: RemnantUsageInfo['usedRemnants'] = [];
  let totalRemnantProducts = 0;
  let totalRemnantSheets = 0;
  let totalCostSaved = 0;

  const orderRemaining = new Map<string, number>();
  for (const order of filteredOrders) {
    orderRemaining.set(order.id, order.quantity);
  }

  for (const remnant of suitableRemnants) {
    if (remainingQuantity <= 0) break;
    
    const remainingOrders = filteredOrders
      .filter(o => (orderRemaining.get(o.id) || 0) > 0)
      .map(o => ({ ...o, quantity: orderRemaining.get(o.id) || 0 }));
    
    const remnantLayout = calculateLayoutOnRemnant(remainingOrders, remnant);
    
    if (remnantLayout.productsPerSheet > 0) {
      const maxRemnantSheets = Math.min(
        remnant.quantity,
        Math.ceil(remainingQuantity / remnantLayout.productsPerSheet)
      );
      
      const productsFromRemnant = Math.min(
        maxRemnantSheets * remnantLayout.productsPerSheet,
        remainingQuantity
      );
      const actualRemnantSheets = Math.ceil(productsFromRemnant / remnantLayout.productsPerSheet);
      
      if (actualRemnantSheets > 0) {
        const newPaperEquivalent = Math.ceil(productsFromRemnant / normalLayout.productsPerSheet);
        const costSaved = newPaperEquivalent * paperSize.unitPrice;
        
        remnantLayouts.push(remnantLayout);
        usedRemnantsInfo.push({
          remnantId: remnant.id,
          remnantName: `余料 ${remnant.width}×${remnant.height}`,
          width: remnant.width,
          height: remnant.height,
          quantity: actualRemnantSheets,
          productsCount: productsFromRemnant,
          utilizedArea: remnantLayout.utilizedArea * actualRemnantSheets,
          costSaved,
        });
        
        totalRemnantProducts += productsFromRemnant;
        totalRemnantSheets += actualRemnantSheets;
        totalCostSaved += costSaved;
        remainingQuantity -= productsFromRemnant;
        
        for (const product of remnantLayout.products) {
          const currentRemaining = orderRemaining.get(product.orderId) || 0;
          const perSheetCount = remnantLayout.products.filter(p => p.orderId === product.orderId).length;
          const toDeduct = Math.min(perSheetCount * actualRemnantSheets, currentRemaining);
          orderRemaining.set(product.orderId, currentRemaining - toDeduct);
        }
      }
    }
  }

  const remainingOrders = filteredOrders
    .filter(o => (orderRemaining.get(o.id) || 0) > 0)
    .map(o => ({ ...o, quantity: orderRemaining.get(o.id) || 0 }));
  
  let newPaperLayout = normalLayout;
  let newPaperSheets = 0;
  
  if (remainingOrders.length > 0 && remainingQuantity > 0) {
    newPaperLayout = calculateLayout(remainingOrders, paperSize);
    if (newPaperLayout.productsPerSheet > 0) {
      newPaperSheets = Math.ceil(remainingQuantity / newPaperLayout.productsPerSheet);
    }
  }

  const totalSheets = totalRemnantSheets + newPaperSheets;
  const optimizedCost = newPaperSheets * paperSize.unitPrice;
  const costSavings = pureNewPaperCost - optimizedCost;

  const allProducts = [
    ...remnantLayouts.flatMap(layout => layout.products),
    ...newPaperLayout.products,
  ];
  
  const totalUtilizedArea = 
    remnantLayouts.reduce((sum, l) => sum + l.utilizedArea * (usedRemnantsInfo.find(r => r.remnantId === l.remnantId)?.quantity || 0), 0) +
    newPaperLayout.utilizedArea * newPaperSheets;
  
  const totalArea = 
    remnantLayouts.reduce((sum, l) => sum + l.totalArea * (usedRemnantsInfo.find(r => r.remnantId === l.remnantId)?.quantity || 0), 0) +
    newPaperLayout.totalArea * newPaperSheets;
  
  const totalUtilizationRate = totalArea > 0 ? totalUtilizedArea / totalArea : 0;

  const combinedLayout: CuttingLayout = {
    ...newPaperLayout,
    products: allProducts,
    productsPerSheet: allProducts.filter(p => !p.isFromRemnant).length,
  };

  const orderAllocations = allOrders.map(order => {
    const remnantProducts = remnantLayouts.reduce((sum, l) => 
      sum + l.products.filter(p => p.orderId === order.id).length, 0);
    const newPaperProducts = newPaperLayout.products.filter(p => p.orderId === order.id).length;
    const perSheetTotal = remnantProducts + newPaperProducts;
    
    const sheetsForOrder = perSheetTotal > 0 
      ? Math.ceil(order.quantity / perSheetTotal) 
      : 0;
    
    return {
      orderId: order.id,
      orderNo: order.orderNo,
      quantity: order.quantity,
      sheets: sheetsForOrder,
    };
  });

  const totalRemnantArea = 
    remnantLayouts.reduce((sum, l) => sum + l.remnants.reduce((s, r) => s + r.area, 0) * (usedRemnantsInfo.find(r => r.remnantId === l.remnantId)?.quantity || 0), 0) +
    newPaperLayout.remnants.reduce((sum, r) => sum + r.area, 0) * newPaperSheets;
  
  const recyclableArea = paperSize.width * paperSize.height * MIN_RECYCLABLE_AREA_RATIO;
  const recyclableRemnants = [
    ...remnantLayouts.flatMap(l => l.remnants.filter(r => r.area >= recyclableArea)),
    ...newPaperLayout.remnants.filter(r => r.area >= recyclableArea),
  ];

  const scheme: CuttingScheme = {
    id: generateId(),
    name: `${paperSize.name} 方案${suitableRemnants.length > 0 && totalRemnantSheets > 0 ? ' (余料优先)' : ''}`,
    paperSize,
    layout: combinedLayout,
    totalSheets,
    totalCost: optimizedCost,
    totalUtilizationRate,
    wasteRate: 1 - totalUtilizationRate,
    totalRemnantArea,
    recyclableRemnants,
    orderAllocations,
    createdAt: new Date().toISOString(),
    isRemnantOptimized: suitableRemnants.length > 0 && totalRemnantSheets > 0,
    remnantUsageInfo: {
      usedRemnants: usedRemnantsInfo,
      totalRemnantSheets,
      totalRemnantProducts,
      totalNewPaperSheets: newPaperSheets,
      totalNewPaperProducts: remainingQuantity > 0 ? remainingQuantity : 0,
      costSavings,
      pureNewPaperCost,
      optimizedCost,
    },
    remnantLayouts,
  };

  schemes.push(scheme);

  if (suitableRemnants.length > 0 && totalRemnantSheets > 0) {
    const pureScheme: CuttingScheme = {
      ...scheme,
      id: generateId(),
      name: `${paperSize.name} 方案 (纯新纸)`,
      totalSheets: pureNewPaperSheets,
      totalCost: pureNewPaperCost,
      totalUtilizationRate: normalLayout.utilizationRate,
      wasteRate: 1 - normalLayout.utilizationRate,
      layout: normalLayout,
      isRemnantOptimized: false,
      remnantUsageInfo: undefined,
      remnantLayouts: undefined,
    };
    schemes.push(pureScheme);
  }

  return schemes;
}

export function calculateRemnantOptimizedSchemes(
  orders: Order[],
  paperSizes: PaperSize[],
  remnantStock: RemnantStock[],
  variations: number = 3
): CuttingScheme[] {
  const allSchemes: CuttingScheme[] = [];

  const orderGroups = groupOrdersByPaper(orders);
  
  for (const [paperType, groupOrders] of orderGroups) {
    const matchingPaperSizes = paperSizes.filter(p => 
      p.stock > 0 && p.paperType === paperType
    );
    
    for (const paperSize of matchingPaperSizes) {
      const schemes = calculateSchemesForPaperGroup(
        groupOrders,
        paperSize,
        remnantStock,
        orders
      );
      allSchemes.push(...schemes);
    }
  }

  return allSchemes.sort((a, b) => {
    const costA = a.totalCost;
    const costB = b.totalCost;
    if (costA !== costB) {
      return costA - costB;
    }
    const scoreA = a.totalUtilizationRate * 0.6 + (1 / Math.max(a.totalCost, 1)) * 0.4;
    const scoreB = b.totalUtilizationRate * 0.6 + (1 / Math.max(b.totalCost, 1)) * 0.4;
    return scoreB - scoreA;
  });
}

export { MIN_REMNANT_WIDTH, MIN_REMNANT_HEIGHT, MIN_RECYCLABLE_AREA_RATIO };
