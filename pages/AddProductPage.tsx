import React, { useState, useMemo, ChangeEvent, DragEvent } from 'react';
import { PlusSquare, Info, UploadCloud, Sparkles, Eye, Send, ArrowLeft, Loader2, X, Tag, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from '../contexts/LanguageContext';
import { NewProductData } from '../types';
import { compareSeoWithCompetitors } from '../services/etsyApiService';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card dark:shadow-card-dark ${className}`}>
    {children}
  </div>
);

const AddProductPage: React.FC = () => {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const steps = [
        'Analyze + Basics',
        'AI SEO',
        'Review & Publish',
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                    <PlusSquare className="w-8 h-8 me-3 text-purple-500" />
                    {t('add_product_page_title')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('add_product_page_subtitle')}</p>
            </div>

            <Card>
                <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {steps.map((stepName, i) => (
                        <div key={stepName} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            currentStep === i + 1
                            ? 'border-purple-500 text-purple-600'
                            : 'border-transparent text-gray-500'
                        }`}>
                            <span className={`w-6 h-6 rounded-full me-2 inline-flex items-center justify-center text-xs ${currentStep > i ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{i + 1}</span>
                            {stepName}
                        </div>
                        ))}
                    </nav>
                </div>
                
                {currentStep === 1 && <Step2 onNext={() => setCurrentStep(2)} />}
                {currentStep === 2 && <Step3 onNext={() => setCurrentStep(3)} onPrev={() => setCurrentStep(1)} />}
                {currentStep === 3 && <Step4 onPrev={() => setCurrentStep(2)} />}

            </Card>
        </div>
    );
};

// Step 1: Basic Info
const Step1: React.FC<{onNext: () => void; onPrev?: () => void}> = ({ onNext, onPrev }) => {
    const { t } = useTranslation();
    const { newProductData, updateNewProductData, etsyCategories, showToast } = useAppContext();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean = value;
        if (type === 'number') finalValue = parseFloat(value);
        if (name === 'is_supply') finalValue = value === 'true';
        updateNewProductData({ [name]: finalValue });
    };

    const handleNext = () => {
        if (!newProductData.title || !newProductData.taxonomy_id || !newProductData.price || !newProductData.quantity) {
            showToast({tKey: 'add_product_validation_error', type: 'error'});
            return;
        }
        onNext();
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_title_label')}</label>
                    <input type="text" name="title" id="title" value={newProductData.title} onChange={handleChange} placeholder={t('add_product_title_placeholder')} className="mt-1 block w-full input-field" />
                </div>
                <div>
                    <label htmlFor="taxonomy_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_category_label')}</label>
                    <select name="taxonomy_id" id="taxonomy_id" value={newProductData.taxonomy_id || ''} onChange={handleChange} className="mt-1 block w-full input-field">
                        <option value="">{t('add_product_select_category')}</option>
                        {etsyCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.path}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_price_label')}</label>
                    <input type="number" name="price" id="price" value={newProductData.price || ''} min="0" step="0.01" onChange={handleChange} className="mt-1 block w-full input-field" />
                </div>
                 <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_quantity_label')}</label>
                    <input type="number" name="quantity" id="quantity" value={newProductData.quantity || ''} min="1" step="1" onChange={handleChange} className="mt-1 block w-full input-field" />
                </div>
                 <div>
                    <label htmlFor="who_made" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_who_made_label')}</label>
                    <select name="who_made" id="who_made" value={newProductData.who_made} onChange={handleChange} className="mt-1 block w-full input-field">
                        <option value="i_did">{t('add_product_who_made_i_did')}</option>
                        <option value="collective">{t('add_product_who_made_collective')}</option>
                        <option value="someone_else">{t('add_product_who_made_someone_else')}</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="when_made" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_when_made_label')}</label>
                    <select name="when_made" id="when_made" value={newProductData.when_made} onChange={handleChange} className="mt-1 block w-full input-field">
                        <option value="made_to_order">{t('add_product_when_made_to_order')}</option>
                        <option value="2020_2024">{t('add_product_when_made_2020_2024')}</option>
                        <option value="2010_2019">{t('add_product_when_made_2010_2019')}</option>
                        <option value="before_2010">{t('add_product_when_made_before_2010')}</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_is_supply_label')}</label>
                    <div className="mt-2 flex gap-4">
                        <label className="flex items-center"><input type="radio" name="is_supply" value="false" checked={newProductData.is_supply === false} onChange={handleChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300" /> <span className="ml-2">{t('add_product_no')}</span></label>
                        <label className="flex items-center"><input type="radio" name="is_supply" value="true" checked={newProductData.is_supply === true} onChange={handleChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300" /> <span className="ml-2">{t('add_product_yes')}</span></label>
                    </div>
                </div>
            </div>
            <div className="flex justify-between">
                {onPrev ? (
                    <button onClick={onPrev} className="btn-secondary flex items-center"><ArrowLeft className="w-4 h-4 me-2"/>{t('add_product_prev_step')}</button>
                ) : <span />}
                <button onClick={handleNext} className="btn-primary">{t('add_product_next_step')}</button>
            </div>
        </div>
    );
};

// Step 1: Image Analyze + Basic Info
const Step2: React.FC<{onNext: () => void; onPrev?: () => void}> = ({ onNext, onPrev }) => {
    const { t } = useTranslation();
    const { newProductData, updateNewProductData, showToast, etsyCategories, generateSeoMetadata } = useAppContext();
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImprovingSeo, setIsImprovingSeo] = useState(false);
    const [seoInsight, setSeoInsight] = useState<{ yourScore: number; yourRank: number; totalCompared: number; avgTopScore: number; topCompetitorTitle: string | null; recommendations: string[] } | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean = value;
        if (type === 'number') finalValue = parseFloat(value);
        if (name === 'is_supply') finalValue = value === 'true';
        updateNewProductData({ [name]: finalValue });
    };

    const inferTaxonomyFromHint = (hint: string, title: string, tags: string[]) => {
        const hay = `${hint} ${title} ${(tags || []).join(' ')}`.toLowerCase();
        const byScore = etsyCategories
            .map(cat => {
                const p = (cat.path || '').toLowerCase();
                let score = 0;
                const parts = p.split('>').map(s => s.trim());
                for (const part of parts) if (part && hay.includes(part)) score += 3;
                const tokens = p.split(/[^a-z0-9]+/).filter(Boolean);
                for (const tk of tokens) if (tk.length > 2 && hay.includes(tk)) score += 1;
                return { id: cat.id, score };
            })
            .sort((a, b) => b.score - a.score);
        return byScore[0]?.score > 0 ? byScore[0].id : null;
    };

    const handleAnalyze = async () => {
        if (!newProductData.images?.length) {
            showToast({ tKey: 'add_product_validation_error', type: 'error' });
            return;
        }
        setIsAnalyzing(true);
        try {
            const result = await generateSeoMetadata(
                { title: newProductData.title || '', description: newProductData.description || '' },
                newProductData.images || []
            );

            const suggestion = result.suggestedBasics || {};
            const taxonomyId = inferTaxonomyFromHint(
                String(suggestion.categoryHint || ''),
                result.title || '',
                result.tags || []
            );

            const productSignals = `${result.title || ''} ${String(suggestion.categoryHint || '')} ${(result.tags || []).join(' ')}`.toLowerCase();
            const looksLikeFinishedJewelry = /(ring|necklace|bracelet|earring|pendant|jewelry|jewellery|wedding|engagement)/.test(productSignals);
            const suggestedSupply = typeof suggestion.is_supply === 'boolean' ? suggestion.is_supply : false;
            const finalIsSupply = looksLikeFinishedJewelry ? false : suggestedSupply;

            const nextTitle = result.title || newProductData.title || '';
            const nextDescription = result.description || newProductData.description || '';
            const nextTags = result.tags || newProductData.tags || [];

            updateNewProductData({
                title: nextTitle,
                description: nextDescription,
                tags: nextTags,
                imageAltTexts: result.imageAltTexts && result.imageAltTexts.length
                    ? result.imageAltTexts
                    : newProductData.imageAltTexts,
                taxonomy_id: taxonomyId || newProductData.taxonomy_id || null,
                price: Number(suggestion.price || newProductData.price || 29.99),
                quantity: Number(suggestion.quantity || newProductData.quantity || 1),
                who_made: (suggestion.who_made as any) || newProductData.who_made || 'i_did',
                when_made: (suggestion.when_made as any) || newProductData.when_made || 'made_to_order',
                is_supply: finalIsSupply,
            });

            try {
                const compare = await compareSeoWithCompetitors({
                    title: nextTitle,
                    description: nextDescription,
                    tags: nextTags,
                });
                setSeoInsight(compare);
            } catch {
                setSeoInsight(null);
            }

            showToast({ tKey: 'toast_metadata_generated', type: 'success' });
        } catch (e: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileChange = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        const currentImages = newProductData.images || [];
        const currentAlts = newProductData.imageAltTexts || [];

        if (currentImages.length + newFiles.length > 20) {
            showToast({tKey: 'add_product_image_rules', type: 'error'});
            return;
        }

        const baseTitle = (newProductData.title || 'Product').trim();
        const appendedAlts = newFiles.map((_, idx) => `${baseTitle} image ${currentImages.length + idx + 1}`);

        updateNewProductData({ images: [...currentImages, ...newFiles], imageAltTexts: [...currentAlts, ...appendedAlts] });
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    };

    const removeImage = (index: number) => {
        const updatedImages = [...(newProductData.images || [])];
        const updatedAlts = [...(newProductData.imageAltTexts || [])];
        updatedImages.splice(index, 1);
        updatedAlts.splice(index, 1);
        updateNewProductData({ images: updatedImages, imageAltTexts: updatedAlts });
    };

    const updateImageAlt = (index: number, value: string) => {
        const updatedAlts = [...(newProductData.imageAltTexts || [])];
        updatedAlts[index] = value;
        updateNewProductData({ imageAltTexts: updatedAlts });
    };

    const handleImproveSeo = async () => {
        setIsImprovingSeo(true);
        try {
            const improved = await generateSeoMetadata(
                { title: newProductData.title || '', description: newProductData.description || '' },
                newProductData.images || []
            );

            const nextTitle = improved.title || newProductData.title || '';
            const nextDescription = improved.description || newProductData.description || '';
            const nextTags = improved.tags || newProductData.tags || [];

            updateNewProductData({
                title: nextTitle,
                description: nextDescription,
                tags: nextTags,
                imageAltTexts: improved.imageAltTexts && improved.imageAltTexts.length
                    ? improved.imageAltTexts
                    : newProductData.imageAltTexts,
            });

            const compare = await compareSeoWithCompetitors({
                title: nextTitle,
                description: nextDescription,
                tags: nextTags,
            });
            setSeoInsight(compare);
            showToast({ tKey: 'toast_metadata_generated', type: 'success' });
        } catch (e: any) {
            showToast({ tKey: 'toast_generic_error_with_message', options: { message: e.message }, type: 'error' });
        } finally {
            setIsImprovingSeo(false);
        }
    };

    const handleNext = () => {
        if (!newProductData.images?.length || !newProductData.title || !newProductData.taxonomy_id || !newProductData.price || !newProductData.quantity) {
            showToast({ tKey: 'add_product_validation_error', type: 'error' });
            return;
        }
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Upload Images + Analyze</h3>
                    <p className="text-sm text-gray-500">Upload photos, then click Analyze to auto-fill listing basics.</p>
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !(newProductData.images && newProductData.images.length)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                </button>
            </div>

            <div onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${isDragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none">
                        <span>{t('add_product_image_upload_cta')}</span>
                        <input id="file-upload" name="file-upload" type="file" multiple accept="image/png, image/jpeg" className="sr-only" onChange={(e) => handleFileChange(e.target.files)} />
                    </label>
                    <p className="text-xs text-gray-500">{t('add_product_image_rules')}</p>
                </div>
            </div>

            {newProductData.images && newProductData.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newProductData.images.map((file, index) => (
                        <div key={index} className="relative group border border-gray-200 dark:border-gray-700 rounded-md p-2">
                            <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded-md" />
                            <button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                            <input type="text" value={(newProductData.imageAltTexts || [])[index] || ''} onChange={(e) => updateImageAlt(index, e.target.value)} placeholder="Image alt text (required)" className="mt-2 block w-full input-field text-xs" maxLength={140} />
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_title_label')}</label>
                    <input type="text" name="title" id="title" value={newProductData.title || ''} onChange={handleChange} className="mt-1 block w-full input-field" />
                </div>
                <div>
                    <label htmlFor="taxonomy_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_category_label')}</label>
                    <select name="taxonomy_id" id="taxonomy_id" value={newProductData.taxonomy_id || ''} onChange={handleChange} className="mt-1 block w-full input-field">
                        <option value="">{t('add_product_select_category')}</option>
                        {etsyCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.path}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_price_label')}</label>
                    <input type="number" name="price" id="price" value={newProductData.price || ''} min="0" step="0.01" onChange={handleChange} className="mt-1 block w-full input-field" />
                </div>
                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_quantity_label')}</label>
                    <input type="number" name="quantity" id="quantity" value={newProductData.quantity || ''} min="1" step="1" onChange={handleChange} className="mt-1 block w-full input-field" />
                </div>
                <div>
                    <label htmlFor="who_made" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_who_made_label')}</label>
                    <select name="who_made" id="who_made" value={newProductData.who_made} onChange={handleChange} className="mt-1 block w-full input-field">
                        <option value="i_did">{t('add_product_who_made_i_did')}</option>
                        <option value="collective">{t('add_product_who_made_collective')}</option>
                        <option value="someone_else">{t('add_product_who_made_someone_else')}</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="when_made" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_when_made_label')}</label>
                    <select name="when_made" id="when_made" value={newProductData.when_made} onChange={handleChange} className="mt-1 block w-full input-field">
                        <option value="made_to_order">{t('add_product_when_made_to_order')}</option>
                        <option value="2020_2024">{t('add_product_when_made_2020_2024')}</option>
                        <option value="2010_2019">{t('add_product_when_made_2010_2019')}</option>
                        <option value="before_2010">{t('add_product_when_made_before_2010')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_is_supply_label')}</label>
                    <div className="mt-2 flex gap-4">
                        <label className="flex items-center"><input type="radio" name="is_supply" value="false" checked={newProductData.is_supply === false} onChange={handleChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300" /> <span className="ml-2">{t('add_product_no')}</span></label>
                        <label className="flex items-center"><input type="radio" name="is_supply" value="true" checked={newProductData.is_supply === true} onChange={handleChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300" /> <span className="ml-2">{t('add_product_yes')}</span></label>
                    </div>
                </div>
            </div>

            {seoInsight && (
                <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-900/20 p-4 space-y-2">
                    {(() => {
                        const englishOnly = (seoInsight.recommendations || []).filter(r => !(/[\u0600-\u06FF]/.test(String(r))));
                        return (
                            <>
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-purple-800 dark:text-purple-200">Etsy SEO Score</h4>
                                    <span className="text-sm font-bold text-purple-700 dark:text-purple-300">{seoInsight.yourScore}/100</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">Rank: #{seoInsight.yourRank} of {seoInsight.totalCompared} | Top avg: {seoInsight.avgTopScore}</p>
                                {seoInsight.topCompetitorTitle && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Top competitor: {seoInsight.topCompetitorTitle}</p>
                                )}
                                {englishOnly.length > 0 && (
                                    <ul className="text-xs list-disc ps-5 text-gray-700 dark:text-gray-300 space-y-1">
                                        {englishOnly.slice(0, 3).map((r, i) => <li key={i}>{r}</li>)}
                                    </ul>
                                )}
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={handleImproveSeo}
                                        disabled={isImprovingSeo}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isImprovingSeo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {isImprovingSeo ? 'Improving SEO...' : 'Apply Suggestions & Re-score'}
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            <div className="flex justify-between">
                {onPrev ? (<button onClick={onPrev} className="btn-secondary flex items-center"><ArrowLeft className="w-4 h-4 me-2"/>{t('add_product_prev_step')}</button>) : <span />}
                <button onClick={handleNext} className="btn-primary">{t('add_product_next_step')}</button>
            </div>
        </div>
    );
};

// Step 3: AI SEO
const Step3: React.FC<{onNext: () => void; onPrev: () => void}> = ({ onNext, onPrev }) => {
    const { t } = useTranslation();
    const { newProductData, updateNewProductData, generateSeoMetadata, showToast } = useAppContext();
    const [isGenerating, setIsGenerating] = useState(false);
    const [tagInput, setTagInput] = useState('');

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await generateSeoMetadata(
                { title: newProductData.title || '', description: newProductData.description || '' },
                newProductData.images || []
            );
        } catch(e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if ((newProductData.tags || []).length < 13) {
                const newTag = tagInput.trim().slice(0, 20);
                if (!newProductData.tags?.includes(newTag)) {
                    updateNewProductData({ tags: [...(newProductData.tags || []), newTag] });
                }
                setTagInput('');
            }
        }
    };
    
    const removeTag = (tagToRemove: string) => {
        updateNewProductData({ tags: newProductData.tags?.filter(tag => tag !== tagToRemove) });
    };

    const handleNext = () => {
        if (!newProductData.description || !newProductData.tags || newProductData.tags.length === 0) {
            showToast({tKey: 'add_product_validation_error', type: 'error'});
            return;
        }
        onNext();
    }

    return (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold">{t('add_product_ai_seo_title')}</h3>
                    <p className="text-sm text-gray-500">{t('add_product_ai_seo_subtitle')}</p>
                    <p className="text-xs text-purple-600 mt-1">Images are analyzed in step 1. Here you can regenerate/refine SEO text if needed.</p>
                </div>
                 <button onClick={handleGenerate} disabled={isGenerating || !(newProductData.images && newProductData.images.length)} className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                    {isGenerating ? t('add_product_generating_button') : 'Generate from uploaded images'}
                 </button>
            </div>
             <div>
                <label htmlFor="ai-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_title_label')}</label>
                <input type="text" name="title" id="ai-title" value={newProductData.title} onChange={(e) => updateNewProductData({ title: e.target.value })} maxLength={140} className="mt-1 block w-full input-field" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_description_label')}</label>
                <textarea name="description" id="description" value={newProductData.description} onChange={(e) => updateNewProductData({ description: e.target.value })} rows={6} className="mt-1 block w-full input-field font-mono"></textarea>
            </div>
            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('add_product_tags_label')}</label>
                <div className="mt-1">
                    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md min-h-[40px]">
                        {newProductData.tags?.map(tag => (
                            <span key={tag} className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-sm font-medium px-2 py-1 rounded-full">
                                {tag}
                                <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                        {(newProductData.tags?.length || 0) < 13 && (
                            <input 
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder={t('add_product_tags_placeholder')}
                                className="bg-transparent focus:outline-none flex-1 min-w-[100px]"
                                maxLength={20}
                            />
                        )}
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('add_product_tags_info')}</p>
            </div>
            <div className="flex justify-between">
                <button onClick={onPrev} className="btn-secondary flex items-center"><ArrowLeft className="w-4 h-4 me-2"/>{t('add_product_prev_step')}</button>
                <button onClick={handleNext} className="btn-primary">{t('add_product_next_step')}</button>
            </div>
        </div>
    );
};

// Step 4: Preview
const Step4: React.FC<{onPrev: () => void}> = ({ onPrev }) => {
    const { t } = useTranslation();
    const { newProductData, publishNewProduct, etsyCategories } = useAppContext();
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            await publishNewProduct(newProductData as NewProductData);
            // On success, we could redirect or show a success message. Context handles reset.
        } catch(e) {
            console.error(e);
        } finally {
            setIsPublishing(false);
        }
    }
    
    const categoryName = etsyCategories.find(c => c.id === newProductData.taxonomy_id)?.path;

    return (
         <div className="space-y-6">
             <div>
                <h3 className="text-lg font-bold">{t('add_product_review_title')}</h3>
                <p className="text-sm text-gray-500">{t('add_product_review_subtitle')}</p>
            </div>
            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{newProductData.title}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <p><strong className="text-gray-500">{t('add_product_price_label')}:</strong> ${newProductData.price}</p>
                    <p><strong className="text-gray-500">{t('add_product_quantity_label')}:</strong> {newProductData.quantity}</p>
                    <p><strong className="text-gray-500">{t('add_product_category_label')}:</strong> {categoryName}</p>
                </div>
                 <div>
                    <strong className="text-gray-500 text-sm">{t('add_product_description_label')}:</strong>
                    <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 mt-1 text-sm">{newProductData.description}</p>
                </div>
                 <div>
                    <strong className="text-gray-500 text-sm">{t('add_product_tags_label')}:</strong>
                     <div className="flex flex-wrap gap-2 mt-1">
                        {newProductData.tags?.map(tag => (
                            <span key={tag} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs font-medium">{tag}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <strong className="text-gray-500 text-sm">{t('add_product_step_2')}:</strong>
                     <div className="flex flex-wrap gap-2 mt-1">
                        {newProductData.images?.map((file, index) => (
                           <img key={index} src={URL.createObjectURL(file)} className="h-20 w-20 object-cover rounded-md" alt={`final preview ${index}`} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-between">
                <button onClick={onPrev} className="btn-secondary flex items-center"><ArrowLeft className="w-4 h-4 me-2"/>{t('add_product_prev_step')}</button>
                <button onClick={handlePublish} disabled={isPublishing} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2">
                    {isPublishing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                    {isPublishing ? t('add_product_publishing_button') : t('add_product_publish_button')}
                </button>
            </div>
        </div>
    );
};

export default AddProductPage;