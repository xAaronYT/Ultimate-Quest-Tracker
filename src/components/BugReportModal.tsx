import React, { useState } from 'react';

interface BugReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
    const [report, setReport] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Your Discord User ID for pings
    const DISCORD_USER_ID = "805995603925794866";

    // Your provided Webhook URL
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1461801774213238794/ZlXHPemaCCSrCXtPckAggrUJfjYAi9MOuf62AEoaaCSrrfeUCsUCSaSsorS_s6s8oglv";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!report.trim()) return;

        setIsSending(true);
        try {
            const response = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `⚠️ **New Intel Error** <@${DISCORD_USER_ID}>`,
                    embeds: [{
                        title: "UQT BUG REPORT",
                        description: report,
                        color: 16744192, // Orange
                        fields: [
                            {
                                name: "Timestamp",
                                value: new Date().toLocaleString(),
                                inline: true
                            },
                            {
                                name: "Status",
                                value: "High Priority",
                                inline: true
                            }
                        ],
                        footer: { text: "Ultimate Quest Tracker • Automated System" }
                    }]
                }),
            });

            if (!response.ok) {
                throw new Error(`Discord responded with ${response.status}`);
            }

            setReport('');
            onClose();
        } catch (err) {
            console.error("Failed to transmit bug report:", err);
            alert("Transmission failed. Please check your internet connection.");
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest text-orange-500 italic">Report Intel Error</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <textarea
                            autoFocus
                            className="w-full h-32 bg-black/50 border border-white/5 rounded-lg p-4 text-xs font-bold text-gray-200 outline-none focus:border-orange-500/50 transition-all resize-none custom-scrollbar"
                            placeholder="Describe the bug or missing data..."
                            value={report}
                            onChange={(e) => setReport(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={isSending || !report.trim()}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-orange-900/20"
                        >
                            {isSending ? 'Transmitting...' : 'Send Report'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};