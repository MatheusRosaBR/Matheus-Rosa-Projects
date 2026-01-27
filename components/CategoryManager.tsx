import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Category, TransactionType, AccountType } from '../types';
import { Tags, Plus, Edit2, Trash2, X, Check, TrendingUp, TrendingDown, User, Building2, Layers } from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [accountContext, setAccountContext] = useState<AccountType | 'BOTH'>('BOTH');

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setType(category.type);
      setAccountContext(category.accountContext);
    } else {
      setEditingCategory(null);
      setName('');
      setType('EXPENSE');
      setAccountContext('BOTH');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      type,
      accountContext
    };

    if (editingCategory) {
      updateCategory({ ...payload, id: editingCategory.id });
    } else {
      addCategory(payload);
    }
    closeModal();
  };

  // Helper para renderizar o card da categoria
  const CategoryCard: React.FC<{ category: Category }> = ({ category }) => {
    const isIncome = category.type === 'INCOME';
    
    return (
      <div className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icon Box */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isIncome 
              ? 'bg-emerald-50 text-emerald-500' 
              : 'bg-rose-50 text-rose-500'
          }`}>
            {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>

          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-sm">{category.name}</span>
            
            {/* Context Badge */}
            <div className="flex mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                category.accountContext === 'PF' ? 'bg-brand-pf/10 text-brand-pf' :
                category.accountContext === 'PJ' ? 'bg-brand-pj/10 text-brand-pj' :
                'bg-slate-100 text-slate-500'
              }`}>
                {category.accountContext === 'PF' && <User size={10} />}
                {category.accountContext === 'PJ' && <Building2 size={10} />}
                {category.accountContext === 'BOTH' && <Layers size={10} />}
                {category.accountContext === 'BOTH' ? 'Global' : category.accountContext}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => openModal(category)} 
            className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => deleteCategory(category.id)} 
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  const incomeCategories = categories.filter(c => c.type === 'INCOME');
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Tags className="text-brand-primary" />
            Gerenciar Categorias
          </h2>
          <p className="text-sm text-slate-500 mt-1">Crie e organize as categorias de suas receitas e despesas.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-sm shadow-lg shadow-slate-900/20 active:scale-95"
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      {/* Grid Container */}
      <div className="space-y-8">
        
        {/* Income Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="p-1 bg-emerald-100 rounded">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Categorias de Entrada</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{incomeCategories.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeCategories.map(cat => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
            {incomeCategories.length === 0 && (
              <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                Nenhuma categoria de receita cadastrada.
              </div>
            )}
          </div>
        </div>

        {/* Expense Section */}
        <div>
           <div className="flex items-center gap-2 mb-4 px-1">
            <div className="p-1 bg-rose-100 rounded">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Categorias de Saída</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{expenseCategories.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseCategories.map(cat => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
             {expenseCategories.length === 0 && (
              <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                Nenhuma categoria de despesa cadastrada.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal de Categoria */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  placeholder="Ex: Assinaturas"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tipo de Transação</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    <TrendingDown size={16} /> Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    <TrendingUp size={16} /> Receita
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Disponível para</label>
                <div className="grid grid-cols-3 gap-2">
                    {/* PF Option */}
                    <label className={`cursor-pointer border-2 rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all ${accountContext === 'PF' ? 'border-brand-pf bg-brand-pf/5 text-brand-pf' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                        <input type="radio" className="hidden" checked={accountContext === 'PF'} onChange={() => setAccountContext('PF')} />
                        <User size={20} />
                        <span className="text-xs font-bold">PF</span>
                    </label>
                    {/* PJ Option */}
                    <label className={`cursor-pointer border-2 rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all ${accountContext === 'PJ' ? 'border-brand-pj bg-brand-pj/5 text-brand-pj' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                        <input type="radio" className="hidden" checked={accountContext === 'PJ'} onChange={() => setAccountContext('PJ')} />
                        <Building2 size={20} />
                        <span className="text-xs font-bold">PJ</span>
                    </label>
                    {/* Both Option */}
                    <label className={`cursor-pointer border-2 rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all ${accountContext === 'BOTH' ? 'border-slate-500 bg-slate-50 text-slate-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                        <input type="radio" className="hidden" checked={accountContext === 'BOTH'} onChange={() => setAccountContext('BOTH')} />
                        <Layers size={20} />
                        <span className="text-xs font-bold">Ambos</span>
                    </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] flex justify-center items-center gap-2 mt-2"
              >
                <Check size={18} />
                Salvar Categoria
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};