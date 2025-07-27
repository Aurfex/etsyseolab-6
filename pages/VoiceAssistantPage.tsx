import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Mic, Send, Bot, User, Volume2, Loader2, Video } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { AssistantMessage, Product } from '../types';

// SpeechRecognition might not exist on `window`.
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSynthesis = window.speechSynthesis;


const ProductResultCard: React.FC<{product: Product}> = ({product}) => (
    <div className="bg-gray-200 dark:bg-gray-700/50 rounded-lg overflow-hidden w-48 flex-shrink-0">
        <img src={product.imageUrl} alt={product.title} className="w-full h-24 object-cover" />
        <div className="p-2">
            <h4 className="text-xs font-bold truncate text-gray-900 dark:text-gray-100">{product.title}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">SEO: {product.seoScore}%</p>
        </div>
    </div>
);


const MessageBubble: React.FC<{message: AssistantMessage}> = ({ message }) => {
    const { t } = useTranslation();
    const isUser = message.sender === 'user';

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-purple-400" />
                </div>
            )}
            <div className={`max-w-md space-y-2 p-3 rounded-2xl ${isUser ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700/80 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.products && message.products.length > 0 && (
                    <div className="pt-2">
                        <h4 className="text-sm font-semibold mb-2">{t('assistant_product_recommendation')}</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {message.products.map(p => <ProductResultCard key={p.id} product={p}/>)}
                        </div>
                    </div>
                )}
            </div>
             {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                </div>
            )}
        </div>
    );
};


const VoiceAssistantPage: React.FC = () => {
    const { askAssistant, showToast, auth } = useAppContext();
    const { t, language } = useTranslation();

    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const recognition = useRef<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if(messages.length === 0) {
            setMessages([
                { id: 'init', sender: 'ai', text: t('assistant_welcome_message') }
            ]);
        }
    }, [t, messages.length]);

    const speak = (text: string) => {
        if (!speechSynthesis) return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
        speechSynthesis.speak(utterance);
    };

    const processQuery = async (query: string) => {
        if (!query.trim()) return;

        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: query }]);
        setIsProcessing(true);

        try {
            const response = await askAssistant(query);
            speak(response.responseText);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: response.responseText,
                products: response.products
            }]);
        } catch (error) {
            console.error("Assistant error:", error);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        processQuery(inputValue);
        setInputValue('');
    }

    useEffect(() => {
        if (!SpeechRecognition) {
            return;
        }
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = language === 'fa' ? 'fa-IR' : 'en-US';
        rec.interimResults = false;

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                showToast({ tKey: 'assistant_error_mic', type: 'error' });
            }
        };
        rec.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(transcript);
            processQuery(transcript);
        };
        recognition.current = rec;
    }, [showToast, language]);

    const handleMicClick = () => {
        if (!SpeechRecognition) {
            showToast({tKey: 'assistant_error_speech_recognition', type: 'error'});
            return;
        }
        if (isListening) {
            recognition.current?.stop();
        } else {
            try {
                recognition.current?.start();
            } catch (e) {
                console.error("Error starting recognition:", e);
                showToast({ tKey: 'assistant_error_mic', type: 'error' });
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Volume2 className="w-8 h-8 me-3 text-purple-500" />
                        {t('assistant_page_title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('assistant_page_subtitle')}</p>
                </div>
                 <button className="flex items-center gap-2 px-4 py-2 mt-4 sm:mt-0 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/10 rounded-full hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors">
                    <Video className="w-4 h-4"/>
                    Request Video Call
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card dark:shadow-card-dark flex flex-col h-[70vh]">
                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                    {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                    {isProcessing && (
                         <div className="flex items-start gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-700/80 rounded-bl-none">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                       <button type="button" onClick={handleMicClick} className={`p-3 rounded-full transition-colors flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                           <Mic className="w-6 h-6"/>
                       </button>
                       <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isListening ? t('assistant_listening') : t('assistant_placeholder')}
                        className="w-full bg-gray-100 dark:bg-gray-700/50 border-transparent focus:border-purple-500 focus:ring-purple-500 rounded-full px-5 py-3"
                        disabled={isProcessing}
                       />
                       <button type="submit" className="p-3 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 flex-shrink-0" disabled={isProcessing || !inputValue}>
                            <Send className="w-6 h-6"/>
                       </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistantPage;