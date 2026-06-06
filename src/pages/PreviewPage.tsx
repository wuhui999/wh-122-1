import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

const orderColors = [
  { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white', fill: '#3B82F6' },
  { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white', fill: '#22C55E' },
  { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white', fill: '#A855F7' },
  { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white', fill: '#F97316' },
  { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white', fill: '#EC4899' },
  { bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-white', fill: '#06B6D4' },
  { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-gray-900', fill: '#EAB308' },
  { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white', fill: '#EF4444' },
];

const getOrderColor = (orderId: string, orderIds: string[]) => {
  const index = orderIds.indexOf(orderId);
  return orderColors[index % orderColors.length];
};

export default function PreviewPage() {
  const { selectedScheme, orders, selectedOrders, schemes, setSelectedScheme } = useApp();
  const [showRemnants, setShowRemnants] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const selectedOrdersList = orders.filter(o => selectedOrders.includes(o.id));
  const orderIds = useMemo(() => selectedOrdersList.map(o => o.id), [selectedOrdersList]);

  if (!selectedScheme) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">可视化预览</h2>
            <p className="text-gray-600">用矩形图显示成品排布和边角余料</p>
          </div>
          <Link
            to="/schemes"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← 返回开料方案
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <div className="text-4xl mb-4">👁️</div>
          <p className="text-lg">请先在<a href="/schemes" className="text-blue-600 hover:underline">开料方案</a>页面选择一个方案</p>
          <p className="text-sm mt-2">选择方案后点击"查看排版预览"进入此页面</p>
        </div>
      </div>
    );
  }

  const { layout } = selectedScheme;
  const maxWidth = 800;
  const maxHeight = 600;
  const scale = Math.min(maxWidth / layout.sheetWidth, maxHeight / layout.sheetHeight);
  const svgWidth = layout.sheetWidth * scale;
  const svgHeight = layout.sheetHeight * scale;

  const padding = 20;

  const productStats = useMemo(() => {
    const stats = new Map<string, { count: number; orderNo: string; productName: string }>();
    layout.products.forEach(p => {
      const existing = stats.get(p.orderId) || { count: 0, orderNo: p.orderNo, productName: p.productName };
      stats.set(p.orderId, { ...existing, count: existing.count + 1 });
    });
    return Array.from(stats.entries());
  }, [layout.products]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">可视化预览</h2>
          <p className="text-gray-600">
            {selectedScheme.name} | {layout.sheetWidth} × {layout.sheetHeight} mm | 每张 {layout.productsPerSheet} 个
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/schemes"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← 返回方案列表
          </Link>
          {schemes.length > 1 && (
            <select
              value={selectedScheme.id}
              onChange={(e) => {
                const scheme = schemes.find(s => s.id === e.target.value);
                if (scheme) setSelectedScheme(scheme);
              }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {schemes.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-700">单张排版示意图</h3>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showRemnants}
                    onChange={(e) => setShowRemnants(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>显示余料</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>显示标签</span>
                </label>
              </div>
            </div>

            <div className="flex justify-center bg-gray-100 rounded-lg p-4">
              <svg
                width={svgWidth + padding * 2}
                height={svgHeight + padding * 2}
                className="border border-gray-300 bg-white"
              >
                <defs>
                  <pattern id="remnantPattern" patternUnits="userSpaceOnUse" width="8" height="8">
                    <path d="M0,8 L8,0 M-2,2 L2,-2 M6,10 L10,6" stroke="#F97316" strokeWidth="1" opacity="0.3" />
                  </pattern>
                </defs>

                <rect
                  x={padding}
                  y={padding}
                  width={svgWidth}
                  height={svgHeight}
                  fill="white"
                  stroke="#374151"
                  strokeWidth="2"
                />

                {showRemnants && layout.remnants.map(remnant => {
                  const isRecyclable = selectedScheme.recyclableRemnants.some(r => r.id === remnant.id);
                  return (
                    <g key={remnant.id}>
                      <rect
                        x={padding + remnant.x * scale}
                        y={padding + remnant.y * scale}
                        width={remnant.width * scale}
                        height={remnant.height * scale}
                        fill={isRecyclable ? '#FED7AA' : '#F3F4F6'}
                        stroke={isRecyclable ? '#F97316' : '#D1D5DB'}
                        strokeWidth="1"
                        strokeDasharray={isRecyclable ? "none" : "4,4"}
                        opacity="0.7"
                      />
                      {showLabels && (
                        <text
                          x={padding + (remnant.x + remnant.width / 2) * scale}
                          y={padding + (remnant.y + remnant.height / 2) * scale}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs"
                          fill={isRecyclable ? '#C2410C' : '#6B7280'}
                          fontSize={Math.min(10, Math.min(remnant.width, remnant.height) * scale / 8)}
                        >
                          {isRecyclable ? '可回收' : '浪费'}
                          <tspan x={padding + (remnant.x + remnant.width / 2) * scale} dy="14">
                            {Math.round(remnant.width)}×{Math.round(remnant.height)}
                          </tspan>
                        </text>
                      )}
                    </g>
                  );
                })}

                {layout.products.map((product, index) => {
                  const color = getOrderColor(product.orderId, orderIds);
                  const isHovered = hoveredProduct === `${product.orderId}-${index}`;
                  
                  return (
                    <g
                      key={`${product.orderId}-${index}`}
                      onMouseEnter={() => setHoveredProduct(`${product.orderId}-${index}`)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={padding + product.x * scale}
                        y={padding + product.y * scale}
                        width={product.width * scale}
                        height={product.height * scale}
                        fill={color.fill}
                        stroke={isHovered ? '#1F2937' : color.fill}
                        strokeWidth={isHovered ? 3 : 1}
                        opacity={isHovered ? 0.9 : 0.85}
                        rx="2"
                      />

                      {showLabels && (
                        <>
                          <text
                            x={padding + (product.x + product.width / 2) * scale}
                            y={padding + (product.y + product.height / 2) * scale - 6}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs font-bold"
                            fill="white"
                            fontSize={Math.min(12, Math.min(product.width, product.height) * scale / 10)}
                          >
                            {product.orderNo}
                          </text>
                          <text
                            x={padding + (product.x + product.width / 2) * scale}
                            y={padding + (product.y + product.height / 2) * scale + 8}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs"
                            fill="white"
                            fontSize={Math.min(10, Math.min(product.width, product.height) * scale / 12)}
                          >
                            {Math.round(product.width)}×{Math.round(product.height)}
                          </text>
                        </>
                      )}

                      {!showLabels && isHovered && (
                        <>
                          <text
                            x={padding + (product.x + product.width / 2) * scale}
                            y={padding + (product.y + product.height / 2) * scale}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs font-bold"
                            fill="white"
                            fontSize={12}
                          >
                            {product.productName}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}

                <text
                  x={padding + svgWidth / 2}
                  y={padding + svgHeight + 15}
                  textAnchor="middle"
                  className="text-sm"
                  fill="#6B7280"
                >
                  {layout.sheetWidth} mm
                </text>
                <text
                  x={padding - 10}
                  y={padding + svgHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm"
                  fill="#6B7280"
                  transform={`rotate(-90, ${padding - 10}, ${padding + svgHeight / 2})`}
                >
                  {layout.sheetHeight} mm
                </text>
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{layout.productsPerSheet}</div>
                <div className="text-xs text-blue-600">成品数量/张</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">
                  {(layout.utilizationRate * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-green-600">利用率</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">
                  {((1 - layout.utilizationRate) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-red-600">损耗率</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-orange-600">{layout.remnants.length}</div>
                <div className="text-xs text-orange-600">余料块数</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-700 mb-3">图例</h3>
            <div className="space-y-2">
              {productStats.map(([orderId, stats]) => {
                const color = getOrderColor(orderId, orderIds);
                return (
                  <div key={orderId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded ${color.bg}`} />
                      <span className="text-sm text-gray-700">{stats.orderNo}</span>
                    </div>
                    <span className="text-sm text-gray-500">×{stats.count}</span>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-orange-200 border border-orange-400" />
                  <span className="text-sm text-gray-700">可回收余料</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300 border-dashed" />
                  <span className="text-sm text-gray-700">浪费边角料</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-700 mb-3">产品分布详情</h3>
            <div className="space-y-3">
              {productStats.map(([orderId, stats]) => {
                const color = getOrderColor(orderId, orderIds);
                const percentage = (stats.count / layout.productsPerSheet) * 100;
                return (
                  <div key={orderId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{stats.productName}</span>
                      <span className="text-gray-500">{stats.count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color.bg}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedScheme.recyclableRemnants.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-700 mb-3">可回收余料</h3>
              <div className="space-y-2 text-sm">
                {selectedScheme.recyclableRemnants.map((remnant, index) => (
                  <div key={remnant.id} className="flex justify-between bg-orange-50 rounded px-3 py-2">
                    <span className="text-orange-800">余料 #{index + 1}</span>
                    <span className="text-orange-700">
                      {Math.round(remnant.width)} × {Math.round(remnant.height)} mm
                    </span>
                  </div>
                ))}
                <p className="text-xs text-gray-500 pt-2">
                  共 {selectedScheme.recyclableRemnants.length} 块可回收余料，
                  总面积 {(layout.remnants.reduce((sum, r) => sum + r.area, 0) / 1000000).toFixed(4)} m²
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-700 mb-3">方案信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">纸张规格</span>
                <span className="text-gray-800 font-medium">{selectedScheme.paperSize.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">纸张尺寸</span>
                <span className="text-gray-800">{layout.sheetWidth} × {layout.sheetHeight} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">纸张克重</span>
                <span className="text-gray-800">{selectedScheme.paperSize.grammage} g/m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">总用纸量</span>
                <span className="text-gray-800 font-medium">{selectedScheme.totalSheets} 张</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">总成本</span>
                <span className="text-green-600 font-bold">¥{selectedScheme.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">📌 可视化预览说明</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 彩色矩形表示成品位置，不同颜色对应不同订单</li>
          <li>• 橙色区域表示可回收余料（大于纸张面积10%），可登记入库</li>
          <li>• 灰色虚线区域表示无法利用的边角料</li>
          <li>• 鼠标悬停在成品上可查看产品名称详情</li>
          <li>• 可切换显示余料和标签，便于观察排版效果</li>
          <li>• 所有尺寸已按比例缩放显示，实际尺寸标注在边框上</li>
        </ul>
      </div>
    </div>
  );
}
