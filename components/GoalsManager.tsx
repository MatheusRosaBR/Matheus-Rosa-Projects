
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { AccountType, Goal } from '../types';
import { Target, Plus, Edit2, Trash2, X, TrendingUp, Calendar, Trophy, Coins, CheckCircle2, User, Building2, Landmark } from 'lucide-react';

export const GoalsManager: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, addFundsToGoal, bankAccounts, isPJEnabled } = useFinance();
  
  // Modals State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isUpdateBalanceOpen, setIsUpdateBalanceOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoalForUpdate, setSelectedGoalForUpdate] = useState<Goal | null>(null);

  // Form States (Goal Create/Edit)
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PF');
  
  // Update Balance Specific State
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceBankId, setSourceBankId] = useState('');
  const [sourceAccountType, setSourceAccountType] = useState<AccountType>('PF');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (iso: string) => {
    if (!iso) return 'Sem prazo';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const calculateDaysRemaining = (iso?: string) => {
    if (!iso) return null;
    const target = new Date(iso);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // --- CRUD Logic ---

  const handleOpenGoalModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setDeadline(goal.deadline || '');
      setAccountType(goal.accountType || 'PF');
    } else {
      setEditingGoal(null);
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline('');
      setAccountType('PF');
    }
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    const payload = {
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: deadline || undefined,
      accountType
    };

    if (editingGoal) {
      updateGoal({ ...payload, id: editingGoal.id });
    } else {
      addGoal(payload);
    }
    setIsGoalModalOpen(false);
  };

  const handleOpenUpdateBalance = (goal: Goal) => {
    setSelectedGoalForUpdate(goal);
    setBalanceAdjustment('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    // Pre-select account type based on goal
    setSourceAccountType(goal.accountType || 'PF');
    setSourceBankId('');
    setIsUpdateBalanceOpen(true);
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForUpdate || !balanceAdjustment) return;

    const adjustment = parseFloat(balanceAdjustment);
    
    // Call the new function that handles both Goal Update and Transaction creation
    addFundsToGoal(
        selectedGoalForUpdate.id,
        adjustment,
        transactionDate,
        sourceBankId || undefined,
        sourceAccountType
    );
    
    setIsUpdateBalanceOpen(false);
  };

  // Filter banks for the selected source account type
  const availableBanks = bankAccounts.filter(b => b.accountType === sourceAccountType);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-brand-primary" />
            Metas & Objetivos
          </h2>
          <p className="text-sm text-slate-500 mt-1">Defina seus sonhos e acompanhe o progresso financeiro por conta.</p>
        </div>
        <button
          onClick={() => handleOpenGoalModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-sm shadow-lg shadow-slate-900/20 active:scale-95"
        >
          <Plus size={18} />
          Nova Meta
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
           <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
             <Trophy size={48} className="mb-4 opacity-50 text-brand-primary" />
             <h3 className="text-lg font-semibold text-slate-600">Nenhuma meta definida</h3>
             <p className="text-sm mt-1 max-w-sm text-center">Comece a planejar sua viagem, compra de carro ou reserva de emergência agora mesmo.</p>
           </div>
        ) : (
          goals.map(goal => {
            const percentage = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));
            const daysLeft = calculateDaysRemaining(goal.deadline);
            const isCompleted = percentage >= 100;

            return (
              <div key={goal.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                {isCompleted && (
                  <div className="absolute top-0 right-0 p-2 bg-emerald-100 rounded-bl-xl z-10">
                    <CheckCircle2 className="text-emerald-600 w-5 h-5" />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mr-2">{goal.name}</h3>
                  </div>

                  {/* Account Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      goal.accountType === 'PF' ? 'bg-brand-pf/10 text-brand-pf' : 'bg-brand-pj/10 text-brand-pj'
                    }`}>
                      {goal.accountType === 'PF' ? <User size={10} /> : <Building2 size={10} />}
                      Conta {goal.accountType}
                    </span>
                  </div>
                  
                  {/* Amount Display */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-slate-800">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-xs text-slate-400 ml-2">de {formatCurrency(goal.targetAmount)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500' : (goal.accountType === 'PJ' ? 'bg-brand-pj' : 'bg-brand-pf')}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs font-medium mb-6">
                    <span className={isCompleted ? 'text-emerald-600' : 'text-slate-600'}>
                      {percentage.toFixed(1)}% Completo
                    </span>
                    {goal.deadline ? (
                      <span className={`flex items-center gap-1 ${daysLeft && daysLeft < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                         <Calendar size={12} />
                         {daysLeft && daysLeft < 0 ? 'Expirado' : formatDate(goal.deadline)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Sem prazo</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => handleOpenUpdateBalance(goal)}
                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-95"
                  >
                    <TrendingUp size={14} />
                    Atualizar Saldo
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenGoalModal(goal)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create/Edit Goal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </h2>
              <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              
              {/* Account Type Selection */}
              {isPJEnabled && (
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAccountType('PF')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                      accountType === 'PF' ? 'bg-white text-brand-pf shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Pessoa Física
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('PJ')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                      accountType === 'PJ' ? 'bg-white text-brand-pj shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Pessoa Jurídica
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Objetivo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                  placeholder="Ex: Viagem para Europa"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Valor Alvo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                  placeholder="0,00"
                />
              </div>
              {!editingGoal && (
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Saldo Inicial (Opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                      placeholder="0,00"
                    />
                 </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Prazo (Opcional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Deixe em branco para meta sem prazo definido.</p>
              </div>
              <button
                type="submit"
                className="w-full bg-brand-dark text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Salvar Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Balance (With Transaction Logic) */}
      {isUpdateBalanceOpen && selectedGoalForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-fade-in">
             <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Coins className="text-brand-primary" size={20}/>
                Atualizar Saldo
              </h2>
              <button onClick={() => setIsUpdateBalanceOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveBalance} className="p-6 space-y-4">
               
               <div>
                 <p className="text-sm text-slate-600 mb-4">
                   Quanto você quer adicionar (ou remover) da meta <span className="font-bold text-slate-800">{selectedGoalForUpdate.name}</span>?
                 </p>
                 
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                   <input
                    type="number"
                    step="0.01"
                    autoFocus
                    required
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-lg font-bold text-slate-800 focus:ring-2 focus:ring-brand-primary outline-none"
                    placeholder="0,00"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Valores positivos criam despesas (aporte). Negativos criam receitas (resgate).</p>
                 </div>
               </div>

               {/* Source Account Type */}
               {isPJEnabled && (
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Conta de Origem/Destino</label>
                   <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => { setSourceAccountType('PF'); setSourceBankId(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${
                        sourceAccountType === 'PF' ? 'bg-white text-brand-pf shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Pessoa Física
                    </button>
                    <button
                        type="button"
                        onClick={() => { setSourceAccountType('PJ'); setSourceBankId(''); }}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${
                        sourceAccountType === 'PJ' ? 'bg-white text-brand-pj shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Pessoa Jurídica
                    </button>
                   </div>
                </div>
               )}

               {/* Bank Selection */}
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Banco (Opcional)</label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                        value={sourceBankId}
                        onChange={(e) => setSourceBankId(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-slate-800 outline-none"
                    >
                        <option value="">Carteira / Caixa</option>
                        {availableBanks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                  </div>
               </div>

               <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data da Transação</label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-slate-800"
                />
               </div>

               <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500">Saldo Atual</div>
                  <div className="font-bold text-slate-700">{formatCurrency(selectedGoalForUpdate.currentAmount)}</div>
               </div>

               <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Confirmar Transação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
