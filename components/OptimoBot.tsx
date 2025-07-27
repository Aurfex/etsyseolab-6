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
                className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-2xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-gray-950 focus:ring-primary-500 transition-transform hover:scale-110"
                aria-label="Toggle OptimoBot Chat"
            >
                {isOpen ? <X className="w-7 h-7" /> : <Bot className="w-7 h-7" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-80 h-[28rem] bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl flex flex-col animate-fade-in-up">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                            <Bot className="w-6 h-6 text-primary-400" />
                            <h3 className="font-bold text-white">{t('bot_title')}</h3>
                        </div>
                    </div>
                    <div className="flex-grow p-4 space-y-4 text-sm overflow-y-auto">
                        <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-primary-400" />
                            </div>
                            <div className="bg-gray-800 p-3 rounded-lg rounded-tl-none">
                                <p className="text-gray-300">{t('bot_welcome')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-700">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('bot_placeholder')}
                                className="w-full bg-gray-800 border-gray-700 rounded-lg pl-4 pr-12 py-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-primary-600">
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