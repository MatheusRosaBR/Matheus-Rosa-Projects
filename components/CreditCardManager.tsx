import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { AccountType, CreditCard as ICreditCard } from '../types';
import { CreditCard, Plus, Calendar, Layers, Search, X, ShoppingBag, Trash2 } from 'lucide-react';

export const CreditCardManager: React.FC = () => {
  const { transactions, addInstallmentTransaction, categories, cards, addCard, deleteCard } = useFinance();
  
  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Purchase Form State
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PF');
  const [selectedCardId, setSelectedCardId] = useState('');

  // New Card Form State
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState(1);
  const [cardDueDay, setCardDueDay] = useState(10);
  const [cardAccountType, setCardAccountType] = useState<AccountType>('PF');

  // Filter existing credit transactions
  const creditTransactions = useMemo(() => {
    return transactions
      .filter(t => t.paymentMethod === 'CREDIT')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Calculations for next month estimate
  const nextMonthEstimate = useMemo(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7); // YYYY-MM

    return creditTransactions
      .filter(t => t.date.startsWith(nextMonthStr))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [creditTransactions]);

  const totalOutstanding = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return creditTransactions
      .filter(t => t.date >= todayStr)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [creditTransactions]);

  const availableCategories = categories.filter(
    (c) => c.type === 'EXPENSE' && (c.accountContext === 'BOTH' || c.accountContext === accountType)
  );

  // Filter cards available for selection based on Account Type
  const availableCards = cards.filter(c => c.accountType === accountType);

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !totalAmount) return;

    addInstallmentTransaction(
      {
        description,
        date,
        type: 'EXPENSE',
        accountType,
        paymentMethod: 'CREDIT',
        category: category || 'Outros',
        isRecurring: false,
        cardId: selectedCardId || undefined // Save the selected card ID
      },
      parseFloat(totalAmount),
      installments
    );

    setIsPurchaseModalOpen(false);
    setDescription('');
    setTotalAmount('');
    setInstallments(1);
    setCategory('');
    setSelectedCardId('');
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardLimit) return;

    addCard({
      name: cardName,
      limit: parseFloat(cardLimit),
      closingDay: cardClosingDay,
      dueDay: cardDueDay,
      accountType: cardAccountType
    });

    setIsCardModalOpen(false);
    setCardName('');
    setCardLimit('');
    setCardClosingDay(1);
    setCardDueDay(10);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Helper to get card name by ID
  const getCardName = (id?: string) => {
    if (!id) return '-';
    const card = cards.find(c => c.id === id);
    return card ? card.name : 'Desconhecido';
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-rose-500" />
            Cartões de Crédito
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie limites, faturas e compras parceladas.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm shadow-sm active:scale-95"
          >
            <CreditCard size={18} />
            <span className="hidden sm:inline">Cadastrar Cartão</span>
          </button>
          <button
            onClick={() => {
              // Reset selection when opening modal if needed, or keep logic simple
              if (availableCards.length > 0 && !selectedCardId) {
                 // Optional: Auto select first available card
              }
              setIsPurchaseModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-sm shadow-lg shadow-slate-900/20 active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Compra Parcelada</span>
          </button>
        </div>
      </div>

      {/* Cards Display Section */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.id} className="relative group overflow-hidden bg-slate-800 text-white p-6 rounded-2xl shadow-xl transition-transform hover:-translate-y-1">
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl opacity-50 ${card.accountType === 'PJ' ? 'bg-brand-pj' : 'bg-brand-pf'}`}></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div>
                     <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{card.accountType === 'PF' ? 'Personal' : 'Business'}</p>
                     <h3 className="text-lg font-bold mt-1">{card.name}</h3>
                  </div>
                  <CreditCard className="opacity-40" />
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs opacity-60 mb-1">Limite Total</p>
                      <p className="text-xl font-mono font-bold">{formatCurrency(card.limit)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] opacity-60">Fech. dia {card.closingDay}</p>
                       <p className="text-[10px] opacity-60">Venc. dia {card.dueDay}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => deleteCard(card.id)}
                  className="absolute bottom-4 right-4 p-2 text-white/20 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {/* Add Card Placeholder if few cards */}
          <button 
             onClick={() => setIsCardModalOpen(true)}
             className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all min-h-[180px]"
          >
             <Plus size={32} className="mb-2 opacity-50" />
             <span className="text-sm font-medium">Adicionar Cartão</span>
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-rose-600 text-sm font-bold uppercase tracking-wider mb-1">Previsão Próximo Mês</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(nextMonthEstimate)}</h3>
            <p className="text-xs text-rose-400 mt-1">Faturas vencendo no próximo mês</p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm text-rose-500">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Total a Pagar (Futuro)</p>
            <h3 className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</h3>
            <p className="text-xs text-slate-400 mt-1">Soma de todas parcelas futuras</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl relative z-10">
            <ShoppingBag size={24} />
          </div>
        </div>
      </div>

      {/* Credit Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Histórico de Compras no Crédito</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
              <tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Data</th>
                <th className="p-4 font-semibold">Cartão</th>
                <th className="p-4 font-semibold">Descrição</th>
                <th className="p-4 font-semibold">Parcela</th>
                <th className="p-4 font-semibold">Categoria</th>
                <th className="p-4 font-semibold text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {creditTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    Nenhuma compra no cartão registrada.
                  </td>
                </tr>
              ) : (
                creditTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                       {/* Display Card Name */}
                       {getCardName(t.cardId)}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {t.description.replace(/\(\d+\/\d+\)$/, '')} 
                    </td>
                    <td className="p-4">
                      {t.installmentInfo ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          {t.installmentInfo.current} / {t.installmentInfo.total}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">{t.category}</td>
                    <td className="p-4 text-right font-bold text-rose-600">
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Compra Parcelada */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" />
                Nova Compra Parcelada
              </h2>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="p-6 space-y-4">
              
              {/* Account Selection */}
              <div className="grid grid-cols-2 gap-4 mb-2">
                <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${accountType === 'PF' ? 'border-brand-pf bg-brand-pf/5 text-brand-pf' : 'border-slate-200 text-slate-400'}`}>
                    <input 
                        type="radio" 
                        name="accountType" 
                        className="hidden" 
                        checked={accountType === 'PF'}
                        onChange={() => {
                          setAccountType('PF');
                          setSelectedCardId(''); // Reset selected card when account changes
                        }} 
                    />
                    <span className="text-xs font-bold">Pessoa Física</span>
                </label>
                <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-1 transition-all ${accountType === 'PJ' ? 'border-brand-pj bg-brand-pj/5 text-brand-pj' : 'border-slate-200 text-slate-400'}`}>
                    <input 
                        type="radio" 
                        name="accountType" 
                        className="hidden" 
                        checked={accountType === 'PJ'}
                        onChange={() => {
                          setAccountType('PJ');
                          setSelectedCardId(''); // Reset selected card when account changes
                        }} 
                    />
                    <span className="text-xs font-bold">Pessoa Jurídica</span>
                </label>
              </div>

              {/* Card Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Selecione o Cartão</label>
                <select
                  required
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                >
                   <option value="" disabled>Escolha um cartão...</option>
                   {availableCards.length > 0 ? (
                      availableCards.map(card => (
                        <option key={card.id} value={card.id}>{card.name} (Dia {card.dueDay})</option>
                      ))
                   ) : (
                     <option value="" disabled>Nenhum cartão {accountType} cadastrado</option>
                   )}
                </select>
                {availableCards.length === 0 && (
                  <p className="text-[10px] text-rose-500 mt-1">Você precisa cadastrar um cartão {accountType} primeiro.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Descrição da Compra</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="Ex: Notebook Novo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Valor TOTAL (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Parcelas</label>
                   <select
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                   >
                     {[...Array(12)].map((_, i) => (
                       <option key={i+1} value={i+1}>{i+1}x</option>
                     ))}
                     <option value={18}>18x</option>
                     <option value={24}>24x</option>
                   </select>
                </div>
              </div>

              {/* Installment Preview */}
              {totalAmount && !isNaN(parseFloat(totalAmount)) && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center text-sm">
                   <span className="text-slate-500">Valor da Parcela:</span>
                   <span className="font-bold text-slate-700">
                     {formatCurrency(parseFloat(totalAmount) / installments)}
                   </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                    <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
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
                      Data 1ª Parcela
                    </label>
                    <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
              >
                Gerar Parcelas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Cartão */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
             <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-700" />
                Cadastrar Cartão
              </h2>
              <button onClick={() => setIsCardModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCardSubmit} className="p-6 space-y-4">
               {/* Account Type Selection */}
               <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setCardAccountType('PF')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                      cardAccountType === 'PF' ? 'bg-white text-brand-pf shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Pessoa Física
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardAccountType('PJ')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${
                      cardAccountType === 'PJ' ? 'bg-white text-brand-pj shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Pessoa Jurídica
                  </button>
               </div>

               <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                  placeholder="Ex: Nubank Platinum"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Limite do Cartão (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                  placeholder="10000,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Dia do Fechamento</label>
                   <select
                    value={cardClosingDay}
                    onChange={(e) => setCardClosingDay(parseInt(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                   >
                     {[...Array(31)].map((_, i) => (
                       <option key={i+1} value={i+1}>{i+1}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Dia do Vencimento</label>
                   <select
                    value={cardDueDay}
                    onChange={(e) => setCardDueDay(parseInt(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                   >
                     {[...Array(31)].map((_, i) => (
                       <option key={i+1} value={i+1}>{i+1}</option>
                     ))}
                   </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 mt-2"
              >
                Salvar Cartão
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};