import React from 'react';
import { User, Palette, Lock, Save, Bell, ShieldCheck, Briefcase, Mail, MessageSquare } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const SettingsPage: React.FC = () => {
  const { isPJEnabled, togglePJSupport } = useFinance();

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Configurações</h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie seu perfil, preferências e configurações de segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Navigation */}
        <div className="lg:col-span-1 space-y-2 sticky top-24">
          <a href="#profile" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-100 text-brand-primary font-semibold">
            <User size={18} /> Perfil do Usuário
          </a>
          <a href="#preferences" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-colors">
            <Palette size={18} /> Preferências
          </a>
          <a href="#security" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-colors">
            <Lock size={18} /> Segurança
          </a>
          <a href="#account-type" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-colors">
            <Briefcase size={18} /> Tipos de Conta
          </a>
          <a href="#notifications" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-600 font-medium transition-colors">
            <Bell size={18} /> Notificações
          </a>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Profile Section */}
          <div id="profile" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><User size={20} /> Perfil do Usuário</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-pf to-brand-pj flex items-center justify-center text-white font-bold text-3xl shadow-md">
                  JD
                </div>
                <div>
                  <button className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">Alterar Foto</button>
                  <p className="text-xs text-slate-400 mt-2">JPG, GIF ou PNG. Máx 5MB.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome Completo</label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue="john.doe@email.com"
                  disabled
                  className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors">
                <Save size={16} /> Salvar Alterações
              </button>
            </div>
          </div>

          {/* 2. Preferences Section */}
          <div id="preferences" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Palette size={20} /> Preferências</h3>
            <div className="space-y-4">
               <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Moeda Padrão</label>
                <select className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all">
                  <option value="BRL">Real Brasileiro (BRL)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tema da Interface</label>
                <select className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all">
                  <option value="light">Claro</option>
                  <option value="dark">Escuro (Em breve)</option>
                  <option value="system">Padrão do Sistema (Em breve)</option>
                </select>
              </div>
            </div>
             <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium text-sm transition-colors">
                <Save size={16} /> Salvar Preferências
              </button>
            </div>
          </div>

          {/* 3. Security Section */}
          <div id="security" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Lock size={20} /> Segurança</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border border-slate-100 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-slate-700">Alterar Senha</p>
                  <p className="text-xs text-slate-400">Recomendamos atualizar sua senha periodicamente.</p>
                </div>
                <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                  Alterar
                </button>
              </div>
              <div className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium text-sm text-slate-700 flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> Autenticação de 2 Fatores</p>
                  <p className="text-xs text-slate-400">Aumente a segurança da sua conta.</p>
                </div>
                <button disabled className="px-4 py-2 bg-slate-200 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed">
                  Ativar (Em breve)
                </button>
              </div>
            </div>
          </div>

          {/* 4. Account Types Section */}
          <div id="account-type" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 scroll-mt-24">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Briefcase size={20} /> Tipos de Conta
             </h3>
             <div className="space-y-4">
               <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800">Habilitar Conta PJ (Empresarial)</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Ative esta opção para gerenciar finanças pessoais e empresariais no mesmo lugar. Desative para ocultar funções relacionadas à PJ.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isPJEnabled}
                      onChange={togglePJSupport}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                  </label>
               </div>
             </div>
          </div>

          {/* 5. Notifications Section */}
          <div id="notifications" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 scroll-mt-24">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Bell size={20} /> Notificações</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Mail size={16} /></div>
                  <div>
                    <p className="font-medium text-sm text-slate-700">Resumo Semanal por Email</p>
                    <p className="text-xs text-slate-400">Receba um balanço das suas finanças toda segunda-feira.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>

              <div className="flex justify-between items-center p-3">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><MessageSquare size={16} /></div>
                  <div>
                    <p className="font-medium text-sm text-slate-700">Alertas de Vencimento</p>
                    <p className="text-xs text-slate-400">Notifique-me quando uma fatura ou boleto estiver próximo do vencimento.</p>
                  </div>
                </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
