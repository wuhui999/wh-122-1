import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RemnantStock } from '../types';

interface RemnantFormData {
  width: number;
  height: number;
  grammage: number;
  paperType: string;
  sourceOrderNo: string;
  quantity: number;
}

const initialForm: RemnantFormData = {
  width: 0,
  height: 0,
  grammage: 0,
  paperType: '铜版纸',
  sourceOrderNo: '',
  quantity: 0,
};

const paperTypes = ['铜版纸', '双胶纸', '特种纸', '白板纸', '牛皮纸'];

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  used: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  available: '可用',
  reserved: '已预留',
  used: '已使用',
};

export default function RemnantsPage() {
  const {
    remnantStock,
    orders,
    addRemnantStock,
    updateRemnantStock,
    deleteRemnantStock,
    loadSampleData,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingRemnant, setEditingRemnant] = useState<RemnantStock | null>(null);
  const [formData, setFormData] = useState<RemnantFormData>(initialForm);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paperTypeFilter, setPaperTypeFilter] = useState<string>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const area = formData.width * formData.height;
    if (editingRemnant) {
      updateRemnantStock(editingRemnant.id, {
        ...formData,
        area,
      });
    } else {
      addRemnantStock({
        ...formData,
        area,
        sourceOrderId: orders.find(o => o.orderNo === formData.sourceOrderNo)?.id || '',
        sourceSchemeId: 'manual',
      });
    }
    setShowForm(false);
    setEditingRemnant(null);
    setFormData(initialForm);
  };

  const handleEdit = (remnant: RemnantStock) => {
    setEditingRemnant(remnant);
    setFormData({
      width: remnant.width,
      height: remnant.height,
      grammage: remnant.grammage,
      paperType: remnant.paperType,
      sourceOrderNo: remnant.sourceOrderNo,
      quantity: remnant.quantity,
    });
    setShowForm(true);
  };

  const handleMarkStatus = (id: string, status: 'available' | 'reserved' | 'used') => {
    updateRemnantStock(id, {
      status,
      usedAt: status === 'used' ? new Date().toISOString() : undefined,
    });
  };

  const filteredRemnants = remnantStock.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (paperTypeFilter !== 'all' && r.paperType !== paperTypeFilter) return false;
    return true;
  });

  const stats = {
    total: remnantStock.length,
    available: remnantStock.filter(r => r.status === 'available').length,
    reserved: remnantStock.filter(r => r.status === 'reserved').length,
    used: remnantStock.filter(r => r.status === 'used').length,
    totalArea: remnantStock.reduce((sum, r) => sum + r.area * r.quantity, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">余料库存</h2>
          <p className="text-gray-600">记录可复用余料尺寸、来源订单和使用状态</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📊 加载示例数据
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingRemnant(null); setFormData(initialForm); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ 手动登记余料
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-500">总记录数</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.available}</div>
          <div className="text-sm text-gray-500">可用</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.reserved}</div>
          <div className="text-sm text-gray-500">已预留</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-gray-600">{stats.used}</div>
          <div className="text-sm text-gray-500">已使用</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {(stats.totalArea / 1000000).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">总面积 (m²)</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">状态:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              <option value="available">可用</option>
              <option value="reserved">已预留</option>
              <option value="used">已使用</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">纸张类型:</label>
            <select
              value={paperTypeFilter}
              onChange={(e) => setPaperTypeFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              {paperTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingRemnant ? '编辑余料记录' : '手动登记余料'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">宽度 (mm) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.width || ''}
                    onChange={e => setFormData({ ...formData, width: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="350"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">高度 (mm) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.height || ''}
                    onChange={e => setFormData({ ...formData, height: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="450"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">克重 (g/m²) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.grammage || ''}
                    onChange={e => setFormData({ ...formData, grammage: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="157"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">来源订单号</label>
                  <input
                    type="text"
                    value={formData.sourceOrderNo}
                    onChange={e => setFormData({ ...formData, sourceOrderNo: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="如: SO-2024-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量 (张) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity || ''}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="50"
                    required
                  />
                </div>
              </div>

              {formData.width > 0 && formData.height > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">单张面积:</span>{' '}
                    {(formData.width * formData.height / 1000000).toFixed(4)} m²
                    {' | '}
                    <span className="font-medium">总面积:</span>{' '}
                    {(formData.width * formData.height * formData.quantity / 1000000).toFixed(4)} m²
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingRemnant(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRemnant ? '保存修改' : '登记余料'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRemnants.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-lg">暂无余料库存记录</p>
            <p className="text-sm mt-2">
              在开料方案页面点击"登记余料"可自动将可回收余料登记入库，或手动添加
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">尺寸 (mm)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单张面积</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">克重</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">纸张类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源订单</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登记日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRemnants.map(remnant => (
                  <tr key={remnant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {remnant.width} × {remnant.height}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {(remnant.area / 1000000).toFixed(4)} m²
                    </td>
                    <td className="px-4 py-3 text-gray-700">{remnant.grammage} g/m²</td>
                    <td className="px-4 py-3 text-gray-700">{remnant.paperType}</td>
                    <td className="px-4 py-3 text-gray-700">{remnant.quantity} 张</td>
                    <td className="px-4 py-3 text-gray-700">
                      {remnant.sourceOrderNo || '-'}
                      {remnant.sourceSchemeId === 'manual' && (
                        <span className="text-xs text-gray-500 ml-1">(手动)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(remnant.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[remnant.status]}`}>
                        {statusLabels[remnant.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-1">
                        {remnant.status === 'available' && (
                          <>
                            <button
                              onClick={() => handleMarkStatus(remnant.id, 'reserved')}
                              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                            >
                              预留
                            </button>
                            <button
                              onClick={() => handleMarkStatus(remnant.id, 'used')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              使用
                            </button>
                          </>
                        )}
                        {remnant.status === 'reserved' && (
                          <button
                            onClick={() => handleMarkStatus(remnant.id, 'available')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            取消预留
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(remnant)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => deleteRemnantStock(remnant.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-800 mb-2">📌 余料管理说明</h4>
        <ul className="text-sm text-orange-700 space-y-1">
          <li>• <strong>自动登记</strong>: 在开料方案页面点击"登记余料"，系统自动将大于纸张面积10%的余料入库</li>
          <li>• <strong>手动登记</strong>: 点击"手动登记余料"，录入零散余料信息</li>
          <li>• <strong>状态管理</strong>: 可用 → 预留 → 已使用，清晰追踪余料流转</li>
          <li>• <strong>筛选功能</strong>: 按状态和纸张类型筛选，快速找到可用余料</li>
          <li>• <strong>面积统计</strong>: 实时统计余料总面积，便于估算可用产能</li>
          <li>• 合理利用余料可以显著降低纸张成本，减少浪费</li>
        </ul>
      </div>
    </div>
  );
}
