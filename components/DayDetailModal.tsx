import React from 'react';
import { X, Calendar, Repeat, User, Building2 } from 'lucide-react';
import { Transaction } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  day: string;
  transactions: Transaction[];
  monthName: string;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const DayDetailModal: React.FC<Props> = ({ isOpen, onClose, day, transactions, monthName }) => {
  if (!isOpen) return null;

  const totalDayExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-primary" />
            Gastos do Dia {day} de {monthName}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p>Nenhuma despesa registrada ou projetada para este dia.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 p-4">
              {transactions.map(t => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      t.accountType === 'PF' ? 'bg-brand-pf/10 text-brand-pf' : 'bg-brand-pj/10 text-brand-pj'
                    }`}>
                      {t.accountType === 'PF' ? <User size={16} /> : <Building2 size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-700">{t.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{t.category}</span>
                        {t.isRecurring && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Repeat size={10}/> Projeção
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-rose-600 whitespace-nowrap">
                    - {formatCurrency(t.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Total do Dia:</span>
          <span className="text-lg font-bold text-rose-700">{formatCurrency(totalDayExpenses)}</span>
        </div>
      </div>
    </div>
  );
};
