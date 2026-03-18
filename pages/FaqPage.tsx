import React, { useState } from 'react';
import { HelpCircle, Bot, Zap, Loader2, Send, Edit, Trash2, ChevronDown, CheckCircle, Search, Save, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { ErrorDisplay } from '../components/AuthBanner';
import { FAQ, SuggestedQuestion } from '../types';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const SuggestionCard: React.FC<{suggestion: SuggestedQuestion}> = ({ suggestion }) => {
    const { generateFaqAnswer, publishFaq } = useAppContext();
    const { t } = useTranslation();
    const [answer, setAnswer] = useState<string | null>(suggestion.generatedAnswer || null);
    const [isGenerating, setIsGenerating] = useState(suggestion.isGenerating || false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        await generateFaqAnswer(suggestion.id, suggestion.questionText);
        // The answer will be updated via the context's state management, which will re-render this component.
        // We set the local state just in case, but rely on the parent's re-render.
        setIsGenerating(false); 
    };
    
    const handlePublish = () => {
        if (!answer) return;
        publishFaq(suggestion.id, suggestion.questionText, answer);
    }
    
    const handleDiscard = () => {
        // In a real app, you might call a context function to dismiss the suggestion.
        // Here we can just clear the answer to reset its state.
        setAnswer(null);
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800 dark:text-gray-200">{suggestion.questionText}</p>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{t('faq_source', { source: suggestion.source })}</span>
                <span>{t('faq_relevance_score', { score: suggestion.relevanceScore })}</span>
            </div>
            {suggestion.generatedAnswer ? (
                <div className="mt-3">
                    <textarea 
                        value={suggestion.generatedAnswer}
                        // This demo doesn't implement editing suggestions, but this is where it would go
                        readOnly 
                        className="w-full bg-gray-200 dark:bg-gray-700 p-2 rounded-md text-sm"
                        rows={4}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                         <button onClick={handleDiscard} className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-gray-300 hover:bg-gray-400 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500">
                            {t('faq_discard_button')}
                        </button>
                        <button onClick={handlePublish} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center">
                            <CheckCircle className="w-4 h-4 me-1" />
                            {t('faq_publish_button')}
                        </button>
                    </div>
                </div>
            ) : (
                 <button onClick={handleGenerate} disabled={suggestion.isGenerating} className="w-full mt-3 bg-orange-100 text-purple-700 dark:bg-purple-900/50 dark:text-orange-300 font-semibold py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors disabled:opacity-50">
                    {suggestion.isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                    <span>{suggestion.isGenerating ? t('faq_generating_answer_button') : t('faq_generate_answer_button')}</span>
                </button>
            )}
        </div>
    )
}

const FaqItem: React.FC<{faq: FAQ}> = ({ faq }) => {
    const { updateFaq, deleteFaq } = useAppContext();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState(faq.question);
    const [editedAnswer, setEditedAnswer] = useState(faq.answer);

    const handleSave = () => {
        updateFaq(faq.id, editedQuestion, editedAnswer);
        setIsEditing(false);
    };

    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <h2>
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </h2>
            {isOpen && (
                <div className="p-5 bg-gray-50 dark:bg-gray-900/30">
                    {isEditing ? (
                        <div className="space-y-4">
                             <div>
                                <label className="text-sm font-bold">{t('faq_question_label')}</label>
                                <input type="text" value={editedQuestion} onChange={e => setEditedQuestion(e.target.value)} className="w-full mt-1 bg-white dark:bg-gray-700 p-2 rounded-md" />
                            </div>
                            <div>
                                <label className="text-sm font-bold">{t('faq_answer_label')}</label>
                                <textarea value={editedAnswer} onChange={e => setEditedAnswer(e.target.value)} rows={5} className="w-full mt-1 bg-white dark:bg-gray-700 p-2 rounded-md" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500">
                                    {t('review_cancel_button')}
                                </button>
                                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                                    <Save className="w-4 h-4 me-2" />
                                    {t('faq_save_button')}
                                </button>
                            </div>
                        </div>
                    ) : (
                         <>
                            <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{faq.answer}</p>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => deleteFaq(faq.id)} className="p-2 text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsEditing(true)} className="p-2 text-blue-500 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

const FaqPage: React.FC = () => {
    const { 
        faqs, 
        suggestedQuestions, 
        isFaqLoading, 
        faqError,
        scanForFaqs,
    } = useAppContext();
    const { t } = useTranslation();
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async () => {
        setIsScanning(true);
        await scanForFaqs();
        setIsScanning(false);
    }

    const renderContent = () => {
        if (isFaqLoading) {
            return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 text-[#F1641E] animate-spin" /></div>;
        }
        if (faqError) {
            return <ErrorDisplay message={faqError} />;
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <button onClick={handleScan} disabled={isScanning} className="w-full bg-[#F1641E] text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#D95A1B] transition-opacity disabled:opacity-50">
                            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            <span>{isScanning ? t('faq_scanning_button') : t('faq_scan_button')}</span>
                        </button>
                    </Card>
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('faq_suggestions_title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('faq_suggestions_subtitle')}</p>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                             {suggestedQuestions.length > 0 ? (
                                suggestedQuestions.map(sugg => <SuggestionCard key={sugg.id} suggestion={sugg} />)
                             ) : (
                                 <p className="text-center text-gray-500 py-8">{t('faq_no_suggestions')}</p>
                             )}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('faq_published_title')}</h3>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                             {faqs.length > 0 ? (
                                faqs.map(faq => <FaqItem key={faq.id} faq={faq} />)
                             ) : (
                                <p className="text-center text-gray-500 p-8">{t('faq_no_faqs_published')}</p>
                             )}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <HelpCircle className="w-8 h-8 me-3 text-[#F1641E]" />
                        {t('faq_page_title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('faq_page_subtitle')}</p>
                </div>
            </div>
            
            {renderContent()}

        </div>
    );
};

export default FaqPage;