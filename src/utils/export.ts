import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CuttingScheme, Order } from '../types';

export function exportToExcel(scheme: CuttingScheme, orders: Order[]) {
  const workbook = XLSX.utils.book_new();

  const schemeData = [
    ['开料方案清单'],
    [],
    ['方案信息'],
    ['方案名称', scheme.name],
    ['纸张规格', scheme.paperSize.name],
    ['纸张尺寸', `${scheme.paperSize.width} × ${scheme.paperSize.height} mm`],
    ['克重', `${scheme.paperSize.grammage} g/m²`],
    ['单价', `¥${scheme.paperSize.unitPrice.toFixed(2)}/张`],
    [],
    ['计算结果'],
    ['总用纸量', `${scheme.totalSheets} 张`],
    ['总成本', `¥${scheme.totalCost.toFixed(2)}`],
    ['利用率', `${(scheme.totalUtilizationRate * 100).toFixed(2)}%`],
    ['损耗率', `${(scheme.wasteRate * 100).toFixed(2)}%`],
    ['余料总面积', `${scheme.totalRemnantArea.toFixed(2)} mm²`],
    [],
    ['订单分配'],
    ['订单号', '产品名称', '数量', '分配纸张数'],
    ...scheme.orderAllocations.map(a => {
      const order = orders.find(o => o.id === a.orderId);
      return [a.orderNo, order?.productName || '', a.quantity, a.sheets];
    }),
  ];

  const schemeSheet = XLSX.utils.aoa_to_sheet(schemeData);
  XLSX.utils.book_append_sheet(workbook, schemeSheet, '方案信息');

  const layoutData = [
    ['单张排版详情'],
    [],
    ['序号', '订单号', '产品名称', 'X位置(mm)', 'Y位置(mm)', '宽度(mm)', '高度(mm)'],
    ...scheme.layout.products.map((p, i) => [
      i + 1,
      p.orderNo,
      p.productName,
      p.x.toFixed(1),
      p.y.toFixed(1),
      p.width.toFixed(1),
      p.height.toFixed(1),
    ]),
  ];

  const layoutSheet = XLSX.utils.aoa_to_sheet(layoutData);
  XLSX.utils.book_append_sheet(workbook, layoutSheet, '排版详情');

  const remnantData = [
    ['余料信息'],
    [],
    ['序号', 'X位置(mm)', 'Y位置(mm)', '宽度(mm)', '高度(mm)', '面积(mm²)', '是否可回收'],
    ...scheme.layout.remnants.map((r, i) => [
      i + 1,
      r.x.toFixed(1),
      r.y.toFixed(1),
      r.width.toFixed(1),
      r.height.toFixed(1),
      r.area.toFixed(1),
      scheme.recyclableRemnants.some(rr => rr.id === r.id) ? '是' : '否',
    ]),
  ];

  const remnantSheet = XLSX.utils.aoa_to_sheet(remnantData);
  XLSX.utils.book_append_sheet(workbook, remnantSheet, '余料信息');

  const fileName = `开料方案_${scheme.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportToPDF(scheme: CuttingScheme, orders: Order[]) {
  const doc = new jsPDF();
  
  let yPos = 20;
  
  doc.setFontSize(18);
  doc.text('印刷厂开料方案清单', 105, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(12);
  doc.text(`方案名称: ${scheme.name}`, 14, yPos);
  yPos += 8;
  doc.text(`生成日期: ${new Date().toLocaleDateString('zh-CN')}`, 14, yPos);
  yPos += 15;

  const schemeTableData = [
    ['纸张规格', scheme.paperSize.name],
    ['纸张尺寸', `${scheme.paperSize.width} × ${scheme.paperSize.height} mm`],
    ['克重', `${scheme.paperSize.grammage} g/m²`],
    ['单价', `¥${scheme.paperSize.unitPrice.toFixed(2)}/张`],
    ['总用纸量', `${scheme.totalSheets} 张`],
    ['总成本', `¥${scheme.totalCost.toFixed(2)}`],
    ['利用率', `${(scheme.totalUtilizationRate * 100).toFixed(2)}%`],
    ['损耗率', `${(scheme.wasteRate * 100).toFixed(2)}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['项目', '数值']],
    body: schemeTableData,
    headStyles: { fillColor: [66, 153, 225] },
    styles: { fontSize: 10 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('订单分配详情', 14, yPos);
  yPos += 10;

  const orderTableData = scheme.orderAllocations.map(a => {
    const order = orders.find(o => o.id === a.orderId);
    return [a.orderNo, order?.productName || '', a.quantity.toString(), a.sheets.toString()];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['订单号', '产品名称', '数量', '分配纸张数']],
    body: orderTableData,
    headStyles: { fillColor: [66, 153, 225] },
    styles: { fontSize: 10 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('单张排版详情（每页摆放数量：' + scheme.layout.productsPerSheet + '）', 14, yPos);
  yPos += 10;

  const layoutTableData = scheme.layout.products.map((p, i) => [
    (i + 1).toString(),
    p.orderNo,
    p.productName,
    p.x.toFixed(1),
    p.y.toFixed(1),
    p.width.toFixed(1),
    p.height.toFixed(1),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['序号', '订单号', '产品名称', 'X(mm)', 'Y(mm)', '宽度(mm)', '高度(mm)']],
    body: layoutTableData,
    headStyles: { fillColor: [72, 187, 120] },
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.text('余料信息', 14, yPos);
  yPos += 10;

  const remnantTableData = scheme.layout.remnants.map((r, i) => [
    (i + 1).toString(),
    r.x.toFixed(1),
    r.y.toFixed(1),
    r.width.toFixed(1),
    r.height.toFixed(1),
    r.area.toFixed(0),
    scheme.recyclableRemnants.some(rr => rr.id === r.id) ? '是' : '否',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['序号', 'X(mm)', 'Y(mm)', '宽度(mm)', '高度(mm)', '面积(mm²)', '可回收']],
    body: remnantTableData,
    headStyles: { fillColor: [237, 137, 54] },
    styles: { fontSize: 9 },
  });

  const fileName = `开料方案_${scheme.name}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function exportSchemeComparison(schemes: CuttingScheme[], orders: Order[]) {
  const workbook = XLSX.utils.book_new();

  const comparisonData = [
    ['开料方案对比分析'],
    [],
    ['排名', '方案名称', '纸张规格', '纸张尺寸', '每张数量', '总张数', '总成本(元)', '利用率(%)', '损耗率(%)', '余料面积(mm²)'],
    ...schemes.map((s, i) => [
      i + 1,
      s.name,
      s.paperSize.name,
      `${s.paperSize.width}×${s.paperSize.height}`,
      s.layout.productsPerSheet,
      s.totalSheets,
      s.totalCost.toFixed(2),
      (s.totalUtilizationRate * 100).toFixed(2),
      (s.wasteRate * 100).toFixed(2),
      s.totalRemnantArea.toFixed(0),
    ]),
  ];

  const comparisonSheet = XLSX.utils.aoa_to_sheet(comparisonData);
  XLSX.utils.book_append_sheet(workbook, comparisonSheet, '方案对比');

  const orderSummary = [
    ['订单汇总'],
    [],
    ['订单号', '产品名称', '成品尺寸', '数量', '纸张类型', '交期'],
    ...orders.map(o => [
      o.orderNo,
      o.productName,
      `${o.finishedWidth}×${o.finishedHeight}`,
      o.quantity,
      o.paperType,
      o.deliveryDate,
    ]),
  ];

  const orderSheet = XLSX.utils.aoa_to_sheet(orderSummary);
  XLSX.utils.book_append_sheet(workbook, orderSheet, '订单汇总');

  const fileName = `方案对比_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
