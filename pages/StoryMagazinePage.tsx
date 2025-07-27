import React, { useState, useEffect, useMemo } from 'react';
import { LayoutTemplate, PlusCircle, Loader2, Image as ImageIcon, FileText, Package, CheckCircle, Edit, Save, Trash, Send, Search, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { ErrorDisplay } from '../components/AuthBanner';
import { Story, Product } from '../types';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const EmptyState: React.FC<{ onAction: () => void; title: string; subtitle: string; buttonText: string }> = ({ onAction, title, subtitle, buttonText }) => (
    <div className="text-center py-12">
        <LayoutTemplate className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        <div className="mt-6">
            <button onClick={onAction} type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                {buttonText}
            </button>
        </div>
    </div>
);


const StoryEditor: React.FC<{
    story: Story | null;
    onSave: (story: Omit<Story, 'createdAt' | 'updatedAt' | 'slug'>) => void;
    onClose: () => void;
    isSaving: boolean;
}> = ({ story, onSave, onClose, isSaving }) => {
    const { t } = useTranslation();
    const { products } = useAppContext();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [featuredImageUrl, setFeaturedImageUrl] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        setTitle(story?.title || '');
        setContent(story?.content || '');
        setFeaturedImageUrl(story?.featuredImageUrl || '');
        setSelectedProductIds(story?.productIds || []);
    }, [story]);

    const handleSave = (status: 'draft' | 'published') => {
        onSave({
            id: story?.id || '',
            title,
            content,
            featuredImageUrl,
            status,
            productIds: selectedProductIds,
        });
    };

    const toggleProduct = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    const filteredProducts = useMemo(() => 
        products.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase())),
    [products, productSearch]);

    return (
        <Card className="flex flex-col h-full">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Edit className="w-6 h-6 me-3 text-purple-500" />
                    {story?.id ? t('story_editor_title') : t('story_editor_new_story_title')}
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-grow space-y-6 pt-6 overflow-y-auto">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('story_title_label')}</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('story_title_placeholder')} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-50 dark:bg-gray-700/50 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="featuredImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('story_featured_image_label')}</label>
                    <input type="text" id="featuredImageUrl" value={featuredImageUrl} onChange={e => setFeaturedImageUrl(e.target.value)} placeholder={t('story_featured_image_placeholder')} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-50 dark:bg-gray-700/50 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('story_content_label')}</label>
                    <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={10} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-gray-50 dark:bg-gray-700/50 sm:text-sm font-mono"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('story_products_label')}</label>
                     <div className="relative mt-1">
                        <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder={t('story_products_search_placeholder')} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div className="mt-2 h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 space-y-1">
                        {filteredProducts.map(p => (
                            <button key={p.id} onClick={() => toggleProduct(p.id)} className={`w-full text-left p-2 rounded-md flex items-center justify-between transition-colors ${selectedProductIds.includes(p.id) ? 'bg-purple-100 dark:bg-purple-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.title}</span>
                                {selectedProductIds.includes(p.id) && <CheckCircle className="w-5 h-5 text-purple-600" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-shrink-0 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center gap-3">
                 <button onClick={() => handleSave('draft')} disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors flex items-center disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Save className="w-4 h-4 me-2"/>}
                    {isSaving ? t('story_saving_button') : t('story_save_draft_button')}
                 </button>
                 <button onClick={() => handleSave('published')} disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Send className="w-4 h-4 me-2"/>}
                    {isSaving ? t('story_saving_button') : t('story_publish_button')}
                 </button>
            </div>
        </Card>
    );
};


const StoryMagazinePage: React.FC = () => {
    const { 
        stories,
        isStoriesLoading,
        storiesError,
        saveStory
    } = useAppContext();
    const { t } = useTranslation();
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSelectStory = (story: Story) => {
        setSelectedStory(story);
        setIsEditorOpen(true);
    };

    const handleCreateNew = () => {
        setSelectedStory(null);
        setIsEditorOpen(true);
    };
    
    const handleCloseEditor = () => {
        setIsEditorOpen(false);
        setSelectedStory(null);
    };
    
    const handleSaveStory = async (storyData: Omit<Story, 'createdAt' | 'updatedAt' | 'slug'>) => {
        setIsSaving(true);
        await saveStory(storyData);
        setIsSaving(false);
        handleCloseEditor();
    }
    
    const StatusBadge: React.FC<{status: Story['status']}> = ({ status }) => {
        const { t } = useTranslation();
        const isPublished = status === 'published';
        return (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'}`}>
                {isPublished ? t('story_status_published') : t('story_status_draft')}
            </span>
        )
    };


    const renderContent = () => {
        if (isStoriesLoading) {
            return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 text-purple-500 animate-spin" /></div>;
        }
        if (storiesError) {
            return <ErrorDisplay message={storiesError} />;
        }
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <button onClick={handleCreateNew} className="w-full mb-4 bg-purple-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-700 transition-opacity">
                            <PlusCircle className="w-5 h-5"/>
                            <span>{t('story_create_new')}</span>
                        </button>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {stories.length > 0 ? stories.map(story => (
                                <button key={story.id} onClick={() => handleSelectStory(story)} className={`w-full p-3 rounded-lg text-left transition-colors ${selectedStory?.id === story.id ? 'bg-purple-100 dark:bg-purple-900/50' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{story.title}</p>
                                        <StatusBadge status={story.status} />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Updated: {new Date(story.updatedAt).toLocaleDateString()}</p>
                                </button>
                            )) : <p className="text-sm text-center text-gray-500 py-4">{t('story_no_stories')}</p>}
                        </div>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    {isEditorOpen ? (
                        <StoryEditor story={selectedStory} onSave={handleSaveStory} onClose={handleCloseEditor} isSaving={isSaving} />
                    ) : (
                        <Card>
                            <EmptyState onAction={handleCreateNew} title={t('story_select_to_edit')} subtitle="" buttonText={t('story_create_new')} />
                        </Card>
                    )}
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <LayoutTemplate className="w-8 h-8 me-3 text-purple-500" />
                        {t('story_magazine_page_title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('story_magazine_page_subtitle')}</p>
                </div>
            </div>
            
            {renderContent()}

        </div>
    );
};

export default StoryMagazinePage;