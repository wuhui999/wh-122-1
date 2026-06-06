import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: '订单导入', icon: '📋' },
  { path: '/paper', label: '纸张规格', icon: '📄' },
  { path: '/schemes', label: '开料方案', icon: '📐' },
  { path: '/preview', label: '可视化预览', icon: '👁️' },
  { path: '/remnants', label: '余料库存', icon: '📦' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🏭</span>
              <div>
                <h1 className="text-xl font-bold">印刷厂纸张开料分析工具</h1>
                <p className="text-blue-200 text-sm">智能排版 · 成本优化 · 余料回收</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  location.pathname === item.path
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>印刷厂纸张开料分析工具 © 2024 | 智能排版，降本增效</p>
        </div>
      </footer>
    </div>
  );
}
