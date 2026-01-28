
import React, { useEffect, useState } from 'react';
import { X, CreditCard, Banknote, Landmark } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType, AccountType, PaymentMethod } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
  defaultIsRecurring?: boolean; // Define o comportamento implícito
}

export const TransactionModal: React.FC<Props> = ({ isOpen, onClose, editTransaction, defaultIsRecurring = false }) => {
  const { addTransaction, updateTransaction, categories, cards, bankAccounts, isPJEnabled } = useFinance();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [accountType, setAccountType] = useState<AccountType>('PF');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DEBIT');
  const [category, setCategory] = useState('');
  const [cardId, setCardId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  
  // O estado isRecurring existe, mas não é exposto visualmente para edição
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setDate(editTransaction.date);
      setType(editTransaction.type);
      setAccountType(editTransaction.accountType);
      setPaymentMethod(editTransaction.paymentMethod || 'DEBIT');
      setCategory(editTransaction.category);
      setCardId(editTransaction.cardId || '');
      setBankAccountId(editTransaction.bankAccountId || '');
      setIsRecurring(editTransaction.isRecurring || false);
    } else {
      // Defaults
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setType('EXPENSE');
      setAccountType('PF'); // Default sempre PF
      setPaymentMethod('DEBIT');
      setCategory('');
      setCardId('');
      setBankAccountId('');
      // Define recorrência baseado puramente na prop (Aba de origem)
      setIsRecurring(defaultIsRecurring);
    }
  }, [editTransaction, isOpen, defaultIsRecurring]);

  if (!isOpen) return null;

  // Filter categories based on context
  const availableCategories = categories.filter(
    (c) => 
      c.type === type && 
      (c.accountContext === 'BOTH' || c.accountContext === accountType)
  );

  // Filter cards based on account type
  const availableCards = cards.filter(c => c.accountType === accountType);

  // Filter banks based on account type
  const availableBanks = bankAccounts.filter(b => b.accountType === accountType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      description,
      amount: parseFloat(amount),
      date,
      type,
      accountType: isPJEnabled ? accountType : 'PF', // Garante PF se PJ estiver desativado
      paymentMethod,
      category: category || 'Outros',
      isRecurring, // Valor determinado logicamente, não por input do usuário
      cardId: (paymentMethod === 'CREDIT' && type === 'EXPENSE') ? cardId : undefined,
      bankAccountId: (paymentMethod === 'DEBIT' && bankAccountId) ? bankAccountId : undefined
    };

    if (editTransaction) {
      updateTransaction({ ...payload, id: editTransaction.id, isTransfer: editTransaction.isTransfer });
    } else {
      addTransaction(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {editTransaction ? 'Editar Transação' : (defaultIsRecurring ? 'Nova Recorrência' : 'Nova Transação')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                if (paymentMethod === 'CREDIT') setPaymentMethod('DEBIT'); // Force Debit on Income
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Receita
            </button>
          </div>

          <div className="flex gap-4">
             {/* Account Type - Só mostra se PJ habilitado */}
             {isPJEnabled ? (
               <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-slate-500">Conta</label>
                  <div className="flex flex-col gap-2">
                      <label className={`cursor-pointer border rounded-lg p-2 flex items-center gap-2 transition-all ${accountType === 'PF' ? 'border-brand-pf bg-brand-pf/5 text-brand-pf' : 'border-slate-200 text-slate-400'}`}>
                          <input 
                              type="radio" 
                              name="accountType" 
                              className="hidden" 
                              checked={accountType === 'PF'}
                              onChange={() => {
                                setAccountType('PF');
                                setCardId(''); 
                                setBankAccountId('');
                              }} 
                          />
                          <span className="text-sm font-bold">PF</span>
                      </label>
                      <label className={`cursor-pointer border rounded-lg p-2 flex items-center gap-2 transition-all ${accountType === 'PJ' ? 'border-brand-pj bg-brand-pj/5 text-brand-pj' : 'border-slate-200 text-slate-400'}`}>
                          <input 
                              type="radio" 
                              name="accountType" 
                              className="hidden" 
                              checked={accountType === 'PJ'}
                              onChange={() => {
                                setAccountType('PJ');
                                setCardId(''); 
                                setBankAccountId('');
                              }} 
                          />
                          <span className="text-sm font-bold">PJ</span>
                      </label>
                  </div>
               </div>
             ) : (
               <input type="hidden" name="accountType" value="PF" />
             )}

             {/* Payment Method */}
             <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-slate-500">Pagamento</label>
                <div className="flex flex-col gap-2">
                    <label className={`cursor-pointer border rounded-lg p-2 flex items-center gap-2 transition-all ${paymentMethod === 'DEBIT' ? 'border-slate-800 bg-slate-100 text-slate-800' : 'border-slate-200 text-slate-400'}`}>
                        <input 
                            type="radio" 
                            name="paymentMethod" 
                            className="hidden" 
                            checked={paymentMethod === 'DEBIT'}
                            onChange={() => setPaymentMethod('DEBIT')} 
                        />
                        <Banknote size={16} />
                        <span className="text-sm">Débito</span>
                    </label>
                    <label className={`cursor-pointer border rounded-lg p-2 flex items-center gap-2 transition-all ${paymentMethod === 'CREDIT' ? 'border-slate-800 bg-slate-100 text-slate-800' : 'border-slate-200 text-slate-400'}`}>
                        <input 
                            type="radio" 
                            name="paymentMethod" 
                            className="hidden" 
                            checked={paymentMethod === 'CREDIT'}
                            onChange={() => {
                              setPaymentMethod('CREDIT');
                              setType('EXPENSE'); // Force Expense on Credit
                            }} 
                        />
                        <CreditCard size={16} />
                        <span className="text-sm">Crédito</span>
                    </label>
                </div>
             </div>
          </div>

          {/* Card Selection Logic */}
          {paymentMethod === 'CREDIT' && type === 'EXPENSE' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-medium text-slate-500 mb-1">Selecione o Cartão</label>
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition-all"
              >
                <option value="">Selecione um cartão...</option>
                {availableCards.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Venc. {c.dueDay})</option>
                ))}
              </select>
              {availableCards.length === 0 && (
                <p className="text-[10px] text-rose-500 mt-1">Nenhum cartão {accountType} cadastrado.</p>
              )}
            </div>
          )}

          {/* Bank Selection Logic (New) */}
          {paymentMethod === 'DEBIT' && (
             <div className="animate-fade-in">
                <label className="block text-xs font-medium text-slate-500 mb-1">Banco / Conta (Opcional)</label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition-all"
                  >
                    <option value="">Sem vínculo bancário</option>
                    {availableBanks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                {availableBanks.length === 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">Nenhuma conta {accountType} cadastrada. <a href="#/bank-accounts" className="underline">Criar agora</a></p>
                )}
             </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
              placeholder="Ex: Almoço de negócios"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                >
                <option value="" disabled>Selecione</option>
                {availableCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                <option value="Outros">Outros</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {isRecurring ? 'Primeiro Vencimento' : 'Data'}
                </label>
                <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-dark text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            {isRecurring ? 'Salvar Recorrência' : 'Salvar Transação'}
          </button>
        </form>
      </div>
    </div>
  );
};
