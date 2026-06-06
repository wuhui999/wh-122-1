import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import * as XLSX from 'xlsx';

interface OrderFormData {
  orderNo: string;
  productName: string;
  finishedWidth: number;
  finishedHeight: number;
  quantity: number;
  paperType: string;
  deliveryDate: string;
  bleed: number;
}

const initialForm: OrderFormData = {
  orderNo: '',
  productName: '',
  finishedWidth: 0,
  finishedHeight: 0,
  quantity: 0,
  paperType: '铜版纸',
  deliveryDate: '',
  bleed: 3,
};

const paperTypes = ['铜版纸', '双胶纸', '特种纸', '白板纸', '牛皮纸'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  scheduled: '已排产',
  completed: '已完成',
};

export default function OrdersPage() {
  const {
    orders,
    selectedOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    toggleOrderSelection,
    selectAllOrders,
    loadSampleData,
    clearAllData,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderFormData>(initialForm);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder) {
      updateOrder(editingOrder.id, formData);
    } else {
      addOrder(formData);
    }
    setShowForm(false);
    setEditingOrder(null);
    setFormData(initialForm);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      orderNo: order.orderNo,
      productName: order.productName,
      finishedWidth: order.finishedWidth,
      finishedHeight: order.finishedHeight,
      quantity: order.quantity,
      paperType: order.paperType,
      deliveryDate: order.deliveryDate,
      bleed: order.bleed,
    });
    setShowForm(true);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        const importedOrders: OrderFormData[] = jsonData.map((row: any) => ({
          orderNo: row['订单号'] || row['orderNo'] || '',
          productName: row['产品名称'] || row['productName'] || '',
          finishedWidth: Number(row['成品宽度'] || row['finishedWidth'] || 0),
          finishedHeight: Number(row['成品高度'] || row['finishedHeight'] || 0),
          quantity: Number(row['数量'] || row['quantity'] || 0),
          paperType: row['纸张类型'] || row['paperType'] || '铜版纸',
          deliveryDate: row['交期'] || row['deliveryDate'] || new Date().toISOString().split('T')[0],
          bleed: Number(row['出血'] || row['bleed'] || 3),
        }));

        const validOrders = importedOrders.filter(
          o => o.orderNo && o.productName && o.finishedWidth > 0 && o.finishedHeight > 0 && o.quantity > 0
        );

        if (validOrders.length === 0) {
          setImportError('未找到有效的订单数据，请检查文件格式');
          return;
        }

        validOrders.forEach(o => addOrder(o));
        setImportError(null);
        alert(`成功导入 ${validOrders.length} 条订单`);
      } catch (error) {
        setImportError('文件解析失败，请确保是有效的 Excel 文件');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">订单导入</h2>
          <p className="text-gray-600">录入印刷订单信息，支持单个添加或批量导入</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📊 加载示例数据
          </button>
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🗑️ 清空数据
          </button>
          <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            📥 批量导入
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => { setShowForm(true); setEditingOrder(null); setFormData(initialForm); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ 新增订单
          </button>
        </div>
      </div>

      {importError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {importError}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingOrder ? '编辑订单' : '新增订单'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">订单号 *</label>
                  <input
                    type="text"
                    value={formData.orderNo}
                    onChange={e => setFormData({ ...formData, orderNo: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="如: SO-2024-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={e => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="如: 宣传画册"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成品宽度 (mm) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.finishedWidth || ''}
                    onChange={e => setFormData({ ...formData, finishedWidth: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成品高度 (mm) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.finishedHeight || ''}
                    onChange={e => setFormData({ ...formData, finishedHeight: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="285"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出血 (mm)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bleed}
                    onChange={e => setFormData({ ...formData, bleed: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量 *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || ''}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">纸张类型</label>
                  <select
                    value={formData.paperType}
                    onChange={e => setFormData({ ...formData, paperType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    {paperTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">交期</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingOrder(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingOrder ? '保存修改' : '添加订单'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onChange={selectAllOrders}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">全选</span>
            </label>
            <span className="text-sm text-gray-500">
              已选择 {selectedOrders.length} / {orders.length} 个订单
            </span>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg">暂无订单数据</p>
            <p className="text-sm mt-2">点击"新增订单"或"加载示例数据"开始使用</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成品尺寸</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">纸张类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">交期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{order.orderNo}</td>
                    <td className="px-4 py-3 text-gray-700">{order.productName}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {order.finishedWidth} × {order.finishedHeight} mm
                      <span className="text-xs text-gray-500 ml-1">
                        (含出血: {order.finishedWidth + order.bleed * 2} × {order.finishedHeight + order.bleed * 2})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{order.paperType}</td>
                    <td className="px-4 py-3 text-gray-700">{order.deliveryDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">📌 使用说明</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 勾选订单后，前往"开料方案"页面进行排版计算</li>
          <li>• 成品尺寸为净尺寸，系统会自动加上出血位进行排版计算</li>
          <li>• 支持批量导入 Excel 文件，列名可使用中文或英文（订单号/orderNo、产品名称/productName 等）</li>
          <li>• 可使用"加载示例数据"快速体验系统功能</li>
        </ul>
      </div>
    </div>
  );
}
