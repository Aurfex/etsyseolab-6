import React from 'react';
import { Product, OptimizationResult } from '../types';
import { ArrowRight, Tag, FileText, Image, CheckCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  optimizedResult?: OptimizationResult;
  isDryRun: boolean;
}

const DataField: React.FC<{ label: string; original: React.ReactNode; optimized?: React.ReactNode; icon: React.ReactNode; isDryRun: boolean; isApplied: boolean }> = ({ label, original, optimized, icon, isDryRun, isApplied }) => {
  const showOptimized = optimized !== undefined;
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center">{icon}{label}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="bg-gray-900/70 p-3 rounded-lg text-sm text-gray-300">
          <p className="font-medium mb-1 text-gray-400">Original</p>
          {original}
        </div>
        <div className={`relative p-3 rounded-lg text-sm ${showOptimized ? 'bg-primary-900/20 border border-primary-500/30' : 'bg-gray-900/70 text-gray-500 italic'}`}>
          <div className="absolute -left-5 top-1/2 -translate-y-1/2 hidden md:block">
            <ArrowRight className={`w-4 h-4 ${showOptimized ? 'text-primary-400' : 'text-gray-600'}`} />
          </div>
          <p className="font-medium mb-1 text-primary-400">Optimized</p>
          {showOptimized ? optimized : 'Awaiting optimization...'}
          {showOptimized && !isDryRun && isApplied && (
            <div className="absolute top-2 right-2 flex items-center text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3 mr-1" />
              Applied
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({ product, optimizedResult, isDryRun }) => {
  const isTitleApplied = !isDryRun && product.title === optimizedResult?.title;
  const isDescriptionApplied = !isDryRun && product.description === optimizedResult?.description;
  const isTagsApplied = !isDryRun && JSON.stringify(product.tags) === JSON.stringify(optimizedResult?.tags);

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden backdrop-blur-sm">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 flex-shrink-0">
            <img src={product.imageUrl} alt={product.title} className="rounded-lg object-cover w-full h-48 md:h-full border border-gray-700" />
            <div className="mt-4">
              <DataField
                label="Image Details"
                icon={<Image className="w-4 h-4 mr-2" />}
                isDryRun={isDryRun}
                isApplied={!isDryRun}
                original={
                    <>
                        <p className="font-semibold">Filename:</p>
                        <p className="break-all text-gray-400">{product.imageFilename}</p>
                        <p className="font-semibold mt-2">Alt Text:</p>
                        <p className="italic text-gray-500">Not set</p>
                    </>
                }
                optimized={optimizedResult && (
                    <>
                        <p className="font-semibold">Filename:</p>
                        <p className="break-all text-primary-300">{`${optimizedResult.title.toLowerCase().replace(/\s+/g, '-').substring(0,50)}.jpg`}</p>
                        <p className="font-semibold mt-2">Alt Text:</p>
                        <p className="text-primary-300">{optimizedResult.altText}</p>
                    </>
                )}
              />
            </div>
          </div>
          <div className="w-full md:w-2/3 space-y-6">
            <DataField
              label="Product Title"
              icon={<FileText className="w-4 h-4 mr-2" />}
              original={product.title}
              optimized={optimizedResult?.title}
              isDryRun={isDryRun}
              isApplied={isTitleApplied}
            />
            <DataField
              label="Product Description"
              icon={<FileText className="w-4 h-4 mr-2" />}
              original={<p className="whitespace-pre-wrap">{product.description}</p>}
              optimized={optimizedResult && <p className="whitespace-pre-wrap">{optimizedResult.description}</p>}
              isDryRun={isDryRun}
              isApplied={isDescriptionApplied}
            />
            <DataField
              label="Etsy Tags"
              icon={<Tag className="w-4 h-4 mr-2" />}
              original={
                <div className="flex flex-wrap gap-2">
                  {product.tags.map(tag => <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-medium">{tag}</span>)}
                </div>
              }
              optimized={optimizedResult && (
                <div className="flex flex-wrap gap-2">
                  {optimizedResult.tags.map(tag => <span key={tag} className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-xs font-medium">{tag}</span>)}
                </div>
              )}
              isDryRun={isDryRun}
              isApplied={isTagsApplied}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;