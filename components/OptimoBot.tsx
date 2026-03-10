import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const OptimoBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full w-14 h-14 shadow-2xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-gray-950 focus:ring-purple-500 transition-all hover:scale-110 z-50 overflow-hidden flex items-center justify-center border-2 border-white/20"
                aria-label="Toggle Hasti AI Chat"
            >
                {isOpen ? <X className="w-7 h-7" /> : <img src="/hasti_avatar.png" alt="Hasti AI" className="w-full h-full object-cover" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-80 h-[28rem] bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl flex flex-col animate-fade-in-up z-50">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-purple-900/20 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-400">
                                <img src="/hasti_avatar.png" alt="Hasti" className="w-full h-full object-cover" />
                            </div>
                            <h3 className="font-bold text-white">Hasti AI</h3>
                        </div>
                    </div>
                    <div className="flex-grow p-4 space-y-4 text-sm overflow-y-auto">
                        <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
                                <img src="/hasti_avatar.png" alt="Hasti" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-700/50 shadow-sm">
                                <p className="text-gray-300 leading-relaxed">{t('bot_welcome')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('bot_placeholder')}
                                className="w-full bg-gray-800 border-gray-700 rounded-xl pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-gray-500"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-purple-400 hover:text-white hover:bg-purple-600 transition-colors">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OptimoBot;