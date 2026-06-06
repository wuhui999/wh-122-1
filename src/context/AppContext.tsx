import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Order, PaperSize, CuttingScheme, RemnantStock } from '../types';
import { sampleOrders, samplePaperSizes, sampleRemnantStock } from '../data/sampleData';
import { calculateMultipleLayouts, calculateRemnantOptimizedSchemes } from '../utils/algorithm';

interface AppContextType {
  orders: Order[];
  paperSizes: PaperSize[];
  schemes: CuttingScheme[];
  remnantStock: RemnantStock[];
  selectedOrders: string[];
  selectedScheme: CuttingScheme | null;
  
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  toggleOrderSelection: (id: string) => void;
  clearOrderSelection: () => void;
  selectAllOrders: () => void;
  
  addPaperSize: (paper: Omit<PaperSize, 'id' | 'createdAt'>) => void;
  updatePaperSize: (id: string, paper: Partial<PaperSize>) => void;
  deletePaperSize: (id: string) => void;
  
  calculateSchemes: () => void;
  setSelectedScheme: (scheme: CuttingScheme | null) => void;
  confirmScheme: (scheme: CuttingScheme) => void;
  
  addRemnantStock: (remnant: Omit<RemnantStock, 'id' | 'createdAt' | 'status'>) => void;
  updateRemnantStock: (id: string, updates: Partial<RemnantStock>) => void;
  deleteRemnantStock: (id: string) => void;
  registerRemnantsFromScheme: (scheme: CuttingScheme) => void;
  
  loadSampleData: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const STORAGE_KEY = 'paper-cutting-analyzer-data';

interface StoredData {
  orders: Order[];
  paperSizes: PaperSize[];
  remnantStock: RemnantStock[];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paperSizes, setPaperSizes] = useState<PaperSize[]>([]);
  const [schemes, setSchemes] = useState<CuttingScheme[]>([]);
  const [remnantStock, setRemnantStock] = useState<RemnantStock[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<CuttingScheme | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: StoredData = JSON.parse(saved);
        setOrders(data.orders || []);
        setPaperSizes(data.paperSizes || []);
        setRemnantStock(data.remnantStock || []);
      } catch (e) {
        console.error('Failed to load saved data', e);
      }
    }
  }, []);

  useEffect(() => {
    const data: StoredData = { orders, paperSizes, remnantStock };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [orders, paperSizes, remnantStock]);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    setOrders(prev => [...prev, {
      ...order,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
    }]);
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    setSelectedOrders(prev => prev.filter(oId => oId !== id));
  }, []);

  const toggleOrderSelection = useCallback((id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(oId => oId !== id) : [...prev, id]
    );
  }, []);

  const clearOrderSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  const selectAllOrders = useCallback(() => {
    setSelectedOrders(prev => prev.length === orders.length ? [] : orders.map(o => o.id));
  }, [orders]);

  const addPaperSize = useCallback((paper: Omit<PaperSize, 'id' | 'createdAt'>) => {
    setPaperSizes(prev => [...prev, {
      ...paper,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }]);
  }, []);

  const updatePaperSize = useCallback((id: string, updates: Partial<PaperSize>) => {
    setPaperSizes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePaperSize = useCallback((id: string) => {
    setPaperSizes(prev => prev.filter(p => p.id !== id));
  }, []);

  const calculateSchemes = useCallback(() => {
    const selectedOrdersList = orders.filter(o => selectedOrders.includes(o.id));
    if (selectedOrdersList.length === 0 || paperSizes.length === 0) {
      setSchemes([]);
      return;
    }
    const availableRemnants = remnantStock.filter(r => r.status === 'available');
    const calculated = calculateRemnantOptimizedSchemes(
      selectedOrdersList, 
      paperSizes, 
      availableRemnants, 
      3
    );
    setSchemes(calculated);
    setSelectedScheme(calculated[0] || null);
  }, [orders, paperSizes, selectedOrders, remnantStock]);

  const addRemnantStock = useCallback((remnant: Omit<RemnantStock, 'id' | 'createdAt' | 'status'>) => {
    setRemnantStock(prev => [...prev, {
      ...remnant,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'available' as const,
    }]);
  }, []);

  const updateRemnantStock = useCallback((id: string, updates: Partial<RemnantStock>) => {
    setRemnantStock(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRemnantStock = useCallback((id: string) => {
    setRemnantStock(prev => prev.filter(r => r.id !== id));
  }, []);

  const registerRemnantsFromScheme = useCallback((scheme: CuttingScheme) => {
    const newRemnants: RemnantStock[] = scheme.recyclableRemnants.map(remnant => ({
      id: generateId(),
      width: remnant.width,
      height: remnant.height,
      area: remnant.area,
      grammage: scheme.paperSize.grammage,
      paperType: scheme.paperSize.name.split(' ')[0],
      sourceOrderId: scheme.orderAllocations[0]?.orderId || '',
      sourceOrderNo: scheme.orderAllocations[0]?.orderNo || '',
      sourceSchemeId: scheme.id,
      quantity: scheme.totalSheets,
      status: 'available' as const,
      createdAt: new Date().toISOString(),
    }));
    
    setRemnantStock(prev => [...prev, ...newRemnants]);
  }, []);

  const confirmScheme = useCallback((scheme: CuttingScheme) => {
    if (scheme.remnantUsageInfo) {
      for (const usedRemnant of scheme.remnantUsageInfo.usedRemnants) {
        setRemnantStock(prev => prev.map(r => {
          if (r.id === usedRemnant.remnantId) {
            const newQuantity = r.quantity - usedRemnant.quantity;
            return {
              ...r,
              quantity: newQuantity,
              status: newQuantity <= 0 ? 'used' : r.status,
              usedAt: newQuantity <= 0 ? new Date().toISOString() : r.usedAt,
            };
          }
          return r;
        }));
      }
    }

    const newPaperUsed = scheme.remnantUsageInfo?.totalNewPaperSheets || scheme.totalSheets;
    if (newPaperUsed > 0) {
      setPaperSizes(prev => prev.map(p => {
        if (p.id === scheme.paperSize.id) {
          return {
            ...p,
            stock: Math.max(0, p.stock - newPaperUsed),
          };
        }
        return p;
      }));
    }

    const orderIds = scheme.orderAllocations.map(a => a.orderId);
    setOrders(prev => prev.map(o => {
      if (orderIds.includes(o.id)) {
        return {
          ...o,
          status: 'scheduled' as const,
        };
      }
      return o;
    }));

    setSchemes(prev => prev.map(s => {
      if (s.id === scheme.id) {
        return {
          ...s,
          confirmed: true,
          confirmedAt: new Date().toISOString(),
        };
      }
      return s;
    }));

    if (selectedScheme?.id === scheme.id) {
      setSelectedScheme(prev => prev ? {
        ...prev,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      } : null);
    }
  }, [selectedScheme]);

  const loadSampleData = useCallback(() => {
    setOrders(sampleOrders);
    setPaperSizes(samplePaperSizes);
    setRemnantStock(sampleRemnantStock);
    setSelectedOrders(sampleOrders.map(o => o.id));
  }, []);

  const clearAllData = useCallback(() => {
    setOrders([]);
    setPaperSizes([]);
    setSchemes([]);
    setRemnantStock([]);
    setSelectedOrders([]);
    setSelectedScheme(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AppContext.Provider value={{
      orders,
      paperSizes,
      schemes,
      remnantStock,
      selectedOrders,
      selectedScheme,
      addOrder,
      updateOrder,
      deleteOrder,
      toggleOrderSelection,
      clearOrderSelection,
      selectAllOrders,
      addPaperSize,
      updatePaperSize,
      deletePaperSize,
      calculateSchemes,
      setSelectedScheme,
      confirmScheme,
      addRemnantStock,
      updateRemnantStock,
      deleteRemnantStock,
      registerRemnantsFromScheme,
      loadSampleData,
      clearAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
