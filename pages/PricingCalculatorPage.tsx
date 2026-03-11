import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Download, RefreshCw } from 'lucide-react';

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
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
};

const FieldInput: React.FC<FieldInputProps> = ({ label, value, onChange, onBlur }) => (
  <div>
    <label className="text-xs text-gray-500">{label}</label>
    <input
      type="text"
      inputMode="decimal"
      className="mt-1 w-full p-2 rounded border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
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

  const [draftInputs, setDraftInputs] = useState<Record<keyof typeof inputs, string>>(() => {
    const init: any = {};
    (Object.keys(inputs) as Array<keyof typeof inputs>).forEach((k) => {
      init[k] = String(inputs[k]);
    });
    return init;
  });

  const bindField = (k: keyof typeof inputs, fallbackDecimals = 2) => ({
    value: draftInputs[k] ?? String(inputs[k]),
    onChange: (v: string) => setDraftInputs((p) => ({ ...p, [k]: v })),
    onBlur: () => {
      const raw = (draftInputs[k] ?? '').trim();
      const n = Number(raw);
      if (!raw || !Number.isFinite(n)) {
        const reset = String(inputs[k]);
        setDraftInputs((p) => ({ ...p, [k]: reset }));
        return;
      }
      setInputs((p) => ({ ...p, [k]: n }));
      setDraftInputs((p) => ({ ...p, [k]: String(Number(n.toFixed(fallbackDecimals))) }));
    },
  });

  const setTaxPreset = (rate: number) => {
    setInputs((p) => ({ ...p, taxRate: rate }));
    setDraftInputs((p) => ({ ...p, taxRate: String(rate) }));
  };

  const [isRefreshingMetals, setIsRefreshingMetals] = useState(false);
  const [metalStatus, setMetalStatus] = useState<string>('');

  const refreshMetalPrices = async () => {
    try {
      setIsRefreshingMetals(true);
      setMetalStatus('');

      const response = await fetch('/api/optimize?action=metal-prices');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to refresh metal prices');
      }

      const nextGold = Number(data.goldPricePerGram || 0);
      const nextPlatinum = Number(data.platinumPricePerGram || 0);
      const nextSilver = Number(data.silverPricePerGram || 0);
      const currentBaseWeight = inputs.baseWeightSize7;
      const suggestedSilverFixed = nextSilver > 0 ? nextSilver * currentBaseWeight : 0;

      setInputs((p) => ({
        ...p,
        goldPricePerGram: nextGold > 0 ? nextGold : p.goldPricePerGram,
        platinumPricePerGram: nextPlatinum > 0 ? nextPlatinum : p.platinumPricePerGram,
        silverFixedPrice: suggestedSilverFixed > 0 ? suggestedSilverFixed : p.silverFixedPrice,
      }));

      setDraftInputs((p) => ({
        ...p,
        goldPricePerGram: nextGold > 0 ? String(Number(nextGold.toFixed(2))) : p.goldPricePerGram,
        platinumPricePerGram: nextPlatinum > 0 ? String(Number(nextPlatinum.toFixed(2))) : p.platinumPricePerGram,
        silverFixedPrice: suggestedSilverFixed > 0 ? String(Number(suggestedSilverFixed.toFixed(2))) : p.silverFixedPrice,
      }));

      setMetalStatus(`Live metal prices updated (${new Date().toLocaleTimeString()}).`);
    } catch (error: any) {
      setMetalStatus(error?.message || 'Could not refresh metal prices.');
    } finally {
      setIsRefreshingMetals(false);
    }
  };

  useEffect(() => {
    refreshMetalPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <FieldInput label="Gold Price / g" {...bindField('goldPricePerGram')} />
          <FieldInput label="Platinum Price / g" {...bindField('platinumPricePerGram')} />
          <FieldInput label="Silver Fixed Price / Ring" {...bindField('silverFixedPrice')} />
          <FieldInput label="Base Weight Size 7 (g)" {...bindField('baseWeightSize7')} />

          <button
            onClick={refreshMetalPrices}
            disabled={isRefreshingMetals}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingMetals ? 'animate-spin' : ''}`} />
            {isRefreshingMetals ? 'Refreshing metal prices...' : 'Refresh Live Metal Prices (CAD)'}
          </button>
          {metalStatus && <p className="text-xs text-gray-500">{metalStatus}</p>}

          <hr className="border-gray-200 dark:border-gray-700" />
          <FieldInput label="Design" {...bindField('designCost')} />
          <FieldInput label="3D Printing" {...bindField('printing3DCost')} />
          <FieldInput label="Casting" {...bindField('castingCost')} />
          <FieldInput label="Soldering, Cleaning & Polishing" {...bindField('finishingCost')} />
          <FieldInput label="Plating" {...bindField('platingCost')} />
          <FieldInput label="Stone Setting" {...bindField('stoneSettingCost')} />
          <FieldInput label="Laser Engraving" {...bindField('engravingCost')} />
          <FieldInput label="Stone Price" {...bindField('stonePrice')} />
          <FieldInput label="Finding" {...bindField('findingCost')} />
          <FieldInput label="Tools" {...bindField('toolsCost')} />
          <FieldInput label="Packaging" {...bindField('packagingCost')} />
          <FieldInput label="Post (Shipping)" {...bindField('shippingCost')} />

          <hr className="border-gray-200 dark:border-gray-700" />
          <FieldInput label="Profit Margin (e.g. 0.30)" {...bindField('profitMargin', 4)} />

          <div>
            <label className="text-xs text-gray-500">Tax Rate</label>
            <input
              type="text"
              inputMode="decimal"
              className="mt-1 w-full p-2 rounded border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              value={draftInputs.taxRate}
              onChange={(e) => setDraftInputs((p) => ({ ...p, taxRate: e.target.value }))}
              onBlur={() => bindField('taxRate', 5).onBlur()}
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
            <tbody className="text-gray-900 dark:text-gray-200">
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="p-2">{r.size}</td>
                  <td className="p-2">{r.material}</td>
                  <td className="p-2">{r.adjustedWeight ? r.adjustedWeight.toFixed(2) : 'N/A'}</td>
                  <td className="p-2">${r.materialCost.toFixed(2)}</td>
                  <td className="p-2">${r.totalCostWithTax.toFixed(2)}</td>
                  <td className="p-2 font-bold text-gray-900 dark:text-white">${r.finalPrice.toFixed(2)}</td>
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
