import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Order, PaperSize, CuttingScheme, RemnantStock } from '../types';
import { sampleOrders, samplePaperSizes, sampleRemnantStock } from '../data/sampleData';
import { calculateMultipleLayouts } from '../utils/algorithm';

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
    const calculated = calculateMultipleLayouts(selectedOrdersList, paperSizes, 3);
    setSchemes(calculated);
    setSelectedScheme(calculated[0] || null);
  }, [orders, paperSizes, selectedOrders]);

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
