import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaperSize } from '../types';

interface PaperFormData {
  name: string;
  paperType: string;
  width: number;
  height: number;
  grammage: number;
  stock: number;
  unitPrice: number;
}

const initialForm: PaperFormData = {
  name: '',
  paperType: '铜版纸',
  width: 0,
  height: 0,
  grammage: 0,
  stock: 0,
  unitPrice: 0,
};

const commonSizes = [
  { name: '大度纸 787×1092', width: 787, height: 1092, paperType: '铜版纸' },
  { name: '正度纸 889×1194', width: 889, height: 1194, paperType: '双胶纸' },
  { name: '特规纸 720×1020', width: 720, height: 1020, paperType: '铜版纸' },
  { name: 'A0 841×1189', width: 841, height: 1189, paperType: '铜版纸' },
  { name: 'A1 594×841', width: 594, height: 841, paperType: '铜版纸' },
];

const commonGrammages = [128, 157, 200, 250, 300, 350];
const paperTypes = ['铜版纸', '双胶纸', '特种纸', '白板纸', '牛皮纸', '白卡纸', '哑粉纸'];

export default function PaperPage() {
  const { paperSizes, addPaperSize, updatePaperSize, deletePaperSize, loadSampleData } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PaperSize | null>(null);
  const [formData, setFormData] = useState<PaperFormData>(initialForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPaper) {
      updatePaperSize(editingPaper.id, formData);
    } else {
      addPaperSize(formData);
    }
    setShowForm(false);
    setEditingPaper(null);
    setFormData(initialForm);
  };

  const handleEdit = (paper: PaperSize) => {
    setEditingPaper(paper);
    setFormData({
      name: paper.name,
      paperType: paper.paperType || '铜版纸',
      width: paper.width,
      height: paper.height,
      grammage: paper.grammage,
      stock: paper.stock,
      unitPrice: paper.unitPrice,
    });
    setShowForm(true);
  };

  const handleQuickAdd = (size: typeof commonSizes[0]) => {
    setFormData({
      name: size.name,
      paperType: size.paperType,
      width: size.width,
      height: size.height,
      grammage: 157,
      stock: 1000,
      unitPrice: 2.5,
    });
    setShowForm(true);
    setEditingPaper(null);
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { color: 'bg-red-100 text-red-800', label: '缺货' };
    if (stock < 500) return { color: 'bg-yellow-100 text-yellow-800', label: '库存紧张' };
    return { color: 'bg-green-100 text-green-800', label: '库存充足' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">纸张规格管理</h2>
          <p className="text-gray-600">维护大张纸尺寸、克重、库存和单价信息</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📊 加载示例数据
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingPaper(null); setFormData(initialForm); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ 新增规格
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-700 mb-3">快捷添加常用规格</h3>
        <div className="flex flex-wrap gap-2">
          {commonSizes.map(size => (
            <button
              key={size.name}
              onClick={() => handleQuickAdd(size)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingPaper ? '编辑纸张规格' : '新增纸张规格'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规格名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="如: 大度纸 787×1092"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">纸张类型 *</label>
                <div className="flex flex-wrap gap-2">
                  {paperTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, paperType: type })}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        formData.paperType === type
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">宽度 (mm) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.width || ''}
                    onChange={e => setFormData({ ...formData, width: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="787"
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
                    placeholder="1092"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">克重 (g/m²)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.grammage || ''}
                    onChange={e => setFormData({ ...formData, grammage: Number(e.target.value) })}
                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="157"
                  />
                  <div className="flex flex-wrap gap-1 content-center">
                    {commonGrammages.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, grammage: g })}
                        className={`px-2 py-1 text-xs rounded ${
                          formData.grammage === g
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {g}g
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存数量 (张)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock || ''}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单价 (元/张)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice || ''}
                    onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="2.50"
                  />
                </div>
              </div>

              {formData.width > 0 && formData.height > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">纸张面积:</span>{' '}
                    {(formData.width * formData.height / 1000000).toFixed(4)} m²
                    {' | '}
                    <span className="font-medium">每平方米价格:</span>{' '}
                    {formData.unitPrice > 0 && formData.width > 0 && formData.height > 0
                      ? `¥${(formData.unitPrice / (formData.width * formData.height / 1000000)).toFixed(2)}/m²`
                      : '-'
                    }
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingPaper(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPaper ? '保存修改' : '添加规格'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {paperSizes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-lg">暂无纸张规格数据</p>
            <p className="text-sm mt-2">点击"新增规格"或使用快捷添加开始录入</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规格名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">纸张类型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">尺寸 (mm)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">克重</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">面积</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单价</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">库存</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paperSizes.map(paper => {
                  const stockStatus = getStockStatus(paper.stock);
                  return (
                    <tr key={paper.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{paper.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {paper.paperType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {paper.width} × {paper.height}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{paper.grammage} g/m²</td>
                      <td className="px-4 py-3 text-gray-700">
                        {(paper.width * paper.height / 1000000).toFixed(4)} m²
                      </td>
                      <td className="px-4 py-3 text-gray-700">¥{paper.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-700">{paper.stock.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(paper)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => deletePaperSize(paper.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-800 mb-2">📌 纸张规格说明</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>大度纸</strong>: 787×1092mm，国内常用印刷纸张规格</li>
          <li>• <strong>正度纸</strong>: 889×1194mm，也称为国际开本尺寸</li>
          <li>• <strong>特规纸</strong>: 根据特殊需求定制的尺寸</li>
          <li>• 克重越高，纸张越厚，价格也相应越高</li>
          <li>• 库存为0的纸张规格不会参与开料方案计算</li>
        </ul>
      </div>
    </div>
  );
}
