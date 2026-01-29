
import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Link } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { User, Building2, Wallet, TrendingUp, TrendingDown, CreditCard, Landmark, ArrowRight, ShieldCheck, Target, Lock } from 'lucide-react';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const AccountsDashboard: React.FC = () => {
  const { transactions, bankAccounts, cards, isPJEnabled, getBankBalance, goals } = useFinance();
  const [activeTab, setActiveTab] = useState<'PF' | 'PJ'>('PF');

  // --- MÉTICAS DA CONTA SELECIONADA ---
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transactionBalanceDelta = 0;

    // Filtro inicial por conta
    const accountTransactions = transactions.filter(t => t.accountType === activeTab);

    accountTransactions.forEach(t => {
      // Cálculo do Saldo Líquido (Considera TUDO: Transferências, Genéricas, Bancárias)
      const val = t.type === 'INCOME' ? t.amount : -t.amount;
      transactionBalanceDelta += val;

      // Fluxo Econômico (Receita vs Despesa)
      // NA VISÃO INDIVIDUAL: Transferências contam como entrada ou saída.
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    // Soma dos saldos iniciais dos bancos desta categoria
    const initialBankBalance = bankAccounts
      .filter(b => b.accountType === activeTab)
      .reduce((acc, b) => acc + b.initialBalance, 0);

    // Saldo Final = Saldo Inicial dos Bancos + Movimentação Total das Transações
    // Este é o saldo "Líquido/Disponível", pois as saídas para metas (investimentos) já foram descontadas nas transações
    const availableBalance = initialBankBalance + transactionBalanceDelta;

    return { income, expense, availableBalance };
  }, [transactions, activeTab, bankAccounts]);

  // --- CÁLCULO DE METAS ---
  const goalsTotal = useMemo(() => {
    return goals
      .filter(g => g.accountType === activeTab || (!g.accountType && activeTab === 'PF'))
      .reduce((acc, g) => acc + g.currentAmount, 0);
  }, [goals, activeTab]);

  // Patrimônio Total = Dinheiro Disponível + Dinheiro em Metas
  const totalNetWorth = metrics.availableBalance + goalsTotal;

  // --- CARTÕES DE CRÉDITO ---
  const filteredCards = useMemo(() => {
    return cards.filter(c => c.accountType === activeTab);
  }, [cards, activeTab]);

  const cardMetrics = useMemo(() => {
    return filteredCards.map(card => {
      const totalSpent = transactions
        .filter(t => t.paymentMethod === 'CREDIT' && t.cardId === card.id && t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        ...card,
        used: totalSpent,
        available: card.limit - totalSpent
      };
    });
  }, [filteredCards, transactions]);

  // --- BANCOS E SOMA TOTAL ---
  const filteredBanks = useMemo(() => {
    return bankAccounts.filter(b => b.accountType === activeTab);
  }, [bankAccounts, activeTab]);

  // Calcula a soma total dos saldos dos bancos filtrados para exibição no container
  const totalBankBalance = useMemo(() => {
    return filteredBanks.reduce((acc, bank) => acc + getBankBalance(bank.id), 0);
  }, [filteredBanks, getBankBalance]);

  // --- METAS FILTRADAS (Lista) ---
  const filteredGoals = useMemo(() => {
    return goals.filter(g => g.accountType === activeTab || (!g.accountType && activeTab === 'PF'));
  }, [goals, activeTab]);

  // --- GRÁFICO DE CATEGORIAS DA CONTA ---
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    
    // Inclui transferências no gráfico de despesas da conta individual para ver para onde foi o dinheiro
    transactions
      .filter(t => t.accountType === activeTab && t.type === 'EXPENSE') 
      .forEach(t => {
        const cat = t.category || 'Outros';
        map[cat] = (map[cat] || 0) + t.amount;
      });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [transactions, activeTab]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header e Abas */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('PF')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'PF' 
                ? 'bg-white text-brand-pf shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={18} />
            Pessoa Física
          </button>
          {isPJEnabled && (
            <button
              onClick={() => setActiveTab('PJ')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'PJ' 
                  ? 'bg-white text-brand-pj shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 size={18} />
              Pessoa Jurídica
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Específicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Saldo Calculado (Patrimônio Total) - ATUALIZADO */}
        <div className={`p-6 rounded-2xl text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-40 ${activeTab === 'PF' ? 'bg-gradient-to-br from-brand-pf to-violet-700' : 'bg-gradient-to-br from-brand-pj to-sky-700'}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
          
          <div>
            <div className="flex items-center gap-2 relative z-10 mb-1">
              <Wallet className="w-5 h-5 text-white/80" />
              <span className="text-sm font-medium text-white/80">Saldo Calculado (Total)</span>
            </div>
            <div className="text-3xl font-bold relative z-10">{formatCurrency(totalNetWorth)}</div>
          </div>

          {/* Separador de Metas vs Disponível */}
          <div className="relative z-10 mt-2 pt-3 border-t border-white/20 grid grid-cols-2 gap-4">
             <div>
                <span className="text-[10px] text-white/60 block uppercase tracking-wider font-bold">Disponível</span>
                <span className="text-sm font-bold">{formatCurrency(metrics.availableBalance)}</span>
             </div>
             <div className="text-right">
                <span className="text-[10px] text-white/60 block uppercase tracking-wider font-bold flex items-center justify-end gap-1">
                   <Lock size={10} /> Em Metas
                </span>
                <span className="text-sm font-bold text-white/90">{formatCurrency(goalsTotal)}</span>
             </div>
          </div>
        </div>

        {/* Receitas (Fluxo) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={16} /></div>
              <span className="text-sm font-medium text-slate-500">Entradas Totais</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.income)}</div>
          </div>
          <div className="w-full bg-slate-50 h-1.5 rounded-full mt-2">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Despesas (Fluxo) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600"><TrendingDown size={16} /></div>
              <span className="text-sm font-medium text-slate-500">Saídas Totais</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.expense)}</div>
          </div>
          <div className="w-full bg-slate-50 h-1.5 rounded-full mt-2">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna Esquerda: Bancos, Cartões e Metas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Seção Bancos */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             {/* HEADER ATUALIZADO COM SOMA TOTAL */}
             <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Landmark size={18} className="text-slate-500" /> 
                    Contas Bancárias ({activeTab})
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium ml-6">
                    {filteredBanks.length} conta(s) vinculada(s)
                  </span>
               </div>
               
               <div className="text-right bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                 <span className="block text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total em Bancos</span>
                 <span className={`text-sm font-bold ${totalBankBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                   {formatCurrency(totalBankBalance)}
                 </span>
               </div>
             </div>

             <div className="divide-y divide-slate-100">
               {filteredBanks.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 text-sm">Nenhuma conta bancária vinculada.</div>
               ) : (
                 filteredBanks.map(bank => (
                   <div key={bank.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: bank.color }}>
                            <Landmark size={18} />
                         </div>
                         <div>
                           <p className="font-bold text-slate-700">{bank.name}</p>
                           <p className="text-xs text-slate-400">Conta Corrente</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`font-bold ${getBankBalance(bank.id) >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                           {formatCurrency(getBankBalance(bank.id))}
                         </p>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>

          {/* Seção Cartões */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <CreditCard size={18} className="text-slate-500" /> 
                 Cartões de Crédito ({activeTab})
               </h3>
               <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                 {filteredCards.length} Cartões
               </span>
             </div>
             <div className="divide-y divide-slate-100">
               {cardMetrics.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 text-sm">Nenhum cartão de crédito vinculado.</div>
               ) : (
                 cardMetrics.map(card => (
                   <div key={card.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                           <div className="bg-slate-100 p-2 rounded text-slate-600"><CreditCard size={20} /></div>
                           <div>
                              <p className="font-bold text-slate-700">{card.name}</p>
                              <p className="text-xs text-slate-400">Vence dia {card.dueDay}</p>
                           </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xs text-slate-400">Limite Utilizado</p>
                            <p className="font-bold text-rose-600">{formatCurrency(card.used)}</p>
                         </div>
                      </div>
                      {/* Barra de Limite */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-rose-500 rounded-full" 
                          style={{ width: `${Math.min(100, (card.used / card.limit) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                        <span>Disponível: {formatCurrency(card.available)}</span>
                        <span>Limite: {formatCurrency(card.limit)}</span>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>
          
           {/* Seção Metas (NOVO) */}
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Target size={18} className="text-slate-500" /> 
                 Metas Financeiras ({activeTab})
               </h3>
               <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                 {filteredGoals.length} Metas
               </span>
             </div>
             <div className="divide-y divide-slate-100">
               {filteredGoals.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 text-sm">
                   Nenhuma meta definida para esta conta. 
                   <Link to="/goals" className="block mt-1 text-brand-primary hover:underline">Criar nova meta</Link>
                 </div>
               ) : (
                 filteredGoals.map(goal => {
                    const percentage = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
                    return (
                        <div key={goal.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-slate-700">{goal.name}</span>
                                <span className="text-xs text-slate-500">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ${activeTab === 'PF' ? 'bg-brand-pf' : 'bg-brand-pj'}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                             <div className="mt-1 text-right">
                                <span className="text-[10px] font-bold text-slate-400">{percentage.toFixed(0)}%</span>
                             </div>
                        </div>
                    );
                 })
               )}
             </div>
          </div>

        </div>

        {/* Coluna Direita: Gráficos e Insights */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
              <h3 className="font-bold text-slate-800 mb-4 text-center">Top Despesas ({activeTab})</h3>
              <div className="flex-1 min-h-[250px]">
                 {categoryChartData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                     Sem despesas registradas.
                   </div>
                 )}
              </div>
           </div>

           {/* Card Informativo */}
           <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                 <ShieldCheck className="w-8 h-8 text-emerald-400 mb-3" />
                 <h4 className="font-bold text-lg mb-1">Dica Financeira</h4>
                 <p className="text-sm text-slate-300">
                   {activeTab === 'PJ' 
                     ? 'Mantenha as despesas pessoais fora da conta PJ para facilitar a contabilidade e evitar problemas fiscais.'
                     : 'Tente manter suas despesas essenciais abaixo de 50% da sua renda mensal para garantir saúde financeira.'}
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
