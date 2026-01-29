
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { Repeat, Plus, Edit2, Trash2, CalendarClock, CreditCard, Banknote, Building2, User } from 'lucide-react';
import { TransactionModal } from './TransactionModal';

export const RecurringManager: React.FC = () => {
  const { transactions, deleteTransaction } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Filtrar apenas as recorrentes
  const recurringTransactions = transactions.filter(t => t.isRecurring);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getDayFromDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.getDate().toString().padStart(2, '0');
  };

  const handleEdit = (t: Transaction) => {
    setEditingTx(t);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta recorrência?')) {
      deleteTransaction(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTx(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Repeat className="text-brand-primary" />
            Gestão de Recorrências
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie suas assinaturas, contas fixas e recebimentos mensais.</p>
        </div>
        <button
          onClick={() => { setEditingTx(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-sm shadow-lg shadow-slate-900/20 active:scale-95"
        >
          <Plus size={18} />
          Nova Recorrência
        </button>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {recurringTransactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
            <CalendarClock size={48} className="mb-4 opacity-50 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600">Nenhuma recorrência cadastrada</h3>
            <p className="text-sm max-w-md mt-1">Adicione despesas fixas como Aluguel, Internet ou Software SaaS para acompanhar seu fluxo de caixa mensal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 font-semibold w-24 text-center">Dia Venc.</th>
                  <th className="p-4 font-semibold">Descrição</th>
                  <th className="p-4 font-semibold">Conta / Método</th>
                  <th className="p-4 font-semibold text-right">Valor</th>
                  <th className="p-4 font-semibold text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {recurringTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Dia do Vencimento */}
                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center justify-center bg-slate-100 border border-slate-200 rounded-lg w-10 h-10">
                        <span className="text-xs font-bold text-slate-700">{getDayFromDate(t.date)}</span>
                      </div>
                    </td>

                    {/* Descrição & Categoria */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{t.description}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">{t.category}</span>
                      </div>
                    </td>

                    {/* Conta & Método */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {/* Chip Conta */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          t.accountType === 'PF' ? 'bg-brand-pf/10 text-brand-pf' : 'bg-brand-pj/10 text-brand-pj'
                        }`}>
                          {t.accountType === 'PF' ? <User size={10} /> : <Building2 size={10} />}
                          {t.accountType}
                        </span>
                        
                        {/* Chip Método */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            t.paymentMethod === 'CREDIT' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                             {t.paymentMethod === 'CREDIT' ? <CreditCard size={10} /> : <Banknote size={10} />}
                             {t.paymentMethod === 'CREDIT' ? 'Crédito' : 'Débito'}
                        </span>
                      </div>
                    </td>

                    {/* Valor */}
                    <td className={`p-4 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {t.type === 'EXPENSE' ? '-' : '+'} {formatCurrency(t.amount)}
                    </td>

                    {/* Ações */}
                    <td className="p-4">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Reused */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        editTransaction={editingTx}
        defaultIsRecurring={true} // Força a flag de recorrência para novos itens
      />
    </div>
  );
};
