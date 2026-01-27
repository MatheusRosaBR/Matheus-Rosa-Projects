import React, { useState } from 'react';
import { X, FileText, FileSpreadsheet, Download, Calendar, Filter } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { AccountType, TransactionType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { transactions } = useFinance();
  
  // States do Filtro
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountType, setAccountType] = useState<AccountType | 'ALL'>('ALL');
  const [format, setFormat] = useState<'CSV' | 'PDF'>('CSV');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);

    // 1. Filtrar Dados
    const filteredData = transactions.filter(t => {
      // Filtro de Data
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      
      // Filtro de Conta
      if (accountType !== 'ALL' && t.accountType !== accountType) return false;

      return true;
    });

    if (filteredData.length === 0) {
      alert("Nenhum dado encontrado para o período selecionado.");
      setIsExporting(false);
      return;
    }

    // 2. Exportar
    setTimeout(() => {
      if (format === 'CSV') {
        generateCSV(filteredData);
      } else {
        generatePDF(filteredData);
      }
      setIsExporting(false);
      onClose();
    }, 800); // Fake loading delay para UX
  };

  const generateCSV = (data: typeof transactions) => {
    const headers = ['ID', 'Data', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Conta', 'Método'];
    
    const rows = data.map(t => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.category,
      t.type === 'EXPENSE' ? -t.amount : t.amount,
      t.type,
      t.accountType,
      t.paymentMethod
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Adicionar BOM para Excel reconhecer acentuação UTF-8
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_findual_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = (data: typeof transactions) => {
    // Em um ambiente real, usaríamos bibliotecas como jspdf ou react-pdf.
    // Aqui simularemos com um print dialog ou alerta para manter o código leve.
    alert(`Simulação de PDF: ${data.length} registros prontos para impressão.\n\nPara PDF real, integraríamos a lib 'jspdf'.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-brand-primary" />
            Exportar Relatório
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Seção de Período */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar size={12} /> Período
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 mb-1 block">De</span>
                <input 
                  type="date" 
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-brand-primary outline-none"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <span className="text-xs text-slate-400 mb-1 block">Até</span>
                <input 
                  type="date" 
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-brand-primary outline-none"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seção de Filtros */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Filter size={12} /> Dados
            </label>
            <select 
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:border-brand-primary outline-none"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
            >
              <option value="ALL">Todas as Contas (Consolidado)</option>
              <option value="PF">Apenas Pessoa Física (PF)</option>
              <option value="PJ">Apenas Pessoa Jurídica (PJ)</option>
            </select>
          </div>

          {/* Seção de Formato */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Formato do Arquivo</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormat('CSV')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  format === 'CSV' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-100 hover:border-slate-200 text-slate-500'
                }`}
              >
                <FileSpreadsheet size={24} className="mb-2" />
                <span className="text-sm font-bold">CSV / Excel</span>
              </button>

              <button
                onClick={() => setFormat('PDF')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  format === 'PDF' 
                    ? 'border-rose-500 bg-rose-50 text-rose-700' 
                    : 'border-slate-100 hover:border-slate-200 text-slate-500'
                }`}
              >
                <FileText size={24} className="mb-2" />
                <span className="text-sm font-bold">PDF</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>Processando...</>
            ) : (
              <>
                <Download size={18} />
                Baixar Relatório
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};