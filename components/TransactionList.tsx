import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, AccountType, TransactionType } from '../types';
import { Filter, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, CreditCard, Search, Calendar, XCircle } from 'lucide-react';

interface Props {
  onEdit: (t: Transaction) => void;
}

export const TransactionList: React.FC<Props> = ({ onEdit }) => {
  const { transactions, deleteTransaction } = useFinance();
  
  // Filters State
  const [filterAccount, setFilterAccount] = useState<AccountType | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtering Logic
  const filteredTransactions = transactions.filter(t => {
    // 1. Filter by Account
    if (filterAccount !== 'ALL' && t.accountType !== filterAccount) return false;
    
    // 2. Filter by Type
    if (filterType !== 'ALL' && t.type !== filterType) return false;

    // 3. Filter by Search Term (Description or Category)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesDesc = t.description.toLowerCase().includes(term);
      const matchesCat = t.category.toLowerCase().includes(term);
      if (!matchesDesc && !matchesCat) return false;
    }

    // 4. Filter by Date Range
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;

    return true;
  });

  const clearFilters = () => {
    setFilterAccount('ALL');
    setFilterType('ALL');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = filterAccount !== 'ALL' || filterType !== 'ALL' || searchTerm !== '' || startDate !== '' || endDate !== '';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up delay-100 flex flex-col">
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Histórico de Transações</h3>
            <p className="text-xs text-slate-400 mt-1">
              Exibindo {filteredTransactions.length} de {transactions.length} registros
            </p>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
            >
              <XCircle size={14} />
              Limpar Filtros
            </button>
          )}
        </div>
        
        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
           {/* Search Bar */}
           <div className="lg:col-span-4 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               type="text"
               placeholder="Buscar descrição ou categoria..."
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           {/* Date Range Start */}
           <div className="lg:col-span-2 relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Calendar size={14} />
             </div>
             <input 
               type="date"
               className="w-full pl-9 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               title="Data Inicial"
             />
           </div>

           {/* Date Range End */}
           <div className="lg:col-span-2 relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Calendar size={14} />
             </div>
             <input 
               type="date"
               className="w-full pl-9 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               title="Data Final"
             />
           </div>
           
           {/* Account Filter */}
           <div className="lg:col-span-2 relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <select 
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary appearance-none cursor-pointer transition-all"
               value={filterAccount}
               onChange={(e) => setFilterAccount(e.target.value as any)}
             >
               <option value="ALL">Todas Contas</option>
               <option value="PF">Apenas PF</option>
               <option value="PJ">Apenas PJ</option>
             </select>
           </div>
           
           {/* Type Filter */}
           <div className="lg:col-span-2">
             <select 
               className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary cursor-pointer transition-all"
               value={filterType}
               onChange={(e) => setFilterType(e.target.value as any)}
             >
               <option value="ALL">Todos Tipos</option>
               <option value="INCOME">Entradas</option>
               <option value="EXPENSE">Saídas</option>
             </select>
           </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-left border-collapse relative">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-wider">
              <th className="sticky top-0 bg-slate-50 p-4 font-semibold z-10 shadow-sm">Conta</th>
              <th className="sticky top-0 bg-slate-50 p-4 font-semibold z-10 shadow-sm">Descrição</th>
              <th className="sticky top-0 bg-slate-50 p-4 font-semibold z-10 shadow-sm">Categoria</th>
              <th className="sticky top-0 bg-slate-50 p-4 font-semibold z-10 shadow-sm">Data</th>
              <th className="sticky top-0 bg-slate-50 p-4 font-semibold text-right z-10 shadow-sm">Valor</th>
              <th className="sticky top-0 bg-slate-50 p-4 font-semibold text-center z-10 shadow-sm">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
                <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 flex flex-col items-center justify-center w-full">
                        <Search size={32} className="mb-2 opacity-50" />
                        <p>Nenhuma transação encontrada com os filtros atuais.</p>
                    </td>
                </tr>
            ) : (
                filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${t.accountType === 'PF' ? 'bg-brand-pf/10 text-brand-pf' : 'bg-brand-pj/10 text-brand-pj'}`}>
                            {t.accountType}
                        </span>
                    </td>
                    <td className="p-4 font-medium flex items-center gap-2">
                        {t.type === 'INCOME' ? 
                            <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> : 
                            <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                        }
                        {t.description}
                        {t.paymentMethod === 'CREDIT' && (
                            <div className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[10px] font-bold flex items-center gap-1">
                                <CreditCard size={10} /> CRÉDITO
                            </div>
                        )}
                    </td>
                    <td className="p-4 text-slate-500">{t.category}</td>
                    <td className="p-4 text-slate-500">{formatDate(t.date)}</td>
                    <td className={`p-4 text-right font-semibold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {t.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(t.amount)}
                    </td>
                    <td className="p-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-blue-50 rounded">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};