
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { BankAccount, AccountType } from '../types';
import { Landmark, Plus, Edit2, Trash2, X, Building2, User, ArrowRightLeft } from 'lucide-react';
import { BankTransferModal } from './BankTransferModal';

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface BankCardProps {
  bank: BankAccount;
  onEdit: (bank: BankAccount) => void;
  onDelete: (id: string) => void;
}

const BankCard: React.FC<BankCardProps> = ({ bank, onEdit, onDelete }) => {
  const { getBankBalance } = useFinance();
  const currentBalance = getBankBalance(bank.id);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
      <div>
          <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                  <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
                      style={{ backgroundColor: bank.color || '#cbd5e1' }}
                  >
                      <Landmark size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800">{bank.name}</h3>
                      <p className="text-xs text-slate-400">Conta {bank.accountType}</p>
                  </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => onEdit(bank)} className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-slate-50 rounded">
                      <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(bank.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded">
                      <Trash2 size={14} />
                  </button>
              </div>
          </div>
          
          <div className="mt-4">
              <p className="text-xs text-slate-500 mb-1">Saldo Atual</p>
              <p className={`text-xl font-bold ${currentBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                  {formatCurrency(currentBalance)}
              </p>
          </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
           <span>Saldo Inicial: {formatCurrency(bank.initialBalance)}</span>
      </div>
    </div>
  );
};

export const BankAccountManager: React.FC = () => {
  const { bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, isPJEnabled } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PF');
  const [color, setColor] = useState('#3b82f6');

  const openModal = (bank?: BankAccount) => {
    if (bank) {
      setEditingBank(bank);
      setName(bank.name);
      setInitialBalance(bank.initialBalance.toString());
      setAccountType(bank.accountType);
      setColor(bank.color || '#3b82f6');
    } else {
      setEditingBank(null);
      setName('');
      setInitialBalance('');
      setAccountType('PF');
      setColor('#3b82f6');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBank(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload = {
      name,
      initialBalance: parseFloat(initialBalance) || 0,
      accountType,
      color
    };

    if (editingBank) {
      updateBankAccount({ ...payload, id: editingBank.id });
    } else {
      addBankAccount(payload);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza? Isso não apagará as transações passadas, mas desvinculará o banco.')) {
      deleteBankAccount(id);
    }
  };

  const pfBanks = bankAccounts.filter(b => b.accountType === 'PF');
  const pjBanks = bankAccounts.filter(b => b.accountType === 'PJ');

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Landmark className="text-brand-primary" />
            Contas Bancárias
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie os saldos de suas contas correntes PF e PJ.</p>
        </div>
        <div className="flex gap-2">
            <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm shadow-sm active:scale-95"
            >
            <ArrowRightLeft size={18} />
            <span className="hidden sm:inline">Transferir</span>
            </button>
            <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-sm shadow-lg shadow-slate-900/20 active:scale-95"
            >
            <Plus size={18} />
            Adicionar Banco
            </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* PF Section */}
        <div>
             <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-brand-pf/10 rounded-lg">
                    <User className="w-4 h-4 text-brand-pf" />
                </div>
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Pessoa Física</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {pfBanks.map(bank => <BankCard key={bank.id} bank={bank} onEdit={openModal} onDelete={handleDelete} />)}
                 {pfBanks.length === 0 && (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                        Nenhuma conta PF cadastrada.
                    </div>
                 )}
             </div>
        </div>

        {/* PJ Section */}
        {isPJEnabled && (
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-brand-pj/10 rounded-lg">
                        <Building2 className="w-4 h-4 text-brand-pj" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Pessoa Jurídica</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pjBanks.map(bank => <BankCard key={bank.id} bank={bank} onEdit={openModal} onDelete={handleDelete} />)}
                     {pjBanks.length === 0 && (
                        <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                            Nenhuma conta PJ cadastrada.
                        </div>
                     )}
                </div>
            </div>
        )}
      </div>

       {/* Modal: Add/Edit Bank */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingBank ? 'Editar Banco' : 'Novo Banco'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               {/* Account Type Selection */}
               {isPJEnabled && (
                   <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
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
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Banco</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                  placeholder="Ex: Nubank, Itaú..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                  placeholder="0,00"
                />
                <p className="text-[10px] text-slate-400 mt-1">O saldo será atualizado automaticamente com as transações.</p>
              </div>
              
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cor de Identificação</label>
                  <div className="flex gap-2">
                      {['#3b82f6', '#820ad1', '#ec7000', '#ff7a00', '#10b981', '#ef4444', '#6366f1', '#0f172a'].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                      ))}
                  </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 mt-2"
              >
                Salvar Conta Bancária
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <BankTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />
    </div>
  );
};
