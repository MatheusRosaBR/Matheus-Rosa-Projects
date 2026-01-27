import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Transaction, Category, AccountType, TransactionType, Goal, CreditCard } from '../types';
import { DEFAULT_CATEGORIES, MOCK_TRANSACTIONS, MOCK_CARDS } from '../constants';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  cards: CreditCard[];
  isPJEnabled: boolean; // Novo estado
  togglePJSupport: () => void; // Nova função
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  executeTransfer: (amount: number, from: AccountType, to: AccountType, date: string, description: string) => void;
  addInstallmentTransaction: (baseTransaction: Omit<Transaction, 'id' | 'amount' | 'installmentInfo'>, totalAmount: number, installments: number) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  deleteCard: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  
  // Estado para controle da Conta PJ (Padrão: true)
  const [isPJEnabled, setIsPJEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('findual_is_pj_enabled');
    return stored !== null ? JSON.parse(stored) : true;
  });

  // Load Transactions from LocalStorage
  useEffect(() => {
    const storedTx = localStorage.getItem('findual_transactions');
    if (storedTx) {
      setTransactions(JSON.parse(storedTx));
    } else {
      // Seed with mock data if empty
      // @ts-ignore
      setTransactions([...MOCK_TRANSACTIONS]);
    }
  }, []);

  // Load Categories from LocalStorage
  useEffect(() => {
    const storedCats = localStorage.getItem('findual_categories');
    if (storedCats) {
      setCategories(JSON.parse(storedCats));
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  // Load Goals from LocalStorage
  useEffect(() => {
    const storedGoals = localStorage.getItem('findual_goals');
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
    }
  }, []);

  // Load Cards from LocalStorage
  useEffect(() => {
    const storedCards = localStorage.getItem('findual_cards');
    if (storedCards) {
      setCards(JSON.parse(storedCards));
    } else {
      setCards(MOCK_CARDS);
    }
  }, []);

  // Save Transactions
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('findual_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  // Save Categories
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('findual_categories', JSON.stringify(categories));
    }
  }, [categories]);

  // Save Goals
  useEffect(() => {
    localStorage.setItem('findual_goals', JSON.stringify(goals));
  }, [goals]);

  // Save Cards
  useEffect(() => {
    if (cards.length > 0) {
        localStorage.setItem('findual_cards', JSON.stringify(cards));
    }
  }, [cards]);

  // Save PJ Settings
  useEffect(() => {
    localStorage.setItem('findual_is_pj_enabled', JSON.stringify(isPJEnabled));
  }, [isPJEnabled]);

  const togglePJSupport = () => {
    setIsPJEnabled(prev => !prev);
  };

  // Transactions Logic
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...t, id: crypto.randomUUID() };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateTransaction = (t: Transaction) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === t.id ? t : tx)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const executeTransfer = (amount: number, from: AccountType, to: AccountType, date: string, description: string) => {
    const expenseTx: Transaction = {
      id: crypto.randomUUID(),
      description: `Saída: ${description}`,
      amount,
      date,
      type: 'EXPENSE',
      category: from === 'PJ' ? 'Transferência/Pró-labore' : 'Transferência',
      accountType: from,
      paymentMethod: 'DEBIT',
      isTransfer: true,
    };

    const incomeTx: Transaction = {
      id: crypto.randomUUID(),
      description: `Entrada: ${description}`,
      amount,
      date,
      type: 'INCOME',
      category: to === 'PF' ? 'Salário/Pró-labore' : 'Aporte de Capital',
      accountType: to,
      paymentMethod: 'DEBIT',
      isTransfer: true,
    };

    setTransactions((prev) => [incomeTx, expenseTx, ...prev]);
  };

  // Create multiple transactions based on installments
  const addInstallmentTransaction = (
    baseTransaction: Omit<Transaction, 'id' | 'amount' | 'installmentInfo'>, 
    totalAmount: number, 
    installments: number
  ) => {
    const installmentValue = parseFloat((totalAmount / installments).toFixed(2));
    const newTransactions: Transaction[] = [];
    const groupId = crypto.randomUUID();
    
    // Parse date correctly to avoid timezone issues
    const [year, month, day] = baseTransaction.date.split('-').map(Number);
    // Note: Month in JS Date is 0-indexed (0 = Jan, 11 = Dec)
    
    for (let i = 0; i < installments; i++) {
      const currentDate = new Date(year, month - 1 + i, day);
      
      // Fix potential formatting issues (e.g. 2023-1-5 to 2023-01-05)
      const dateStr = [
        currentDate.getFullYear(),
        (currentDate.getMonth() + 1).toString().padStart(2, '0'),
        currentDate.getDate().toString().padStart(2, '0')
      ].join('-');

      // Correction for last installment rounding differences
      let currentAmount = installmentValue;
      if (i === installments - 1) {
        const sumSoFar = installmentValue * (installments - 1);
        currentAmount = parseFloat((totalAmount - sumSoFar).toFixed(2));
      }

      newTransactions.push({
        ...baseTransaction,
        id: crypto.randomUUID(),
        amount: currentAmount,
        date: dateStr,
        description: `${baseTransaction.description} (${i + 1}/${installments})`,
        paymentMethod: 'CREDIT', // Force Credit
        installmentInfo: {
          current: i + 1,
          total: installments,
          originalId: groupId
        }
      });
    }

    setTransactions((prev) => [...newTransactions, ...prev]);
  };

  // Category Management
  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCat: Category = { ...c, id: crypto.randomUUID() };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (c: Category) => {
    setCategories((prev) => prev.map((cat) => (cat.id === c.id ? c : cat)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  // Goals Management
  const addGoal = (g: Omit<Goal, 'id'>) => {
    const newGoal: Goal = { ...g, id: crypto.randomUUID() };
    setGoals((prev) => [...prev, newGoal]);
  };

  const updateGoal = (g: Goal) => {
    setGoals((prev) => prev.map((goal) => (goal.id === g.id ? g : goal)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  // Card Management
  const addCard = (card: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = { ...card, id: crypto.randomUUID() };
    setCards((prev) => [...prev, newCard]);
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <FinanceContext.Provider value={{ 
      transactions, 
      categories,
      goals,
      cards,
      isPJEnabled,
      togglePJSupport,
      addTransaction, 
      updateTransaction, 
      deleteTransaction, 
      executeTransfer,
      addInstallmentTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addGoal,
      updateGoal,
      deleteGoal,
      addCard,
      deleteCard
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};