
import React, { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Link } from 'react-router-dom';
import { 
  Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Scale, Globe, ArrowUpRight, CalendarClock, CreditCard, Repeat, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../types';
import { DayDetailModal } from './DayDetailModal';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const Dashboard: React.FC = () => {
  const { transactions, isPJEnabled, bankAccounts, cards } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State para o modal de detalhes do dia
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{ day: string; transactions: Transaction[] }>({ day: '', transactions: [] });

  // --- KPI GLOBAL ---
  const globalMetrics = useMemo(() => {
    // 1. Saldo Inicial de todos os bancos
    const totalInitialBankBalance = bankAccounts.reduce((acc, bank) => acc + bank.initialBalance, 0);

    // 2. Saldo de todas as movimentações (Income - Expense)
    let netTransactionBalance = 0;
    
    // 3. Métricas de Fluxo do Mês
    let monthIncome = 0;
    let monthExpense = 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    transactions.forEach(t => {
      // Saldo Geral: Considera TUDO para o patrimônio líquido (incluindo transações sem banco)
      // Se for uma transferência interna genérica (sem banco), ela sai de um lado e entra no outro.
      // O saldo líquido da transação será 0 no total (Ex: -3000 + 3000 = 0), o que está correto para visão global.
      // Se for uma entrada externa genérica, soma.
      const val = t.type === 'INCOME' ? t.amount : -t.amount;
      netTransactionBalance += val;

      // Métricas de Fluxo (Receita/Despesa Mês)
      // AQUI mantemos a lógica de ignorar transferências para não duplicar o volume movimentado
      const tDate = new Date(t.date);
      const adjustedDate = new Date(tDate.getTime() + tDate.getTimezoneOffset() * 60000);
      
      if (adjustedDate >= startOfMonth && adjustedDate <= endOfMonth && !t.isTransfer) {
        if (t.type === 'INCOME') monthIncome += t.amount;
        else monthExpense += t.amount;
      }
    });

    return { 
      totalBalance: totalInitialBankBalance + netTransactionBalance, 
      monthIncome, 
      monthExpense 
    };
  }, [bankAccounts, transactions]);


  // --- DADOS DO MÊS SELECIONADO (GRÁFICO) ---
  const monthlyData = useMemo(() => {
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
    
    const daysInMonth = endDate.getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: (i + 1).toString().padStart(2, '0'),
      income: 0,
      expense: 0,
    }));

    monthTransactions.forEach(t => {
      if (t.isTransfer) return;

      const tDate = new Date(t.date);
      const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
      const dayOfMonth = adjustedDate.getDate() - 1;

      if (dailyData[dayOfMonth]) {
        if (t.type === 'INCOME') dailyData[dayOfMonth].income += t.amount;
        else dailyData[dayOfMonth].expense += t.amount;
      }
    });

    return dailyData;
  }, [transactions, currentMonth]);

  // --- COMPOSIÇÃO DE GASTOS GLOBAL (PIE) ---
  const globalCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'EXPENSE' && !t.isTransfer)
      .forEach(t => {
        const cat = t.category || 'Outros';
        map[cat] = (map[cat] || 0) + t.amount;
      });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categorias
  }, [transactions]);

  // --- PRÓXIMOS VENCIMENTOS (Recorrências + Faturas) ---
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    const billsMap = new Map<string, { date: Date, total: number, items: Array<{ name: string, amount: number, type: 'CARD' | 'RECURRING', account: string }> }>();

    // 1. Processar Recorrências
    transactions.filter(t => t.isRecurring && t.type === 'EXPENSE').forEach(t => {
      const originalDate = new Date(t.date);
      // Pega o dia da recorrência
      const day = originalDate.getDate() + 1; // Ajuste simples de fuso para pegar o dia correto visualmente
      
      // Determina a data de vencimento neste mês
      let nextDate = new Date(today.getFullYear(), today.getMonth(), day);
      
      // Se já passou hoje, joga para o próximo mês
      if (nextDate < today) {
        nextDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
      }

      // Se estiver dentro dos próximos 30 dias
      if (nextDate <= next30Days) {
        const key = nextDate.toISOString().split('T')[0];
        const existing = billsMap.get(key) || { date: nextDate, total: 0, items: [] };
        
        existing.total += t.amount;
        existing.items.push({
          name: t.description,
          amount: t.amount,
          type: 'RECURRING',
          account: t.accountType
        });
        
        billsMap.set(key, existing);
      }
    });

    // 2. Processar Cartões de Crédito (Faturas)
    cards.forEach(card => {
      // Determina a próxima data de vencimento
      let nextDueDate = new Date(today.getFullYear(), today.getMonth(), card.dueDay);
      if (nextDueDate < today) {
        nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, card.dueDay);
      }

      // Calcula valor estimado (Soma de gastos no crédito no ciclo "atual" aproximado)
      // Simplificação: Soma gastos de crédito não pagos ou recentes
      const cardExpenses = transactions
        .filter(t => t.paymentMethod === 'CREDIT' && t.cardId === card.id && t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0);
      
      // Apenas adiciona se houver valor e estiver na janela de 30 dias
      if (cardExpenses > 0 && nextDueDate <= next30Days) {
        const key = nextDueDate.toISOString().split('T')[0];
        const existing = billsMap.get(key) || { date: nextDueDate, total: 0, items: [] };
        
        existing.total += cardExpenses; // Valor total acumulado do cartão (Simplificado)
        existing.items.push({
          name: `Fatura ${card.name}`,
          amount: cardExpenses,
          type: 'CARD',
          account: card.accountType
        });
        
        billsMap.set(key, existing);
      }
    });

    // Converter Map para Array e Ordenar
    return Array.from(billsMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5); // Pegar os top 5 dias

  }, [transactions, cards]);


  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

  const handlePreviousMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const isNextMonthDisabled = useMemo(() => {
    const today = new Date();
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return next > today;
  }, [currentMonth]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* GLOBAL HERO SECTION */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-pf/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
               <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Globe size={20} />
                  <span className="text-sm font-medium uppercase tracking-widest">Visão Consolidada</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-bold mb-4">{formatCurrency(globalMetrics.totalBalance)}</h1>
               <p className="text-slate-400 text-sm max-w-md">
                 Este é o seu patrimônio líquido total somando todas as contas (Pessoa Física e Jurídica), incluindo saldos bancários e valores em trânsito.
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-emerald-400">
                     <TrendingUp size={16} />
                     <span className="text-xs font-bold uppercase">Entradas (Mês)</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(globalMetrics.monthIncome)}</p>
               </div>
               <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-rose-400">
                     <TrendingDown size={16} />
                     <span className="text-xs font-bold uppercase">Saídas (Mês)</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(globalMetrics.monthExpense)}</p>
               </div>
            </div>
         </div>
      </div>

      {/* FLUXO DE CAIXA GLOBAL */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
               <h3 className="text-lg font-bold text-slate-800">Fluxo de Caixa Global</h3>
               <p className="text-sm text-slate-500">Entradas vs Saídas de todas as contas (Exclui transferências internas)</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <button onClick={handlePreviousMonth} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors"><ChevronLeft size={16} /></button>
                <span className="text-sm font-bold text-slate-700 w-32 text-center capitalize">
                    {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={handleNextMonth} disabled={isNextMonthDisabled} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
        </div>

        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis tickFormatter={(val) => `R$ ${val/1000}k`} tick={{ fontSize: 12 }} stroke="#64748b" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" name="Receitas" strokeWidth={2} />
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" name="Despesas" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* COMPOSIÇÃO, PRÓXIMOS VENCIMENTOS E CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* 1. Categorias */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Onde você gasta? (Top 5)</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={globalCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {globalCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                 </PieChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* 2. Próximos Vencimentos (NOVO CONTAINER) */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-2 mb-1">
                    <CalendarClock className="text-rose-500" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">Próximos Vencimentos</h3>
                </div>
                <p className="text-xs text-slate-500">Contas e faturas para os próximos 30 dias</p>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[400px] p-2 space-y-2">
                {upcomingBills.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <CheckCircle2 size={32} className="mb-2 opacity-50 text-emerald-500" />
                        <p className="text-sm">Tudo em dia!</p>
                        <p className="text-xs mt-1">Nenhuma recorrência ou fatura prevista.</p>
                    </div>
                ) : (
                    upcomingBills.map((bill, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 p-4 rounded-xl hover:shadow-md transition-all hover:border-slate-200">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-rose-50 text-rose-600 font-bold text-xs px-2 py-1 rounded-md uppercase">
                                        {bill.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total do Dia</span>
                                </div>
                                <span className="font-bold text-slate-800">{formatCurrency(bill.total)}</span>
                            </div>
                            
                            <div className="space-y-2">
                                {bill.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm pl-2 border-l-2 border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {item.type === 'CARD' ? <CreditCard size={12} className="text-slate-400"/> : <Repeat size={12} className="text-slate-400"/>}
                                            <span className="text-slate-600 truncate max-w-[120px]" title={item.name}>{item.name}</span>
                                            <span className={`text-[10px] px-1 rounded ${item.account === 'PF' ? 'bg-brand-pf/10 text-brand-pf' : 'bg-brand-pj/10 text-brand-pj'}`}>
                                                {item.account}
                                            </span>
                                        </div>
                                        <span className="text-slate-500 text-xs">{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {upcomingBills.length > 0 && (
                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                    <Link to="/recurring" className="text-xs font-bold text-brand-primary hover:underline">Gerenciar Recorrências</Link>
                </div>
            )}
         </div>

         {/* 3. CTA Card */}
         <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            <Wallet size={48} className="text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">Detalhes por Conta</h3>
            <p className="text-slate-500 max-w-xs mb-6">
              Acesse a gestão individualizada para ver saldos bancários específicos, limites de cartão e despesas separadas por PF e PJ.
            </p>
            <Link to="/accounts" className="px-6 py-3 bg-white border border-slate-300 text-slate-800 font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2">
               Acessar Minhas Contas <ArrowUpRight size={18} />
            </Link>
         </div>
      </div>

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
