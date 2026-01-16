import React, { useState } from 'react';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Your Discord Webhook URL
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1461801774213238794/ZlXHPemaCCSrCXtPckAggrUJfjYAi9MOuf62AEoaaCSrrfeUCsUCSaSsorS_s6s8oglv';

    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: "🛠️ NEW BUG REPORT",
            description: report,
            color: 16744192, // Tarkov Orange
            timestamp: new Date().toISOString(),
            footer: {
              text: "Ultimate Quest Tracker System"
            }
          }]
        }),
      });
      alert('Intel received. Thank you.');
      setReport('');
      onClose();
    } catch (err) {
      alert('Transmission failed. Check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h4 className="text-xl font-black uppercase text-white italic mb-4 tracking-tighter">Report an Issue</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            required
            className="w-full h-32 bg-black border border-white/5 rounded-lg p-4 text-xs font-bold text-gray-300 focus:border-orange-500/50 outline-none resize-none"
            placeholder="Describe the bug, missing quest, or data error..."
            value={report}
            onChange={(e) => setReport(e.target.value)}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={isSending}
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50 transition-colors"
            >
              {isSending ? 'Sending...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};