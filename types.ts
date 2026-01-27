export type AccountType = 'PF' | 'PJ';

export type TransactionType = 'INCOME' | 'EXPENSE';

export type PaymentMethod = 'CREDIT' | 'DEBIT';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  accountContext: AccountType | 'BOTH';
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  accountType: AccountType;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO String YYYY-MM-DD
  type: TransactionType;
  category: string;
  accountType: AccountType;
  paymentMethod: PaymentMethod;
  cardId?: string; // Optional reference to the specific Credit Card used
  isTransfer?: boolean; // Flag to identify internal transfers
  isRecurring?: boolean; // Flag to identify recurring transactions
  installmentInfo?: {
    current: number; // Current installment number (e.g., 1)
    total: number;   // Total installments (e.g., 12)
    originalId: string; // ID to link all installments
  };
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // Optional: ISO String YYYY-MM-DD
}

export interface DashboardMetrics {
  balancePF: number;
  balancePJ: number;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}