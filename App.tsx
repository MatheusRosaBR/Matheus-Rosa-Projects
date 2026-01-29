
import React, { useState, useRef, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, ArrowRightLeft, Plus, Tags, LogOut, FileText, ChevronUp, Settings, Repeat, Target, CreditCard, Landmark, LayoutTemplate } from 'lucide-react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Dashboard } from './components/Dashboard';
import { AccountsDashboard } from './components/AccountsDashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { TransferModal } from './components/TransferModal';
import { CategoryManager } from './components/CategoryManager';
import { RecurringManager } from './components/RecurringManager';
import { GoalsManager } from './components/GoalsManager';
import { CreditCardManager } from './components/CreditCardManager';
import { BankAccountManager } from './components/BankAccountManager';
import { ExportModal } from './components/ExportModal';
import { SettingsPage } from './components/SettingsPage';
import { Transaction } from './types';

// Sidebar Navigation Component
const Sidebar = ({ onOpenExport }: { onOpenExport: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Visão Geral' },
    { path: '/accounts', icon: LayoutTemplate, label: 'Minhas Contas' },
    { path: '/transactions', icon: List, label: 'Transações' },
    { path: '/bank-accounts', icon: Landmark, label: 'Contas Bancárias' },
    { path: '/credit-cards', icon: CreditCard, label: 'Cartões' },
    { path: '/recurring', icon: Repeat, label: 'Recorrências' },
    { path: '/goals', icon: Target, label: 'Metas' },
    { path: '/categories', icon: Tags, label: 'Categorias' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 h-screen fixed left-0 top-0 border-r border-slate-800 z-50">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">FinDual</h1>
        <p className="text-xs text-slate-500 mt-1">Gestão Inteligente PF/PJ</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Section with Drop-up Menu */}
      <div className="p-4 border-t border-slate-800" ref={menuRef}>
        <div className="relative">
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in origin-bottom">
               <button 
                onClick={() => {
                  onOpenExport();
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
               >
                 <FileText size={16} />
                 Exportar Relatórios
               </button>
               <Link 
                to="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left border-t border-slate-700"
               >
                 <Settings size={16} />
                 Configurações
               </Link>
               <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left border-t border-slate-700">
                 <LogOut size={16} />
                 Sair
               </button>
            </div>
          )}

          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isUserMenuOpen ? 'bg-slate-800' : 'hover:bg-slate-800'}`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-pf to-brand-pj flex items-center justify-center text-white font-bold text-sm shadow-md">
              JD
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-slate-500">Free Plan</p>
            </div>
            <ChevronUp size={16} className={`text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
};

// Main Layout Content
const MainContent = ({ onOpenExport }: { onOpenExport: () => void }) => {
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  const { isPJEnabled } = useFinance();

  const handleEdit = (t: Transaction) => {
    setEditingTx(t);
    setIsTxModalOpen(true);
  };

  const handleCloseTx = () => {
    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  return (
    <div className="md:ml-64 min-h-screen bg-slate-50/50 transition-all">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
        <span className="font-bold text-xl">FinDual</span>
        <div className="flex gap-4">
             <Link to="/"><LayoutDashboard size={20}/></Link>
             <Link to="/transactions"><List size={20}/></Link>
             <Link to="/bank-accounts"><Landmark size={20} /></Link>
             <Link to="/credit-cards"><CreditCard size={20}/></Link>
        </div>
      </div>

      {/* Top Action Bar (Desktop Sticky) */}
      <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Painel Financeiro</h2>
          <p className="text-sm text-slate-500 hidden sm:block">Gerencie seus fluxos pessoais e empresariais</p>
        </div>
        <div className="flex gap-3">
          {/* Só mostra botão de transferir se PJ estiver ativado */}
          {isPJEnabled && (
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm active:scale-95"
            >
              <ArrowRightLeft size={16} />
              <span className="hidden sm:inline">Transferir</span>
            </button>
          )}
          <button
            onClick={() => setIsTxModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20 font-medium text-sm active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nova Transação</span>
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<AccountsDashboard />} />
          <Route path="/transactions" element={<TransactionList onEdit={handleEdit} />} />
          <Route path="/bank-accounts" element={<BankAccountManager />} />
          <Route path="/credit-cards" element={<CreditCardManager />} />
          <Route path="/recurring" element={<RecurringManager />} />
          <Route path="/goals" element={<GoalsManager />} />
          <Route path="/categories" element={<CategoryManager />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Modals */}
      <TransactionModal 
        isOpen={isTxModalOpen} 
        onClose={handleCloseTx} 
        editTransaction={editingTx} 
      />
      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <FinanceProvider>
      <Router>
        <div className="min-h-screen font-sans">
          <Sidebar onOpenExport={() => setIsExportModalOpen(true)} />
          <MainContent onOpenExport={() => setIsExportModalOpen(true)} />
          
          <ExportModal 
            isOpen={isExportModalOpen} 
            onClose={() => setIsExportModalOpen(false)} 
          />
        </div>
      </Router>
    </FinanceProvider>
  );
}
