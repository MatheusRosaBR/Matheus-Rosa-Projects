import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Building2, User, CreditCard, Repeat, CalendarClock, Tags, Target, ChevronLeft, ChevronRight, Scale } from 'lucide-react';
import { Transaction } from '../types';
import { DayDetailModal } from './DayDetailModal';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatDateDay = (dateStr: string) => {
  const date = new Date(dateStr);
  // Ajuste de fuso horário simples para garantir o dia correto na visualização
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  return adjustedDate.getDate().toString().padStart(2, '0');
};

export const Dashboard: React.FC = () => {
  const { transactions, goals, cards, isPJEnabled } = useFinance();
  const [categoryTab, setCategoryTab] = useState<'PF' | 'PJ'>('PF');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State para o modal de detalhes do dia
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{ day: string; transactions: Transaction[] }>({ day: '', transactions: [] });

  const metrics = useMemo(() => {
    let balancePF = 0;
    let balancePJ = 0;
    let income = 0;
    let expense = 0;
    let creditExpense = 0;

    transactions.forEach(t => {
      const val = t.type === 'INCOME' ? t.amount : -t.amount;
      if (t.accountType === 'PF') balancePF += val;
      else balancePJ += val;

      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
        if (t.paymentMethod === 'CREDIT') {
          creditExpense += t.amount;
        }
      }
    });

    return { balancePF, balancePJ, total: balancePF + balancePJ, income, expense, creditExpense };
  }, [transactions]);

  const monthlyMetrics = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // 1. Processar transações REAIS (não recorrentes) do mês
    const monthTransactions = transactions.filter(t => {
      if (t.isRecurring) return false; // Ignora os 'templates' de recorrência
      const tDate = new Date(t.date);
      const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
      return adjustedDate >= startDate && adjustedDate <= endDate;
    });

    let income = 0;
    let expense = 0;
    
    const daysInMonth = endDate.getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString().padStart(2, '0'),
      pf: 0,
      pj: 0,
    }));

    monthTransactions.forEach(t => {
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
        const tDate = new Date(t.date);
        const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
        const dayOfMonth = adjustedDate.getDate() - 1;

        if (dailyData[dayOfMonth]) {
          if (t.accountType === 'PF') {
            dailyData[dayOfMonth].pf += t.amount;
          } else {
            dailyData[dayOfMonth].pj += t.amount;
          }
        }
      }
    });

    // 2. Projetar despesas RECORRENTES para o mês atual
    const recurringExpenses = transactions.filter(t => t.isRecurring && t.type === 'EXPENSE');
    
    recurringExpenses.forEach(recTx => {
      // Usar UTCDate para pegar o dia do cadastro sem influência do fuso horário
      const dayOfMonth = new Date(recTx.date).getUTCDate(); 
      const dayIndex = dayOfMonth - 1;

      // Adiciona a despesa recorrente ao dia correspondente no gráfico
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        expense += recTx.amount;
        if (recTx.accountType === 'PF') {
          dailyData[dayIndex].pf += recTx.amount;
        } else {
          dailyData[dayIndex].pj += recTx.amount;
        }
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
      chartData: dailyData
    };
  }, [transactions, currentMonth]);

  const chartData = useMemo(() => {
    // Group by account Type for Pie Chart
    let pfExpense = 0;
    let pjExpense = 0;

    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      if(t.accountType === 'PF') pfExpense += t.amount;
      else pjExpense += t.amount;
    });

    const pieData = [
      { name: 'Despesas PF', value: pfExpense },
    ];
    
    if (isPJEnabled) {
      pieData.push({ name: 'Despesas PJ', value: pjExpense });
    }

    // Payment Method Pie Chart
    let creditTotal = 0;
    let debitPfTotal = 0;
    let debitPjTotal = 0;

    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
       if (t.paymentMethod === 'CREDIT') {
         creditTotal += t.amount;
       } else {
         if (t.accountType === 'PF') {
           debitPfTotal += t.amount;
         } else {
           debitPjTotal += t.amount;
         }
       }
    });

    const methodData = [
      { name: 'Crédito', value: creditTotal },
      { name: 'Débito/Transf. (PF)', value: debitPfTotal },
    ];

    if (isPJEnabled) {
      methodData.push({ name: 'Débito/Transf. (PJ)', value: debitPjTotal });
    }

    return { pieData, methodData };
  }, [transactions, isPJEnabled]);

  const categoryData = useMemo(() => {
    // Structure: { categoryName: { pf: 0, pj: 0, total: 0 } }
    const categoriesMap: Record<string, { pf: number, pj: number, total: number }> = {};
    
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const cat = t.category || 'Outros';
        
        if (!categoriesMap[cat]) {
            categoriesMap[cat] = { pf: 0, pj: 0, total: 0 };
        }
        
        if (t.accountType === 'PF') {
            categoriesMap[cat].pf += t.amount;
        } else {
            categoriesMap[cat].pj += t.amount;
        }
        
        categoriesMap[cat].total += t.amount;
      });

    // Retorna TODAS as categorias, ordenadas pelo total, sem fatiar (.slice) o array.
    return Object.entries(categoriesMap)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Filtra os dados da categoria baseado na aba selecionada
  const filteredCategoryData = useMemo(() => {
    // Se PJ estiver desabilitado, força a exibição de PF
    const activeTab = isPJEnabled ? categoryTab : 'PF';

    return categoryData
      .map(item => ({
        name: item.name,
        value: activeTab === 'PF' ? item.pf : item.pj
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categoryData, categoryTab, isPJEnabled]);

  const recurringData = useMemo(() => {
    const recurring = transactions.filter(t => t.isRecurring);
    const pfList = recurring.filter(t => t.accountType === 'PF');
    const pjList = recurring.filter(t => t.accountType === 'PJ');

    const calcTotal = (list: Transaction[]) => list.reduce((acc, t) => {
      return acc + (t.type === 'INCOME' ? t.amount : -t.amount);
    }, 0);

    return {
      pf: pfList,
      pj: pjList,
      pfTotal: calcTotal(pfList),
      pjTotal: calcTotal(pjList)
    };
  }, [transactions]);

  const goalsMetrics = useMemo(() => {
    const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const totalCurrent = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    return { totalTarget, totalCurrent };
  }, [goals]);

  // Credit Card Expenses Metric
  const cardExpenses = useMemo(() => {
    if (cards.length === 0) return [];
    
    // Filtrar cartões se PJ estiver desabilitado
    const visibleCards = isPJEnabled ? cards : cards.filter(c => c.accountType === 'PF');

    return visibleCards.map(card => {
      const totalSpent = transactions
        .filter(t => t.paymentMethod === 'CREDIT' && t.cardId === card.id && t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0);
      
      return {
        ...card,
        totalSpent,
        percentageUsed: (totalSpent / card.limit) * 100
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent); // Show most used first
  }, [cards, transactions, isPJEnabled]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const isNextMonthDisabled = useMemo(() => {
    const today = new Date();
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return next > today;
  }, [currentMonth]);

  const handleBarClick = (data: any) => {
    if (!data || !data.activePayload || data.activePayload.length === 0) return;
    const payload = data.activePayload[0].payload;
    if (payload.pf + payload.pj === 0) return;

    const day = payload.day;
    const clickedDayNumber = parseInt(day, 10);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const realTransactionsOnDay = transactions.filter(t => {
      if (t.isRecurring || t.type !== 'EXPENSE') return false;
      const tDate = new Date(t.date);
      const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
      return adjustedDate.getFullYear() === year && adjustedDate.getMonth() === month && adjustedDate.getDate() === clickedDayNumber;
    });

    const recurringTransactionsOnDay = transactions.filter(t => {
      if (!t.isRecurring || t.type !== 'EXPENSE') return false;
      const recurringDay = new Date(t.date).getUTCDate();
      return recurringDay === clickedDayNumber;
    });
    
    // Filtra transações PJ se desabilitado
    let allTransactionsForDay = [...realTransactionsOnDay, ...recurringTransactionsOnDay];
    if (!isPJEnabled) {
      allTransactionsForDay = allTransactionsForDay.filter(t => t.accountType === 'PF');
    }

    if (allTransactionsForDay.length > 0) {
      setSelectedDayData({ day, transactions: allTransactionsForDay });
      setIsDayDetailModalOpen(true);
    }
  };


  const COLORS = ['#8b5cf6', '#0ea5e9']; // Violet (PF), Sky (PJ)
  const METHOD_COLORS = ['#f43f5e', '#8b5cf6', '#0ea5e9']; // Rose (Credit), Violet (PF Debit), Sky (PJ Debit)
  
  // Palette for Categories
  const CATEGORY_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#f97316',
    '#14b8a6', '#d946ef', '#64748b', '#9ca3af'
  ];

  const RecurringList = ({ list, type }: { list: Transaction[], type: 'PF' | 'PJ' }) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <CalendarClock size={24} className="mb-2 opacity-50" />
          <p className="text-xs">Sem recorrências ativas</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map(t => (
          <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded p-1 min-w-[40px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Dia</span>
                <span className="text-sm font-bold text-slate-700">{formatDateDay(t.date)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 line-clamp-1">{t.description}</p>
                <p className="text-xs text-slate-400">{t.category}</p>
              </div>
            </div>
            <div className={`text-sm font-semibold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-600'}`}>
              {t.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(t.amount)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* KPI Cards */}
      <div className={`grid grid-cols-1 ${isPJEnabled ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
        {/* Consolidated */}
        <div className={`${isPJEnabled ? 'md:col-span-2' : 'md:col-span-2'} bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="flex items-center gap-3 mb-2 z-10">
            <div className="p-2 bg-white/10 rounded-lg"><Wallet className="w-5 h-5 text-emerald-400" /></div>
            <span className="text-slate-300 text-sm font-medium">Saldo {isPJEnabled ? 'Consolidado' : 'Atual'}</span>
          </div>
          <div className="text-3xl font-bold z-10">{formatCurrency(metrics.total)}</div>
          <div className="flex gap-4 mt-4 text-xs text-slate-400 z-10">
            <div className="flex items-center gap-1"><TrendingUp size={14} className="text-emerald-400"/> {formatCurrency(metrics.income)}</div>
            <div className="flex items-center gap-1"><TrendingDown size={14} className="text-rose-400"/> {formatCurrency(metrics.expense)}</div>
          </div>
        </div>

        {/* PF */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-pf/10 rounded-lg"><User className="w-5 h-5 text-brand-pf" /></div>
            <span className="text-slate-500 text-sm font-medium">Conta Pessoal</span>
          </div>
          <div className={`text-2xl font-bold ${metrics.balancePF >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
            {formatCurrency(metrics.balancePF)}
          </div>
        </div>

        {/* PJ - Only show if enabled */}
        {isPJEnabled && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
             <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-pj/10 rounded-lg"><Building2 className="w-5 h-5 text-brand-pj" /></div>
              <span className="text-slate-500 text-sm font-medium">Conta Empresa</span>
            </div>
            <div className={`text-2xl font-bold ${metrics.balancePJ >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              {formatCurrency(metrics.balancePJ)}
            </div>
          </div>
        )}
      </div>
      
      {/* Monthly Overview Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800">Visão Geral do Mês</h3>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={handlePreviousMonth}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors"
                    aria-label="Mês anterior"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-700 w-32 text-center capitalize">
                    {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                    onClick={handleNextMonth}
                    disabled={isNextMonthDisabled}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Próximo mês"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>

        {/* Monthly Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="p-2 bg-white rounded-full text-emerald-500"><TrendingUp size={20}/></div>
                <div>
                    <p className="text-xs font-medium text-emerald-700">Receitas no Mês</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(monthlyMetrics.income)}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <div className="p-2 bg-white rounded-full text-rose-500"><TrendingDown size={20}/></div>
                <div>
                    <p className="text-xs font-medium text-rose-700">Despesas no Mês</p>
                    <p className="text-lg font-bold text-rose-600">{formatCurrency(monthlyMetrics.expense)}</p>
                </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="p-2 bg-white rounded-full text-slate-500"><Scale size={20}/></div>
                <div>
                    <p className="text-xs font-medium text-slate-700">Balanço do Mês</p>
                    <p className={`text-lg font-bold ${monthlyMetrics.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                        {formatCurrency(monthlyMetrics.balance)}
                    </p>
                </div>
            </div>
        </div>

        {/* Daily Expense Chart */}
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMetrics.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleBarClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis tickFormatter={(value) => formatCurrency(value as number)} tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip 
                        formatter={(value: number, name: string) => [formatCurrency(value), name === 'pf' ? 'Despesas PF' : 'Despesas PJ']} 
                        cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="pf" stackId="a" fill="#8b5cf6" name="Despesas PF" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                    {isPJEnabled && (
                      <Bar dataKey="pj" stackId="a" fill="#0ea5e9" name="Despesas PJ" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Despesas PF vs PJ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Despesas por Conta (Total)</h3>
          <div className="h-48 w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary Totals */}
          <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
            {chartData.pieData.map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-slate-600">{entry.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Pagamentos (Crédito vs Débito) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <CreditCard size={18} className="text-rose-500"/>
             Métodos de Pagamento (Total)
          </h3>
          <div className="h-48 w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                 <Pie
                  data={chartData.methodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                   {chartData.methodData.map((entry, index) => (
                    <Cell key={`cell-m-${index}`} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary Totals */}
          <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
            {chartData.methodData.map((entry, index) => (
              <div key={entry.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: METHOD_COLORS[index % METHOD_COLORS.length] }}></div>
                  <span className="text-slate-600">{entry.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION: Expenses by Category (Split View) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Tags className="text-brand-primary" size={20} />
             Gastos por Categoria
          </h3>
          
          {/* Tabs Switcher - Hidden if PJ disabled */}
          {isPJEnabled && (
            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setCategoryTab('PF')}
                className={`flex-1 sm:flex-none px-6 py-1.5 text-xs font-bold rounded-md transition-all ${
                  categoryTab === 'PF' 
                    ? 'bg-white text-brand-pf shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pessoa Física
              </button>
              <button
                onClick={() => setCategoryTab('PJ')}
                className={`flex-1 sm:flex-none px-6 py-1.5 text-xs font-bold rounded-md transition-all ${
                  categoryTab === 'PJ' 
                    ? 'bg-white text-brand-pj shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pessoa Jurídica
              </button>
            </div>
          )}
        </div>
        
        {filteredCategoryData.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
               <Tags size={32} className="mb-2 opacity-30" />
               <p className="text-sm">Nenhuma despesa registrada para {(!isPJEnabled || categoryTab === 'PF') ? 'Pessoa Física' : 'Pessoa Jurídica'}.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left: Pie Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {filteredCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Right: Detailed List */}
              <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {filteredCategoryData.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                         <div 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                         ></div>
                         <span className="text-sm font-medium text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        )}
      </div>

      {/* Credit Card Expenses Section */}
      {cardExpenses.length > 0 && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>

          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
             <CreditCard className="text-rose-500" size={20} />
             Gastos por Cartão de Crédito
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {cardExpenses.map(card => (
              <div key={card.id} className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${card.accountType === 'PF' ? 'bg-brand-pf/10 text-brand-pf' : 'bg-brand-pj/10 text-brand-pj'}`}>
                      {card.accountType}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm">{card.name}</h4>
                      <p className="text-[10px] text-slate-400">Venc. dia {card.dueDay}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-rose-400">{formatCurrency(card.totalSpent)}</span>
                  </div>
                </div>

                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Comprometido</span>
                    <span className="font-medium text-slate-300">{card.percentageUsed.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${card.percentageUsed > 80 ? 'bg-rose-500' : 'bg-brand-primary'}`}
                      style={{ width: `${Math.min(card.percentageUsed, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>Disponível: {formatCurrency(card.limit - card.totalSpent)}</span>
                    <span>Limite: {formatCurrency(card.limit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW SECTION: Goals Summary (Dark Theme) */}
      {goals.length > 0 && (
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="text-brand-primary" size={20} />
                  Resumo de Metas
              </h3>
              <div className="flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 backdrop-blur-sm">
                  <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Acumulado</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(goalsMetrics.totalCurrent)}</p>
                  </div>
                   <div className="w-px h-8 bg-slate-700"></div>
                   <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Falta</p>
                      <p className="text-lg font-bold text-slate-200">{formatCurrency(Math.max(0, goalsMetrics.totalTarget - goalsMetrics.totalCurrent))}</p>
                  </div>
              </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {goals.slice(0, 3).map(goal => {
                  const percentage = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
                  return (
                      <div key={goal.id} className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-semibold text-slate-100 truncate pr-2">{goal.name}</span>
                              <span className="text-xs font-bold text-slate-400">{percentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 mb-2 border border-slate-700/50">
                              <div 
                                  className="bg-brand-primary h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                  style={{ width: `${percentage}%` }}
                              ></div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-400">
                              <span>{formatCurrency(goal.currentAmount)}</span>
                              <span>de {formatCurrency(goal.targetAmount)}</span>
                          </div>
                      </div>
                  );
              })}
               {goals.length > 3 && (
                   <div className="flex items-center justify-center p-4 border border-dashed border-slate-700 bg-slate-800/30 rounded-xl text-slate-500 text-sm hover:text-slate-300 transition-colors">
                       + {goals.length - 3} outras metas
                   </div>
               )}
          </div>
        </div>
      )}

      {/* Recurring Transactions Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
           <Repeat className="text-brand-primary" size={20} />
           Recorrências Mensais
        </h3>
        
        <div className={`grid grid-cols-1 ${isPJEnabled ? 'md:grid-cols-2' : ''} gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100`}>
          {/* PF Section */}
          <div className="space-y-4 pt-4 md:pt-0">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-pf"></div>
                  <h4 className="text-xs font-bold text-brand-pf uppercase tracking-wider">Pessoa Física</h4>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${recurringData.pfTotal >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {formatCurrency(recurringData.pfTotal)}
                </span>
             </div>
             <RecurringList list={recurringData.pf} type="PF" />
          </div>

          {/* PJ Section - Only show if enabled */}
          {isPJEnabled && (
            <div className="space-y-4 pt-4 md:pt-0 md:pl-8">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-pj"></div>
                    <h4 className="text-xs font-bold text-brand-pj uppercase tracking-wider">Pessoa Jurídica</h4>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${recurringData.pjTotal >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {formatCurrency(recurringData.pjTotal)}
                  </span>
               </div>
               <RecurringList list={recurringData.pj} type="PJ" />
            </div>
          )}
        </div>
      </div>

       {/* Modal de Detalhes do Dia */}
      <DayDetailModal 
        isOpen={isDayDetailModalOpen}
        onClose={() => setIsDayDetailModalOpen(false)}
        day={selectedDayData.day}
        transactions={selectedDayData.transactions}
        monthName={currentMonth.toLocaleString('pt-BR', { month: 'long' })}
      />
    </div>
  );
};