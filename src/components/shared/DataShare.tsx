import React, { useState } from 'react';
import { db, prepareImportedData } from '@/core/database';
import { Share2, RefreshCw, DownloadCloud } from 'lucide-react';
import { ProgressModal } from './ProgressModal';

export const DataShare: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sharing' | 'retrieving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importCode, setImportCode] = useState('');

  const generateCode = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCode(newCode);
    setStatus('idle');
  };

  const shareData = async () => {
    if (!code) {
      setMessage('Gerar um código primeiro');
      return;
    }

    setStatus('sharing');
    setMessage('Preparando dados para envio...');
    setProgress(0);
    setIsModalOpen(true);

    try {
      // Collect all data from IndexedDB
      const data = {
        accounts: await db.getAll('accounts'),
        categories: await db.getAll('categories'),
        costCenters: await db.getAll('costCenters'),
        transactions: await db.getAll('transactions'),
        creditCards: await db.getAll('creditCards'),
      };

      const jsonString = JSON.stringify(data);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const CHUNK_SIZE = 1024 * 1024; // 1MB
      let start = 0;

      while (start < blob.size) {
        const chunk = blob.slice(start, start + CHUNK_SIZE);
        const formData = new FormData();
        
        formData.append('filename', `${code}.json`);
        formData.append('file_part', chunk, `${code}.json`);

        const response = await fetch('http://localhost:3000/share', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Falha ao compartilhar dados');
        }

        start += CHUNK_SIZE;
        const currentProgress = Math.min(100, Math.round((start / blob.size) * 100));
        setProgress(currentProgress);
        setMessage(`Enviando dados... ${currentProgress}%`);
      }

      setStatus('success');
      setMessage('Dados compartilhados com sucesso!');
      setProgress(100);
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (error) {
      console.error('Error sharing data:', error);
      setStatus('error');
      setMessage('Erro ao compartilhar dados');
      setTimeout(() => setIsModalOpen(false), 3000);
    }
  };

  const retrieveData = async () => {
    if (!importCode) {
      setMessage('Digite um código primeiro');
      return;
    }

    setStatus('retrieving');
    setMessage('Conectando ao servidor...');
    setProgress(0);
    setIsModalOpen(true);

    try {
      const response = await fetch(`http://localhost:3000/share/${importCode}`);
      if (!response.ok) throw new Error('Código inválido ou expirado');

      const reader = response.body?.getReader();
      const contentLength = +(response.headers.get('Content-Length') ?? 0);
      
      let receivedLength = 0;
      const chunks = [];
      
      if (reader) {
        while(true) {
          const {done, value} = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          
          if (contentLength) {
            const p = Math.round((receivedLength / contentLength) * 100);
            setProgress(p);
            setMessage(`Baixando dados... ${p}%`);
          }
        }
      }

      const blob = new Blob(chunks);
      const text = await blob.text();
      const parsedData = JSON.parse(text);
      const data = prepareImportedData(parsedData.data || parsedData);

      // Import to IndexedDB
      if (data.accounts) {
        for (const acc of data.accounts) await db.add('accounts', acc);
      }
      if (data.categories) {
        for (const cat of data.categories) await db.add('categories', cat);
      }
      if (data.transactions) {
        for (const tx of data.transactions) await db.add('transactions', tx);
      }
      if (data.creditCards) {
        for (const cc of data.creditCards) await db.add('creditCards', cc);
      }
      if (data.costCenters) {
        for (const cc of data.costCenters) await db.add('costCenters', cc);
      }

      setStatus('success');
      setMessage('Dados sincronizados com sucesso!');
      setProgress(100);
      setTimeout(() => {
        setIsModalOpen(false);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error retrieving data:', error);
      setStatus('error');
      setMessage('Erro ao baixar dados');
      setTimeout(() => setIsModalOpen(false), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Share2 size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Sincronização na Nuvem</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Envie ou receba dados de outros dispositivos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Share2 size={16} className="text-indigo-500" />
            Enviar Dados
          </h4>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xl tracking-widest text-slate-800 dark:text-slate-100">
              {code || '------'}
            </div>
            <button
              onClick={generateCode}
              className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="Gerar novo código"
            >
              <RefreshCw size={20} className={status === 'sharing' ? 'animate-spin' : ''} />
            </button>
          </div>

          <button
            onClick={shareData}
            disabled={!code || status === 'sharing'}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              !code || status === 'sharing'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none'
            }`}
          >
            {status === 'sharing' ? 'Compartilhando...' : 'Gerar Upload'}
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <DownloadCloud size={16} className="text-emerald-500" />
            Receber Dados
          </h4>
          <input
            type="text"
            value={importCode}
            onChange={(e) => setImportCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            maxLength={6}
            placeholder="CÓDIGO (LETRAS E NÚMEROS)"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-center text-xl tracking-widest text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            onClick={retrieveData}
            disabled={!importCode || status === 'retrieving'}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              !importCode || status === 'retrieving'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 dark:shadow-none'
            }`}
          >
            {status === 'retrieving' ? 'Baixando...' : 'Baixar Dados'}
          </button>
        </div>
      </div>

      <div className="mt-6">

      </div>

      <ProgressModal
        isOpen={isModalOpen}
        progress={progress}
        title={status === 'sharing' ? 'Sincronizando Upload' : 'Sincronizando Download'}
        message={message}
      />
    </div>
  );
};
