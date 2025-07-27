import React, { useState, FormEvent } from 'react';
import { Gift, Bot, Sparkles, Loader2, Info, Heart, Share2, ShoppingCart } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { GiftFinderQuiz, GiftFinderResponse, RecommendedProduct } from '../types';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const QuizSelect: React.FC<{label: string, id: keyof GiftFinderQuiz, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({ label, id, value, onChange, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <select
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700"
        >
            {children}
        </select>
    </div>
);

const ResultProductCard: React.FC<{product: RecommendedProduct; index: number}> = ({ product, index }) => {
    return (
        <div 
            className="bg-gray-100 dark:bg-gray-900/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-500 opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 150}ms` }}
        >
            <img src={product.imageUrl} alt={product.title} className="w-full h-48 object-cover" />
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white flex-1">{product.title}</h3>
                    <div className="relative group flex-shrink-0">
                        <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-pointer" />
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                            {product.reason}
                            <svg className="absolute text-gray-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex-grow">{product.description.substring(0, 80)}...</p>
                <button className="mt-4 w-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-semibold py-2.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                </button>
            </div>
        </div>
    );
};


const GiftFinderPage: React.FC = () => {
    const { findGifts } = useAppContext();
    const { t } = useTranslation();

    const [quizData, setQuizData] = useState<GiftFinderQuiz>({
        occasion: 'birthday',
        recipient: 'partner',
        budget: '50-100',
        style: 'minimalist'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<GiftFinderResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setQuizData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResults(null);
        try {
            const response = await findGifts(quizData);
            setResults(response);
        } catch (err: any) {
            setError(t('gift_finder_error'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Gift className="w-8 h-8 me-3 text-purple-500" />
                        {t('gift_finder_page_title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('gift_finder_page_subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Quiz Form */}
                <div className="lg:col-span-1">
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                            <Bot className="w-5 h-5 me-2 text-purple-500" />
                            {t('gift_finder_quiz_title')}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <QuizSelect label={t('gift_finder_occasion_label')} id="occasion" value={quizData.occasion} onChange={handleInputChange}>
                                <option value="birthday">{t('gift_finder_occasion_birthday')}</option>
                                <option value="anniversary">{t('gift_finder_occasion_anniversary')}</option>
                                <option value="thank-you">{t('gift_finder_occasion_thank_you')}</option>
                                <option value="just-because">{t('gift_finder_occasion_just_because')}</option>
                            </QuizSelect>

                            <QuizSelect label={t('gift_finder_recipient_label')} id="recipient" value={quizData.recipient} onChange={handleInputChange}>
                                <option value="partner">{t('gift_finder_recipient_partner')}</option>
                                <option value="mom">{t('gift_finder_recipient_mom')}</option>
                                <option value="sister">{t('gift_finder_recipient_sister')}</option>
                                <option value="friend">{t('gift_finder_recipient_friend')}</option>
                            </QuizSelect>

                            <QuizSelect label={t('gift_finder_budget_label')} id="budget" value={quizData.budget} onChange={handleInputChange}>
                                <option value="under-50">{t('gift_finder_budget_under_50')}</option>
                                <option value="50-100">{t('gift_finder_budget_50_100')}</option>
                                <option value="100-plus">{t('gift_finder_budget_100_plus')}</option>
                            </QuizSelect>

                            <QuizSelect label={t('gift_finder_style_label')} id="style" value={quizData.style} onChange={handleInputChange}>
                                <option value="minimalist">{t('gift_finder_style_minimalist')}</option>
                                <option value="classic">{t('gift_finder_style_classic')}</option>
                                <option value="boho">{t('gift_finder_style_boho')}</option>
                                <option value="statement">{t('gift_finder_style_statement')}</option>
                            </QuizSelect>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                <span>{isLoading ? t('gift_finder_finding_button') : t('gift_finder_find_button')}</span>
                            </button>
                        </form>
                    </Card>
                </div>

                {/* Results Area */}
                <div className="lg:col-span-2">
                    <Card className="min-h-[50vh]">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">{t('gift_finder_finding_button')}</p>
                                <p className="text-gray-500">Our AI is searching for the perfect items...</p>
                            </div>
                        )}

                        {error && !isLoading && <p className="text-center text-red-500">{error}</p>}
                        
                        {results && !isLoading && (
                            <div className="animate-fade-in-up">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                        <Sparkles className="w-6 h-6 me-2 text-yellow-400" />
                                        {t('gift_finder_results_title')}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Save Results"><Heart className="w-4 h-4"/></button>
                                        <button className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Share"><Share2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg italic">
                                   "{results.responseText}"
                                </p>
                                
                                {results.products.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {results.products.map((p, i) => <ResultProductCard key={p.id} product={p} index={i} />)}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('gift_finder_no_results')}</p>
                                )}
                            </div>
                        )}

                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GiftFinderPage;