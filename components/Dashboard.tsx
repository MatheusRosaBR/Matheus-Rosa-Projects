
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Building2, User, CreditCard, Repeat, CalendarClock, Tags, Target, ChevronLeft, ChevronRight, Scale, Landmark, Filter, Check } from 'lucide-react';
import { Transaction } from '../types';
import { DayDetailModal } from './DayDetailModal';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const formatDateDay = (dateStr: string) => {
  const date = new Date(dateStr);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  return adjustedDate.getDate().toString().padStart(2, '0');
};

type PeriodOption = 'CURRENT' | 'LAST' | '3M' | '6M' | '12M';

export const Dashboard: React.FC = () => {
  const { transactions, goals, cards, isPJEnabled, bankAccounts, getBankBalance } = useFinance();
  const [categoryTab, setCategoryTab] = useState<'PF' | 'PJ'>('PF');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State para o modal de detalhes do dia
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{ day: string; transactions: Transaction[] }>({ day: '', transactions: [] });

  // State para Filtro do Gráfico de Despesas
  const [expensePeriod, setExpensePeriod] = useState<PeriodOption>('CURRENT');
  const [isExpenseFilterOpen, setIsExpenseFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Fechar o dropdown se clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsExpenseFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const monthTransactions = transactions.filter(t => {
      if (t.isRecurring) return false;
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

    const recurringExpenses = transactions.filter(t => t.isRecurring && t.type === 'EXPENSE');
    
    recurringExpenses.forEach(recTx => {
      const dayOfMonth = new Date(recTx.date).getUTCDate(); 
      const dayIndex = dayOfMonth - 1;

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

  // Lógica Específica para o Gráfico de Despesas por Conta com Filtro
  const expenseChartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Fim do mês atual por padrão
    let label = '';

    // Define as datas baseado no filtro
    switch (expensePeriod) {
      case 'CURRENT':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        label = 'Mês Atual';
        break;
      case 'LAST':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        label = 'Mês Passado';
        break;
      case '3M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        label = 'Últimos 3 Meses';
        break;
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        label = 'Últimos 6 Meses';
        break;
      case '12M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        label = 'Últimos 12 Meses';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Helper para converter string YYYY-MM-DD para Date com timezone correto para comparação
    const parseDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    let pfExpense = 0;
    let pjExpense = 0;

    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const tDate = parseDate(t.date);
      
      // Verifica se está dentro do período selecionado
      if (tDate >= startDate && tDate <= endDate) {
        if(t.accountType === 'PF') pfExpense += t.amount;
        else pjExpense += t.amount;
      }
    });

    const data = [
      { name: 'Despesas PF', value: pfExpense },
    ];
    
    if (isPJEnabled) {
      data.push({ name: 'Despesas PJ', value: pjExpense });
    }

    return { data, label };
  }, [transactions, isPJEnabled, expensePeriod]);

  // Gráfico antigo de métodos de pagamento (Mantido Global)
  const methodChartData = useMemo(() => {
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

    const data = [
      { name: 'Crédito', value: creditTotal },
      { name: 'Débito/Transf. (PF)', value: debitPfTotal },
    ];

    if (isPJEnabled) {
      data.push({ name: 'Débito/Transf. (PJ)', value: debitPjTotal });
    }

    return data;
  }, [transactions, isPJEnabled]);

  const categoryData = useMemo(() => {
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

    return Object.entries(categoriesMap)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

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

  const cardExpenses = useMemo(() => {
    if (cards.length === 0) return [];
    
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
    }).sort((a, b) => b.totalSpent - a.totalSpent);
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
  
  const RecurringList = ({ list, type }: { list: Transaction[], type: 'PF' | 'PJ' }) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 h-full">
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

      {/* Bank Balances Section */}
      {bankAccounts.length > 0 && (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            {bankAccounts.filter(b => isPJEnabled || b.accountType === 'PF').map(bank => {
                const balance = getBankBalance(bank.id);
                return (
                    <div key={bank.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: bank.color || '#cbd5e1' }}
                            ></div>
                            <span className="text-xs font-bold text-slate-500 uppercase">{bank.name}</span>
                        </div>
                        <div className={`text-lg font-bold ${balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                            {formatCurrency(balance)}
                        </div>
                         <span className="text-[10px] text-slate-400 mt-1">{bank.accountType}</span>
                    </div>
                );
            })}
         </div>
      )}
      
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
        
        {/* Chart 1: Despesas por Conta (Com Filtro de Período) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative z-20">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   Despesas por Conta
                </h3>
                <p className="text-xs text-slate-500">{expenseChartData.label}</p>
             </div>
             
             {/* Filter Dropdown */}
             <div className="relative" ref={filterRef}>
               <button 
                onClick={() => setIsExpenseFilterOpen(!isExpenseFilterOpen)}
                className={`p-2 rounded-lg transition-colors ${isExpenseFilterOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
               >
                 <Filter size={20} />
               </button>

               {isExpenseFilterOpen && (
                 <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-1 animate-fade-in z-50">
                    <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Período</p>
                    {[
                      { id: 'CURRENT', label: 'Mês Atual' },
                      { id: 'LAST', label: 'Mês Passado' },
                      { id: '3M', label: 'Últimos 3 Meses' },
                      { id: '6M', label: 'Últimos 6 Meses' },
                      { id: '12M', label: 'Últimos 12 Meses' },
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setExpensePeriod(option.id as PeriodOption);
                          setIsExpenseFilterOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                      >
                        {option.label}
                        {expensePeriod === option.id && <Check size={14} className="text-brand-primary" />}
                      </button>
                    ))}
                 </div>
               )}
             </div>
          </div>

          <div className="h-48 w-full flex-grow">
            {expenseChartData.data.reduce((acc, item) => acc + item.value, 0) === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <PieChart className="opacity-20 w-12 h-12 mb-2" />
                  <p className="text-sm">Sem dados neste período</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseChartData.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseChartData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Summary Totals */}
          <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
            {expenseChartData.data.map((entry, index) => (
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col z-10">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <CreditCard size={18} className="text-rose-500"/>
             Métodos de Pagamento (Total)
          </h3>
          <div className="h-48 w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                 <Pie
                  data={methodChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                   {methodChartData.map((entry, index) => (
                    <Cell key={`cell-m-${index}`} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Summary Totals */}
          <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
            {methodChartData.map((entry, index) => (
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

       {/* Recurring Section (Restored) */}
       <div className={`grid grid-cols-1 ${isPJEnabled ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* PF Recurring */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Repeat className="text-brand-pf" size={20}/> 
               Recorrências PF
             </h3>
             <span className={`text-xs font-bold px-2 py-1 rounded-lg ${recurringData.pfTotal < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
               Mensal: {formatCurrency(recurringData.pfTotal)}
             </span>
          </div>
          <RecurringList list={recurringData.pf} type="PF" />
        </div>

        {/* PJ Recurring */}
        {isPJEnabled && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <Repeat className="text-brand-pj" size={20}/> 
                 Recorrências PJ
               </h3>
               <span className={`text-xs font-bold px-2 py-1 rounded-lg ${recurringData.pjTotal < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                 Mensal: {formatCurrency(recurringData.pjTotal)}
               </span>
            </div>
            <RecurringList list={recurringData.pj} type="PJ" />
          </div>
        )}
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
