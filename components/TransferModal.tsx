
import React, { useState } from 'react';
import { X, ArrowRightLeft, Landmark } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { AccountType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { executeTransfer, bankAccounts } = useFinance();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState<'PJ_TO_PF' | 'PF_TO_PJ'>('PJ_TO_PF');
  
  // Bank Selection States
  const [fromBankId, setFromBankId] = useState('');
  const [toBankId, setToBankId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const from: AccountType = direction === 'PJ_TO_PF' ? 'PJ' : 'PF';
    const to: AccountType = direction === 'PJ_TO_PF' ? 'PF' : 'PJ';

    executeTransfer(
      parseFloat(amount), 
      from, 
      to, 
      date, 
      description, 
      fromBankId || undefined, 
      toBankId || undefined
    );
    
    onClose();
    // Reset form
    setAmount('');
    setDescription('');
    setFromBankId('');
    setToBankId('');
  };

  const changeDirection = (dir: 'PJ_TO_PF' | 'PF_TO_PJ') => {
    setDirection(dir);
    if (dir === 'PJ_TO_PF') {
      setDescription('Pró-labore');
    } else {
      setDescription('Aporte de Capital');
    }
    // Reset bank selections when direction changes to prevent mismatch
    setFromBankId('');
    setToBankId('');
  };

  // Filter banks based on current direction
  const sourceBanks = bankAccounts.filter(b => b.accountType === (direction === 'PJ_TO_PF' ? 'PJ' : 'PF'));
  const destBanks = bankAccounts.filter(b => b.accountType === (direction === 'PJ_TO_PF' ? 'PF' : 'PJ'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-brand-primary" />
            Transferência Inteligente
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => changeDirection('PJ_TO_PF')}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                direction === 'PJ_TO_PF' 
                  ? 'bg-brand-pj/10 border-brand-pj text-brand-pj' 
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              PJ <span className="text-xs">➔</span> PF
              <div className="text-xs font-normal mt-1 opacity-80">Pró-labore</div>
            </button>
            <button
              type="button"
              onClick={() => changeDirection('PF_TO_PJ')}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                direction === 'PF_TO_PJ' 
                  ? 'bg-brand-pf/10 border-brand-pf text-brand-pf' 
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              PF <span className="text-xs">➔</span> PJ
              <div className="text-xs font-normal mt-1 opacity-80">Aporte</div>
            </button>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {/* Source Bank Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                De (Origem {direction === 'PJ_TO_PF' ? 'PJ' : 'PF'})
              </label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={fromBankId}
                  onChange={(e) => setFromBankId(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-slate-800 outline-none"
                >
                  <option value="">Sem vínculo bancário (Caixa)</option>
                  {sourceBanks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination Bank Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                Para (Destino {direction === 'PJ_TO_PF' ? 'PF' : 'PJ'})
              </label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={toBankId}
                  onChange={(e) => setToBankId(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-slate-800 outline-none"
                >
                  <option value="">Sem vínculo bancário (Caixa)</option>
                  {destBanks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
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
              className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
              placeholder="Ex: Pró-labore Outubro"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            Confirmar Transferência
          </button>
        </form>
      </div>
    </div>
  );
};
