import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CuttingScheme } from '../types';
import { exportToExcel, exportToPDF, exportSchemeComparison } from '../utils/export';
import { Link } from 'react-router-dom';

export default function SchemesPage() {
  const {
    orders,
    selectedOrders,
    schemes,
    selectedScheme,
    calculateSchemes,
    setSelectedScheme,
    registerRemnantsFromScheme,
  } = useApp();

  const [isCalculating, setIsCalculating] = useState(false);
  const [remnantRegistered, setRemnantRegistered] = useState<string | null>(null);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      calculateSchemes();
      setIsCalculating(false);
    }, 500);
  };

  const handleRegisterRemnants = (scheme: CuttingScheme) => {
    if (scheme.recyclableRemnants.length === 0) {
      alert('该方案没有可回收的余料');
      return;
    }
    registerRemnantsFromScheme(scheme);
    setRemnantRegistered(scheme.id);
    setTimeout(() => setRemnantRegistered(null), 3000);
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 0.85) return 'text-green-600';
    if (rate >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationBg = (rate: number) => {
    if (rate >= 0.85) return 'bg-green-500';
    if (rate >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const selectedOrdersList = orders.filter(o => selectedOrders.includes(o.id));
  const totalQuantity = selectedOrdersList.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">开料方案</h2>
          <p className="text-gray-600">展示不同排版方案的利用率、预计成本和余料信息</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleCalculate}
            disabled={isCalculating || selectedOrders.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isCalculating ? '⏳ 计算中...' : '📐 计算开料方案'}
          </button>
          {schemes.length > 0 && (
            <button
              onClick={() => exportSchemeComparison(schemes, selectedOrdersList)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📊 导出对比表
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-700 mb-3">已选择的订单</h3>
        {selectedOrdersList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            请先在<a href="/" className="text-blue-600 hover:underline">订单导入</a>页面选择需要计算的订单
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedOrdersList.map(order => (
              <div key={order.id} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="font-medium text-blue-800">{order.orderNo}</div>
                <div className="text-xs text-blue-600">
                  {order.productName} | {order.finishedWidth}×{order.finishedHeight}mm | {order.quantity.toLocaleString()}份
                </div>
              </div>
            ))}
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <div className="font-medium text-purple-800">总计</div>
              <div className="text-xs text-purple-600">{selectedOrdersList.length}个订单 | {totalQuantity.toLocaleString()}份</div>
            </div>
          </div>
        )}
      </div>

      {schemes.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schemes.map((scheme, index) => (
              <div
                key={scheme.id}
                className={`bg-white rounded-lg shadow border-2 transition-all cursor-pointer ${
                  selectedScheme?.id === scheme.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => setSelectedScheme(scheme)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">推荐</span>
                        )}
                        <h3 className="text-lg font-bold text-gray-800">{scheme.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500">{scheme.paperSize.name}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getUtilizationColor(scheme.totalUtilizationRate)}`}>
                        {(scheme.totalUtilizationRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">利用率</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full ${getUtilizationBg(scheme.totalUtilizationRate)}`}
                      style={{ width: `${scheme.totalUtilizationRate * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-gray-800">{scheme.layout.productsPerSheet}</div>
                      <div className="text-xs text-gray-500">每张数量</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-gray-800">{scheme.totalSheets}</div>
                      <div className="text-xs text-gray-500">总张数</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-lg font-bold text-green-600">¥{scheme.totalCost.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">总成本</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span className="text-red-500">损耗率: {(scheme.wasteRate * 100).toFixed(1)}%</span>
                      {' | '}
                      <span className="text-orange-500">可回收余料: {scheme.recyclableRemnants.length}块</span>
                    </div>
                  </div>

                  {selectedScheme?.id === scheme.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <h4 className="font-medium text-gray-700">订单分配详情</h4>
                      <div className="space-y-2">
                        {scheme.orderAllocations.map(alloc => {
                          const order = selectedOrdersList.find(o => o.id === alloc.orderId);
                          return (
                            <div key={alloc.orderId} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                              <span className="text-gray-700">{alloc.orderNo} - {order?.productName}</span>
                              <span className="text-gray-600">{alloc.quantity.toLocaleString()}份 → {alloc.sheets}张纸</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Link
                          to="/preview"
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-center text-sm font-medium"
                        >
                          👁️ 查看排版预览
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRegisterRemnants(scheme); }}
                          className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium"
                          disabled={remnantRegistered === scheme.id}
                        >
                          {remnantRegistered === scheme.id ? '✅ 已登记' : '📦 登记余料'}
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportToExcel(scheme, selectedOrdersList); }}
                          className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                        >
                          📥 导出Excel
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); exportToPDF(scheme, selectedOrdersList); }}
                          className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                        >
                          📄 导出PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-700 mb-4">方案对比分析</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">排名</th>
                    <th className="px-3 py-2 text-left">方案名称</th>
                    <th className="px-3 py-2 text-left">纸张规格</th>
                    <th className="px-3 py-2 text-right">每张数量</th>
                    <th className="px-3 py-2 text-right">总张数</th>
                    <th className="px-3 py-2 text-right">总成本</th>
                    <th className="px-3 py-2 text-right">利用率</th>
                    <th className="px-3 py-2 text-right">损耗率</th>
                    <th className="px-3 py-2 text-right">余料面积</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {schemes.map((scheme, index) => (
                    <tr key={scheme.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        {index === 0 && <span className="text-yellow-500">🥇</span>}
                        {index === 1 && <span className="text-gray-400">🥈</span>}
                        {index === 2 && <span className="text-orange-400">🥉</span>}
                        {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                      </td>
                      <td className="px-3 py-2 font-medium">{scheme.name}</td>
                      <td className="px-3 py-2 text-gray-600">{scheme.paperSize.name}</td>
                      <td className="px-3 py-2 text-right">{scheme.layout.productsPerSheet}</td>
                      <td className="px-3 py-2 text-right">{scheme.totalSheets}</td>
                      <td className="px-3 py-2 text-right font-medium text-green-600">¥{scheme.totalCost.toFixed(2)}</td>
                      <td className={`px-3 py-2 text-right font-medium ${getUtilizationColor(scheme.totalUtilizationRate)}`}>
                        {(scheme.totalUtilizationRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right text-red-500">{(scheme.wasteRate * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2 text-right text-gray-600">{(scheme.totalRemnantArea / 1000000).toFixed(4)} m²</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {schemes.length === 0 && selectedOrdersList.length > 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <div className="text-4xl mb-4">📐</div>
          <p className="text-lg">点击"计算开料方案"按钮生成排版方案</p>
          <p className="text-sm mt-2">系统将自动计算多种排版方式，推荐最优方案</p>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">📌 开料方案说明</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 系统采用启发式算法计算多种可能的排版方案，按综合评分排序</li>
          <li>• 综合评分 = 利用率 × 60% + 成本因素 × 40%</li>
          <li>• 利用率 = 成品总面积 / 纸张总面积，越高越好</li>
          <li>• 损耗率 = 1 - 利用率，包括余料和无法利用的边角料</li>
          <li>• 大于纸张面积10%的余料可以登记入库，供后续订单使用</li>
          <li>• 点击方案卡片可展开查看详情、预览排版效果和导出报告</li>
        </ul>
      </div>
    </div>
  );
}
