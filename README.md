# 印刷厂纸张开料分析工具

一款专业的印刷厂纸张开料分析工具，帮助计划员根据订单成品尺寸、数量、纸张规格和余料库存，智能生成开料方案并可视化利用率与余料回收。

## ✨ 核心功能

### 📋 订单导入
- 手动录入或批量导入印刷订单
- 支持成品尺寸、数量、纸张类型、交期管理
- 自动计算含出血位的实际排版尺寸
- 支持 Excel 批量导入

### 📄 纸张规格管理
- 维护大张纸尺寸、克重、库存和单价
- 常用规格快捷添加（大度纸、正度纸等）
- 实时计算纸张面积和单位面积价格
- 库存状态自动预警

### 📐 开料方案计算
- 采用启发式排版算法（Best Fit Decreasing）
- 支持多订单合并计算
- 自动生成多种排版方案
- 综合评分排序（利用率60% + 成本40%）
- 详细展示每张数量、总张数、总成本、利用率、损耗率

### 👁️ 可视化预览
- SVG 矩形图直观展示成品排布
- 不同颜色区分不同订单
- 可回收余料与浪费边角料清晰标识
- 鼠标悬停查看详情
- 支持切换显示余料和标签
- 实时统计利用率、损耗率等指标

### 📦 余料库存管理
- 自动登记大于阈值的可回收余料
- 手动录入零散余料
- 状态管理：可用 → 预留 → 已使用
- 按状态和纸张类型筛选
- 实时面积统计

### 📊 报告导出
- 导出开料清单（Excel / PDF）
- 导出方案对比分析表
- 包含排版详情、余料信息等完整数据

## 🧮 核心算法

### 排版算法（Best Fit Decreasing）
1. 按成品面积从大到小排序
2. 自动旋转优化摆放
3. 选择浪费最小的位置放置
4. 智能分割剩余空间
5. 支持多种排序策略生成不同方案

### 利用率计算
```
利用率 = 成品总面积 / 纸张总面积
损耗率 = 1 - 利用率
```

### 成本计算
```
总张数 = ceil(总数量 / 每张数量)
总成本 = 总张数 × 纸张单价
```

### 可回收余料判定
- 宽度 ≥ 100mm 且 高度 ≥ 100mm
- 面积 ≥ 纸张面积 × 10%

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 📖 使用说明

### 快速体验
1. 点击任意页面的「📊 加载示例数据」按钮
2. 系统自动加载5个示例订单和5种纸张规格
3. 前往「开料方案」页面，点击「📐 计算开料方案」
4. 查看各方案的利用率、成本等指标
5. 点击方案卡片展开详情，可查看排版预览、登记余料、导出报告

### 标准工作流程
1. **录入订单**：在「订单导入」页面添加订单信息
2. **维护纸张**：在「纸张规格」页面添加可用纸张
3. **计算方案**：在「开料方案」页面选择订单并计算
4. **选择方案**：比较不同方案，选择最优方案
5. **查看预览**：在「可视化预览」页面确认排版效果
6. **登记余料**：将可回收余料登记入库
7. **导出报告**：导出开料清单和方案对比

### Excel 导入格式
支持以下列名（中文或英文）：
- 订单号 / orderNo
- 产品名称 / productName
- 成品宽度 / finishedWidth
- 成品高度 / finishedHeight
- 数量 / quantity
- 纸张类型 / paperType
- 交期 / deliveryDate
- 出血 / bleed

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router v6
- **样式**: Tailwind CSS 3
- **状态管理**: React Context + useState
- **数据持久化**: LocalStorage
- **Excel 导出**: SheetJS (xlsx)
- **PDF 导出**: jsPDF + jsPDF-autotable

## 📁 项目结构

```
src/
├── components/          # 公共组件
│   └── Layout.tsx       # 布局组件
├── context/             # 状态管理
│   └── AppContext.tsx   # 全局状态
├── data/                # 示例数据
│   └── sampleData.ts    # 示例订单和纸张
├── pages/               # 页面组件
│   ├── OrdersPage.tsx   # 订单导入
│   ├── PaperPage.tsx    # 纸张规格
│   ├── SchemesPage.tsx  # 开料方案
│   ├── PreviewPage.tsx  # 可视化预览
│   └── RemnantsPage.tsx # 余料库存
├── types/               # 类型定义
│   └── index.ts         # 所有类型
├── utils/               # 工具函数
│   ├── algorithm.ts     # 排版算法
│   └── export.ts        # 导出功能
├── App.tsx              # 应用入口
├── main.tsx             # 渲染入口
└── index.css            # 全局样式
```

## 📝 核心数据模型

### Order (订单)
- `orderNo`: 订单号
- `productName`: 产品名称
- `finishedWidth/Height`: 成品尺寸
- `quantity`: 数量
- `bleed`: 出血位

### PaperSize (纸张规格)
- `name`: 规格名称
- `width/height`: 尺寸
- `grammage`: 克重
- `stock`: 库存
- `unitPrice`: 单价

### CuttingScheme (开料方案)
- `paperSize`: 使用的纸张
- `layout`: 排版结果
- `totalSheets`: 总张数
- `totalCost`: 总成本
- `totalUtilizationRate`: 总利用率
- `recyclableRemnants`: 可回收余料

### RemnantStock (余料库存)
- `width/height`: 尺寸
- `grammage`: 克重
- `paperType`: 纸张类型
- `sourceOrderNo`: 来源订单
- `status`: 状态（可用/预留/已使用）

## 🎯 验收要点

1. ✅ **可运行应用**: `npm run dev` 启动后正常访问
2. ✅ **示例数据**: 一键加载完整示例数据
3. ✅ **排布逻辑**: 启发式算法，支持自动旋转和多方案
4. ✅ **利用率计算**: 准确计算面积利用率和损耗率
5. ✅ **余料登记**: 自动/手动登记可回收余料
6. ✅ **可视化预览**: SVG 矩形图展示排版效果
7. ✅ **数据导出**: Excel 和 PDF 格式导出
8. ✅ **数据持久化**: LocalStorage 自动保存

## 📄 License

MIT License
