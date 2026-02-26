import React, { useMemo, useState } from 'react';
import { Calculator, Download } from 'lucide-react';

type Material = '14k Gold' | 'Platinum' | 'Silver 925';

type RingSize = { size: string; circumference: number };

const RING_SIZES: RingSize[] = [
  { size: '6', circumference: 51.9 },
  { size: '7', circumference: 54.4 },
  { size: '8', circumference: 57.0 },
  { size: '9', circumference: 59.5 },
  { size: '10', circumference: 62.1 },
  { size: '11', circumference: 64.6 },
  { size: '12', circumference: 67.2 },
];

const BASE = 54.4;

const PricingCalculatorPage: React.FC = () => {
  const [inputs, setInputs] = useState({
    goldPricePerGram: 85,
    platinumPricePerGram: 45,
    silverFixedPrice: 120,
    baseWeightSize7: 5,
    designCost: 50,
    printing3DCost: 20,
    castingCost: 35,
    finishingCost: 45,
    platingCost: 15,
    stoneSettingCost: 0,
    engravingCost: 10,
    stonePrice: 0,
    findingCost: 5,
    toolsCost: 2,
    packagingCost: 15,
    shippingCost: 25,
    taxRate: 0.14975,
    profitMargin: 0.3,
  });

  const rows = useMemo(() => {
    const materials: Material[] = ['14k Gold', 'Platinum', 'Silver 925'];
    return materials.flatMap((material) =>
      RING_SIZES.map((s) => {
        let adjustedWeight: number | null = null;
        let materialCost = 0;

        if (material === 'Silver 925') {
          materialCost = inputs.silverFixedPrice;
        } else {
          adjustedWeight = inputs.baseWeightSize7 * (s.circumference / BASE);
          const ppg = material === '14k Gold' ? inputs.goldPricePerGram : inputs.platinumPricePerGram;
          materialCost = adjustedWeight * ppg;
        }

        const costBeforeTax = materialCost +
          inputs.designCost + inputs.printing3DCost + inputs.castingCost + inputs.finishingCost +
          inputs.platingCost + inputs.stoneSettingCost + inputs.engravingCost + inputs.stonePrice +
          inputs.findingCost + inputs.toolsCost + inputs.packagingCost + inputs.shippingCost;

        const totalWithTax = costBeforeTax * (1 + inputs.taxRate);
        const finalPrice = totalWithTax * (1 + inputs.profitMargin);

        return {
          size: s.size,
          material,
          adjustedWeight,
          finalPrice,
        };
      })
    );
  }, [inputs]);

  const exportCsv = () => {
    const headers = ['Size', 'Material', 'Adjusted Weight (g)', 'Final Price (CAD)'];
    const body = rows.map((r) => [r.size, r.material, r.adjustedWeight?.toFixed(2) || '', r.finalPrice.toFixed(2)]);
    const csv = [headers, ...body].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dxb_pricing_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const setNum = (k: keyof typeof inputs, v: string) => setInputs((p) => ({ ...p, [k]: Number(v || 0) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Calculator className="w-7 h-7" /> Pricing Calculator</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Ring pricing for 3 materials × 17 sizes, with CSV export.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
          {[
            ['goldPricePerGram', 'Gold $/g'], ['platinumPricePerGram', 'Platinum $/g'], ['silverFixedPrice', 'Silver fixed'],
            ['baseWeightSize7', 'Base Weight size 7'], ['taxRate', 'Tax rate'], ['profitMargin', 'Profit margin']
          ].map(([k, label]) => (
            <div key={k}>
              <label className="text-xs text-gray-500">{label}</label>
              <input type="number" step="0.01" className="mt-1 w-full p-2 rounded border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                value={(inputs as any)[k]} onChange={(e) => setNum(k as any, e.target.value)} />
            </div>
          ))}
          <button onClick={exportCsv} className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg"><Download className="w-4 h-4" /> Export CSV</button>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="p-2">Size</th><th className="p-2">Material</th><th className="p-2">Weight(g)</th><th className="p-2">Final Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-2">{r.size}</td>
                  <td className="p-2">{r.material}</td>
                  <td className="p-2">{r.adjustedWeight ? r.adjustedWeight.toFixed(2) : 'N/A'}</td>
                  <td className="p-2">${r.finalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculatorPage;
