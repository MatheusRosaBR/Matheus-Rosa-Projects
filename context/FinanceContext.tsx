
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Transaction, Category, AccountType, TransactionType, Goal, CreditCard, BankAccount } from '../types';
import { DEFAULT_CATEGORIES, MOCK_TRANSACTIONS, MOCK_CARDS } from '../constants';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  cards: CreditCard[];
  bankAccounts: BankAccount[];
  isPJEnabled: boolean;
  togglePJSupport: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  executeTransfer: (amount: number, from: AccountType, to: AccountType, date: string, description: string) => void;
  executeBankTransfer: (amount: number, fromBankId: string, toBankId: string, date: string, description: string) => void;
  addInstallmentTransaction: (baseTransaction: Omit<Transaction, 'id' | 'amount' | 'installmentInfo'>, totalAmount: number, installments: number) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  deleteCard: (id: string) => void;
  addBankAccount: (bank: Omit<BankAccount, 'id'>) => void;
  updateBankAccount: (bank: BankAccount) => void;
  deleteBankAccount: (id: string) => void;
  getBankBalance: (bankId: string) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  // Estado para controle da Conta PJ (Padrão: true)
  const [isPJEnabled, setIsPJEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('findual_is_pj_enabled');
    return stored !== null ? JSON.parse(stored) : true;
  });

  // Load Transactions
  useEffect(() => {
    const storedTx = localStorage.getItem('findual_transactions');
    if (storedTx) {
      setTransactions(JSON.parse(storedTx));
    } else {
      // @ts-ignore
      setTransactions([...MOCK_TRANSACTIONS]);
    }
  }, []);

  // Load Categories
  useEffect(() => {
    const storedCats = localStorage.getItem('findual_categories');
    if (storedCats) {
      setCategories(JSON.parse(storedCats));
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  // Load Goals
  useEffect(() => {
    const storedGoals = localStorage.getItem('findual_goals');
    if (storedGoals) {
      setGoals(JSON.parse(storedGoals));
    }
  }, []);

  // Load Cards
  useEffect(() => {
    const storedCards = localStorage.getItem('findual_cards');
    if (storedCards) {
      setCards(JSON.parse(storedCards));
    } else {
      setCards(MOCK_CARDS);
    }
  }, []);

  // Load Bank Accounts
  useEffect(() => {
    const storedBanks = localStorage.getItem('findual_banks');
    if (storedBanks) {
      setBankAccounts(JSON.parse(storedBanks));
    } else {
      // Mock inicial de bancos se não houver
      setBankAccounts([
        { id: 'bank-1', name: 'Nubank', initialBalance: 1500.00, accountType: 'PF', color: '#820ad1' },
        { id: 'bank-2', name: 'Itaú', initialBalance: 0, accountType: 'PF', color: '#ec7000' },
        { id: 'bank-3', name: 'Inter Empresas', initialBalance: 5000.00, accountType: 'PJ', color: '#ff7a00' }
      ]);
    }
  }, []);

  // Save Effects
  useEffect(() => {
    if (transactions.length > 0) localStorage.setItem('findual_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (categories.length > 0) localStorage.setItem('findual_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('findual_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (cards.length > 0) localStorage.setItem('findual_cards', JSON.stringify(cards));
  }, [cards]);
  
  useEffect(() => {
    if (bankAccounts.length > 0) localStorage.setItem('findual_banks', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

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

  // Generic Transfer (Context Switch PF <-> PJ without specific bank enforcement)
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

  // Specific Bank to Bank Transfer
  const executeBankTransfer = (amount: number, fromBankId: string, toBankId: string, date: string, description: string) => {
    const fromBank = bankAccounts.find(b => b.id === fromBankId);
    const toBank = bankAccounts.find(b => b.id === toBankId);

    if (!fromBank || !toBank) return;

    // Saída do Banco Origem
    const expenseTx: Transaction = {
      id: crypto.randomUUID(),
      description: `Transf. para ${toBank.name}: ${description}`,
      amount,
      date,
      type: 'EXPENSE',
      category: 'Transferência',
      accountType: fromBank.accountType,
      paymentMethod: 'DEBIT',
      bankAccountId: fromBankId,
      isTransfer: true,
    };

    // Entrada no Banco Destino
    const incomeTx: Transaction = {
      id: crypto.randomUUID(),
      description: `Transf. de ${fromBank.name}: ${description}`,
      amount,
      date,
      type: 'INCOME',
      category: 'Transferência',
      accountType: toBank.accountType,
      paymentMethod: 'DEBIT',
      bankAccountId: toBankId,
      isTransfer: true,
    };

    setTransactions((prev) => [incomeTx, expenseTx, ...prev]);
  };

  const addInstallmentTransaction = (
    baseTransaction: Omit<Transaction, 'id' | 'amount' | 'installmentInfo'>, 
    totalAmount: number, 
    installments: number
  ) => {
    const installmentValue = parseFloat((totalAmount / installments).toFixed(2));
    const newTransactions: Transaction[] = [];
    const groupId = crypto.randomUUID();
    
    const [year, month, day] = baseTransaction.date.split('-').map(Number);
    
    for (let i = 0; i < installments; i++) {
      const currentDate = new Date(year, month - 1 + i, day);
      const dateStr = [
        currentDate.getFullYear(),
        (currentDate.getMonth() + 1).toString().padStart(2, '0'),
        currentDate.getDate().toString().padStart(2, '0')
      ].join('-');

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
        paymentMethod: 'CREDIT',
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

  // Bank Account Management
  const addBankAccount = (bank: Omit<BankAccount, 'id'>) => {
    const newBank: BankAccount = { ...bank, id: crypto.randomUUID() };
    setBankAccounts((prev) => [...prev, newBank]);
  };

  const updateBankAccount = (bank: BankAccount) => {
    setBankAccounts((prev) => prev.map((b) => (b.id === bank.id ? bank : b)));
  };

  const deleteBankAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((b) => b.id !== id));
    // Opcional: Remover referência das transações ou avisar o usuário
  };

  const getBankBalance = (bankId: string) => {
    const bank = bankAccounts.find(b => b.id === bankId);
    if (!bank) return 0;

    let balance = bank.initialBalance || 0;
    
    // Somar transações vinculadas a este banco
    transactions.forEach(t => {
      if (t.bankAccountId === bankId) {
        if (t.type === 'INCOME') balance += t.amount;
        if (t.type === 'EXPENSE') balance -= t.amount;
      }
    });

    return balance;
  };

  return (
    <FinanceContext.Provider value={{ 
      transactions, 
      categories,
      goals,
      cards,
      bankAccounts,
      isPJEnabled,
      togglePJSupport,
      addTransaction, 
      updateTransaction, 
      deleteTransaction, 
      executeTransfer,
      executeBankTransfer,
      addInstallmentTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addGoal,
      updateGoal,
      deleteGoal,
      addCard,
      deleteCard,
      addBankAccount,
      updateBankAccount,
      deleteBankAccount,
      getBankBalance
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
