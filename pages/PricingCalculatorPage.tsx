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

type FieldInputProps = {
  label: string;
  value: number;
  onChange: (v: string) => void;
};

const FieldInput: React.FC<FieldInputProps> = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs text-gray-500">{label}</label>
    <input
      type="number"
      step="0.01"
      className="mt-1 w-full p-2 rounded border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const PricingCalculatorPage: React.FC = () => {
  const [inputs, setInputs] = useState({
    goldPricePerGram: 85,
    platinumPricePerGram: 45,
    silverFixedPrice: 120,
    baseWeightSize7: 5,

    // required specific costs
    designCost: 50,
    printing3DCost: 20,
    castingCost: 35,
    finishingCost: 45, // soldering + cleaning + polishing
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

        const totalCostBeforeTax =
          materialCost +
          inputs.designCost +
          inputs.printing3DCost +
          inputs.castingCost +
          inputs.finishingCost +
          inputs.platingCost +
          inputs.stoneSettingCost +
          inputs.engravingCost +
          inputs.stonePrice +
          inputs.findingCost +
          inputs.toolsCost +
          inputs.packagingCost +
          inputs.shippingCost;

        const totalCostWithTax = totalCostBeforeTax * (1 + inputs.taxRate);
        const finalPrice = totalCostWithTax * (1 + inputs.profitMargin);
        const profitAmount = finalPrice - totalCostWithTax;

        return {
          size: s.size,
          material,
          adjustedWeight,
          materialCost,
          totalCostBeforeTax,
          totalCostWithTax,
          finalPrice,
          profitAmount,
        };
      })
    );
  }, [inputs]);

  const exportCsv = () => {
    const headers = [
      'Size',
      'Material',
      'Adjusted Weight (g)',
      'Material Cost (CAD)',
      'Total Cost Before Tax (CAD)',
      'Total Cost With Tax (CAD)',
      'Final Price (CAD)',
      'Profit Amount (CAD)',
    ];

    const body = rows.map((r) => [
      r.size,
      r.material,
      r.adjustedWeight?.toFixed(2) || '',
      r.materialCost.toFixed(2),
      r.totalCostBeforeTax.toFixed(2),
      r.totalCostWithTax.toFixed(2),
      r.finalPrice.toFixed(2),
      r.profitAmount.toFixed(2),
    ]);

    const csv = [headers, ...body].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dxb_pricing_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const setNum = (k: keyof typeof inputs, v: string) =>
    setInputs((p) => ({ ...p, [k]: Number(v || 0) }));

  const setTaxPreset = (rate: number) => setInputs((p) => ({ ...p, taxRate: rate }));


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-7 h-7" /> Pricing Calculator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Etsy-matched sizes (6-12), 3 materials, full cost breakdown, and tax presets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-4 max-h-[75vh] overflow-auto">
          <FieldInput label="Gold Price / g" value={inputs.goldPricePerGram} onChange={(v) => setNum('goldPricePerGram', v)} />
          <FieldInput label="Platinum Price / g" value={inputs.platinumPricePerGram} onChange={(v) => setNum('platinumPricePerGram', v)} />
          <FieldInput label="Silver Fixed Price / Ring" value={inputs.silverFixedPrice} onChange={(v) => setNum('silverFixedPrice', v)} />
          <FieldInput label="Base Weight Size 7 (g)" value={inputs.baseWeightSize7} onChange={(v) => setNum('baseWeightSize7', v)} />

          <hr className="border-gray-200 dark:border-gray-700" />
          <FieldInput label="Design" value={inputs.designCost} onChange={(v) => setNum('designCost', v)} />
          <FieldInput label="3D Printing" value={inputs.printing3DCost} onChange={(v) => setNum('printing3DCost', v)} />
          <FieldInput label="Casting" value={inputs.castingCost} onChange={(v) => setNum('castingCost', v)} />
          <FieldInput label="Soldering, Cleaning & Polishing" value={inputs.finishingCost} onChange={(v) => setNum('finishingCost', v)} />
          <FieldInput label="Plating" value={inputs.platingCost} onChange={(v) => setNum('platingCost', v)} />
          <FieldInput label="Stone Setting" value={inputs.stoneSettingCost} onChange={(v) => setNum('stoneSettingCost', v)} />
          <FieldInput label="Laser Engraving" value={inputs.engravingCost} onChange={(v) => setNum('engravingCost', v)} />
          <FieldInput label="Stone Price" value={inputs.stonePrice} onChange={(v) => setNum('stonePrice', v)} />
          <FieldInput label="Finding" value={inputs.findingCost} onChange={(v) => setNum('findingCost', v)} />
          <FieldInput label="Tools" value={inputs.toolsCost} onChange={(v) => setNum('toolsCost', v)} />
          <FieldInput label="Packaging" value={inputs.packagingCost} onChange={(v) => setNum('packagingCost', v)} />
          <FieldInput label="Post (Shipping)" value={inputs.shippingCost} onChange={(v) => setNum('shippingCost', v)} />

          <hr className="border-gray-200 dark:border-gray-700" />
          <FieldInput label="Profit Margin (e.g. 0.30)" value={inputs.profitMargin} onChange={(v) => setNum('profitMargin', v)} />

          <div>
            <label className="text-xs text-gray-500">Tax Rate</label>
            <input
              type="number"
              step="0.0001"
              className="mt-1 w-full p-2 rounded border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              value={inputs.taxRate}
              onChange={(e) => setNum('taxRate', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => setTaxPreset(0.14975)} className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700">QC (14.975%)</button>
              <button onClick={() => setTaxPreset(0.13)} className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700">ON (13%)</button>
              <button onClick={() => setTaxPreset(0.05)} className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700">GST (5%)</button>
              <button onClick={() => setTaxPreset(0)} className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700">NONE (0%)</button>
            </div>
          </div>

          <button onClick={exportCsv} className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 overflow-auto max-h-[75vh]">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="p-2">Size</th>
                <th className="p-2">Material</th>
                <th className="p-2">Weight(g)</th>
                <th className="p-2">Material Cost</th>
                <th className="p-2">Cost+Tax</th>
                <th className="p-2">Final Price</th>
                <th className="p-2">Profit (CAD)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-2">{r.size}</td>
                  <td className="p-2">{r.material}</td>
                  <td className="p-2">{r.adjustedWeight ? r.adjustedWeight.toFixed(2) : 'N/A'}</td>
                  <td className="p-2">${r.materialCost.toFixed(2)}</td>
                  <td className="p-2">${r.totalCostWithTax.toFixed(2)}</td>
                  <td className="p-2 font-semibold">${r.finalPrice.toFixed(2)}</td>
                  <td className="p-2">${r.profitAmount.toFixed(2)}</td>
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
