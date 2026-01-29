
import { Category, CreditCard } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Receitas
  { id: '1', name: 'Vendas/Serviços', type: 'INCOME', accountContext: 'PJ' },
  { id: '2', name: 'Salário/Pró-labore', type: 'INCOME', accountContext: 'PF' },
  { id: '3', name: 'Rendimentos de Invest.', type: 'INCOME', accountContext: 'BOTH' },
  { id: '4', name: 'Aporte de Capital', type: 'INCOME', accountContext: 'PJ' },
  { id: '5', name: 'Outras Receitas', type: 'INCOME', accountContext: 'BOTH' },

  // Despesas
  { id: '10', name: 'Aluguel/Escritório', type: 'EXPENSE', accountContext: 'BOTH' },
  { id: '11', name: 'Alimentação', type: 'EXPENSE', accountContext: 'PF' },
  { id: '12', name: 'Software/SaaS', type: 'EXPENSE', accountContext: 'PJ' },
  { id: '13', name: 'Marketing', type: 'EXPENSE', accountContext: 'PJ' },
  { id: '14', name: 'Impostos', type: 'EXPENSE', accountContext: 'PJ' },
  { id: '15', name: 'Lazer', type: 'EXPENSE', accountContext: 'PF' },
  { id: '16', name: 'Transporte', type: 'EXPENSE', accountContext: 'BOTH' },
  { id: '17', name: 'Educação', type: 'EXPENSE', accountContext: 'BOTH' },
  { id: '18', name: 'Saúde', type: 'EXPENSE', accountContext: 'PF' },
  { id: '19', name: 'Transferência/Pró-labore', type: 'EXPENSE', accountContext: 'PJ' },
  { id: '20', name: 'Outras Despesas', type: 'EXPENSE', accountContext: 'BOTH' },
];

export const MOCK_CARDS: CreditCard[] = [
  { id: 'card-1', name: 'Nubank Platinum', limit: 12000, closingDay: 1, dueDay: 10, accountType: 'PF' },
  { id: 'card-2', name: 'Inter Empresas Black', limit: 45000, closingDay: 5, dueDay: 15, accountType: 'PJ' },
];

export const MOCK_TRANSACTIONS = [
  { id: '1', description: 'Licença Adobe Creative Cloud', amount: 240.00, date: '2023-10-05', type: 'EXPENSE', category: 'Software/SaaS', accountType: 'PJ', paymentMethod: 'CREDIT', cardId: 'card-2' },
  { id: '2', description: 'Recebimento Cliente X', amount: 5000.00, date: '2023-10-02', type: 'INCOME', category: 'Vendas/Serviços', accountType: 'PJ', paymentMethod: 'DEBIT' },
  { id: '3', description: 'Supermercado Mensal', amount: 850.00, date: '2023-10-06', type: 'EXPENSE', category: 'Alimentação', accountType: 'PF', paymentMethod: 'DEBIT' },
  { id: '4', description: 'Pró-labore (Entrada)', amount: 3000.00, date: '2023-10-10', type: 'INCOME', category: 'Salário/Pró-labore', accountType: 'PF', isTransfer: true, paymentMethod: 'DEBIT' },
  { id: '5', description: 'Pró-labore (Saída)', amount: 3000.00, date: '2023-10-10', type: 'EXPENSE', category: 'Transferência/Pró-labore', accountType: 'PJ', isTransfer: true, paymentMethod: 'DEBIT' },
  { id: '6', description: 'Jantar com Cliente', amount: 450.00, date: '2023-10-12', type: 'EXPENSE', category: 'Marketing', accountType: 'PJ', paymentMethod: 'CREDIT', cardId: 'card-2' },
  { id: '7', description: 'Passagem Aérea SP-RJ', amount: 1200.00, date: '2023-10-15', type: 'EXPENSE', category: 'Transporte', accountType: 'PF', paymentMethod: 'CREDIT', cardId: 'card-1' },
  // RECORRÊNCIAS FICTÍCIAS ADICIONADAS
  { id: 'rec-1', description: 'Assinatura Netflix', amount: 39.90, date: '2023-09-15', type: 'EXPENSE', category: 'Lazer', accountType: 'PF', paymentMethod: 'DEBIT', isRecurring: true },
  { id: 'rec-2', description: 'Licença Microsoft 365', amount: 45.00, date: '2023-09-20', type: 'EXPENSE', category: 'Software/SaaS', accountType: 'PJ', paymentMethod: 'DEBIT', isRecurring: true },
  { id: 'rec-3', description: 'Plano de Saúde', amount: 450.00, date: '2023-09-10', type: 'EXPENSE', category: 'Saúde', accountType: 'PF', paymentMethod: 'DEBIT', isRecurring: true },
  { id: 'rec-4', description: 'Mensalidade Academia', amount: 120.00, date: '2023-09-05', type: 'EXPENSE', category: 'Saúde', accountType: 'PF', paymentMethod: 'CREDIT', cardId: 'card-1', isRecurring: true },
  { id: 'rec-5', description: 'Aluguel Escritório', amount: 2500.00, date: '2023-09-08', type: 'EXPENSE', category: 'Aluguel/Escritório', accountType: 'PJ', paymentMethod: 'DEBIT', isRecurring: true }
] as const;
