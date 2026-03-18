import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useAppContext } from '../contexts/AppContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'hasti';
    timestamp: Date;
}

const OptimoBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { t } = useTranslation();
    const { askAssistant } = useAppContext();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await askAssistant(userMsg.text);
            const hastiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.responseText,
                sender: 'hasti',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, hastiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm having trouble connecting to my brain right now. 😔",
                sender: 'hasti',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-[#F1641E] text-white rounded-full w-14 h-14 shadow-2xl hover:bg-[#D95A1B] focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-gray-950 focus:ring-[#F1641E] transition-all hover:scale-110 z-50 overflow-hidden flex items-center justify-center border-2 border-white/20"
                aria-label="Toggle Hasti AI Chat"
            >
                {isOpen ? <X className="w-7 h-7" /> : <img src="/hasti_avatar.png" alt="Hasti AI" className="w-full h-full object-cover" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-80 h-[32rem] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col animate-fade-in-up z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-orange-900/30">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#F1641E]/50 shadow-inner">
                                <img src="/hasti_avatar.png" alt="Hasti" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Hasti AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-grow p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        <div className="flex gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 flex-shrink-0 shadow-sm">
                                <img src="/hasti_avatar.png" alt="Hasti" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-gray-800/80 p-3.5 rounded-2xl rounded-tl-none border border-gray-700/50 shadow-sm max-w-[85%]">
                                <p className="text-gray-200 text-sm leading-relaxed">{t('bot_welcome')}</p>
                            </div>
                        </div>

                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                {msg.sender === 'hasti' && (
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 flex-shrink-0 shadow-sm">
                                        <img src="/hasti_avatar.png" alt="Hasti" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className={`p-3.5 rounded-2xl shadow-sm max-w-[85%] text-sm leading-relaxed border ${
                                    msg.sender === 'user' 
                                        ? 'bg-[#F1641E] text-white rounded-tr-none border-[#F1641E]/50' 
                                        : 'bg-gray-800/80 text-gray-200 rounded-tl-none border-gray-700/50'
                                }`}>
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex gap-2.5">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
                                    <img src="/hasti_avatar.png" alt="Hasti" className="w-full h-full object-cover" />
                                </div>
                                <div className="bg-gray-800/80 p-3.5 rounded-2xl rounded-tl-none border border-gray-700/50 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                    <span className="text-gray-400 text-xs italic">Hasti is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-700/50 bg-gray-900/80">
                        <div className="relative group">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('bot_placeholder')}
                                className="w-full bg-gray-800 border-gray-700/50 rounded-xl pl-4 pr-12 py-3.5 text-white text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none placeholder-gray-500 transition-all group-hover:border-gray-600"
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-purple-400 hover:text-white hover:bg-[#F1641E] transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:text-gray-600"
                            >
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
