
import React, { useState } from 'react';
import { X, ArrowRightLeft, Landmark } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BankTransferModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { bankAccounts, executeBankTransfer } = useFinance();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [fromBankId, setFromBankId] = useState('');
  const [toBankId, setToBankId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !fromBankId || !toBankId) return;
    if (fromBankId === toBankId) {
        alert("A conta de origem e destino não podem ser a mesma.");
        return;
    }

    executeBankTransfer(parseFloat(amount), fromBankId, toBankId, date, description);
    onClose();
    // Reset form
    setAmount('');
    setDescription('');
    setFromBankId('');
    setToBankId('');
  };

  const getBankLabel = (id: string) => {
    const bank = bankAccounts.find(b => b.id === id);
    return bank ? `${bank.name} (${bank.accountType})` : '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-brand-primary" />
            Transferência entre Bancos
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">De (Origem)</label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 w-4 h-4" />
                <select
                    required
                    value={fromBankId}
                    onChange={(e) => setFromBankId(e.target.value)}
                    className="w-full pl-9 pr-2 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                    <option value="">Selecione a conta...</option>
                    {bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.accountType})</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm text-slate-400">
                    <ArrowRightLeft size={16} className="rotate-90" />
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Para (Destino)</label>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 w-4 h-4" />
                <select
                    required
                    value={toBankId}
                    onChange={(e) => setToBankId(e.target.value)}
                    className="w-full pl-9 pr-2 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                    <option value="">Selecione a conta...</option>
                    {bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.accountType})</option>
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
              placeholder="Ex: Transferência para Investimento"
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
