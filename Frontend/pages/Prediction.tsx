import React, { useState } from 'react';
import { useAuth } from '../App';

type FormState = {
  temperature: string;
  dissolvedOxygen: string;
  ph: string;
  conductivity: string;
  bod: string;
  nitrate: string;
  fecalColiform: string;
  totalColiform: string;
};

const initialState: FormState = {
  temperature: '',
  dissolvedOxygen: '',
  ph: '',
  conductivity: '',
  bod: '',
  nitrate: '',
  fecalColiform: '',
  totalColiform: '',
};

const Prediction: React.FC = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<FormState>(initialState);
  const [waterType, setWaterType] = useState<'river' | 'tap'>('river');
  const [showForm, setShowForm] = useState(false);

  // Tap parameters: Low/Average/High selections
  type TapParam = { name: string; value: 'Low' | 'Average' | 'High'; description?: string };
  type TapPayload = {
    ph: number;
    Hardness: number;
    Chloramines: number;
    Sulfate: number;
    Turbidity: number;
  };

  const [tapParams, setTapParams] = useState<TapParam[]>([
    { name: 'pH Level', value: 'Average', description: 'pH of tap water' },
    { name: 'Hardness', value: 'Average', description: 'Hardness (scale)' },
    { name: 'Chloramines', value: 'Average', description: 'Chloramine level' },
    { name: 'Sulfate', value: 'Average', description: 'Sulfate level' },
    { name: 'Turbidity', value: 'Average', description: 'Cloudiness (NTU)' },
  ]);

  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------- Handlers ----------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTapParamChange = (name: string, value: 'Low' | 'Average' | 'High') => {
    setTapParams(prev => prev.map(p => (p.name === name ? { ...p, value } : p)));
  };

  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Tap L/A/H → numeric ranges (aligned with training thresholds you used)
  const convertTapToNumeric = (params: TapParam[]): TapPayload => {
    // Default
    const numeric: TapPayload = {
      ph: 7,
      Hardness: 200,
      Chloramines: 7,
      Sulfate: 320,
      Turbidity: 4,
    };

    params.forEach(p => {
      const key = p.name.toLowerCase();
      const v = p.value;

      // Training reference:
      // ph:        Low < 5.11, Avg 5.11–9.07, High > 9.07
      // Hardness:  Low < 154.5, Avg 154.5–235.8, High > 235.8
      // Chloram.:  Low < 5.19, Avg 5.19–9.14, High > 9.14
      // Sulfate:   Low < 283.2, Avg 283.2–384.8, High > 384.8
      // Turbidity: Low < 2.94, Avg 2.94–4.96, High > 4.96

      if (key.includes('ph')) {
        if (v === 'Low') numeric.ph = randomInt(1, 5);
        else if (v === 'Average') numeric.ph = randomInt(6, 9);
        else numeric.ph = randomInt(10, 14);
      }

      if (key.includes('hard')) {
        if (v === 'Low') numeric.Hardness = randomInt(50, 150);
        else if (v === 'Average') numeric.Hardness = randomInt(155, 236);
        else numeric.Hardness = randomInt(237, 400);
      }

      if (key.includes('chlor')) {
        if (v === 'Low') numeric.Chloramines = randomInt(1, 5);
        else if (v === 'Average') numeric.Chloramines = randomInt(6, 9);
        else numeric.Chloramines = randomInt(10, 15);
      }

      if (key.includes('sulfate')) {
        if (v === 'Low') numeric.Sulfate = randomInt(50, 280);
        else if (v === 'Average') numeric.Sulfate = randomInt(284, 385);
        else numeric.Sulfate = randomInt(386, 600);
      }

      if (key.includes('turb')) {
        if (v === 'Low') numeric.Turbidity = randomInt(0, 2);
        else if (v === 'Average') numeric.Turbidity = randomInt(3, 5);
        else numeric.Turbidity = randomInt(6, 10);
      }
    });

    return numeric;
  };

  const resetAll = () => {
    setFormData(initialState);
    setPrediction(null);
    setError(null);
    setIsLoading(false);
    setTapParams([
      { name: 'pH Level', value: 'Average', description: 'pH of tap water' },
      { name: 'Hardness', value: 'Average', description: 'Hardness (scale)' },
      { name: 'Chloramines', value: 'Average', description: 'Chloramine level' },
      { name: 'Sulfate', value: 'Average', description: 'Sulfate level' },
      { name: 'Turbidity', value: 'Average', description: 'Cloudiness (NTU)' },
    ]);
  };

  // Generic submit (river/tap)
  const submitPrediction = async (payload: any, endpoint = '/api/prediction/predict') => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Prediction request failed');
      }

      const raw = String(result.prediction || '').trim();
      const normalized = raw.toLowerCase();

      // River mapping
      if (normalized.includes('pollut') || normalized.includes('not pot') || normalized.includes('unsafe')) {
        setPrediction('Polluted');
      } else if (normalized.includes('moderate') || normalized.includes('potable') || normalized.includes('safe')) {
        setPrediction('Moderate');
      } else {
        // Tap model: "Low" / "Average" / "High"
        setPrediction(raw);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching the prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRiverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitPrediction(formData, '/api/prediction/river');
  };

  const handleTapSubmit = async () => {
    const numericPayload = convertTapToNumeric(tapParams);
    console.log('Tap numeric payload:', numericPayload);
    await submitPrediction(numericPayload, '/api/prediction/tap-status');
  };

  // ---------------- Explanation block ----------------

  const renderExplanation = (pred: string) => {
    const normalized = pred.toLowerCase();

    // RIVER: Polluted
    if (pred === 'Polluted') {
      return (
        <div className="my-6 text-left">
          <h3 className="text-xl font-semibold mb-2">What does "Polluted" mean?</h3>
          <p className="text-gray-700 mb-4">
            Polluted water is unsafe for drinking or food preparation. It may contain high levels of harmful
            chemicals, biological contaminants (bacteria, viruses), or toxic substances which can cause
            immediate illness or long-term health problems.
          </p>

          <h3 className="text-xl font-semibold mb-2">Health Risks</h3>
          <ul className="list-inside list-disc text-gray-700 mb-4">
            <li>Gastrointestinal infections (diarrhea, vomiting).</li>
            <li>Skin and eye infections on contact.</li>
            <li>Long-term exposure can affect organs and development.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Recommendations</h3>
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <ul className="list-inside list-disc text-gray-700">
              <li>Do not drink this water without strong treatment (RO + UV / boiling + filtering).</li>
              <li>Avoid using this water for cooking or feeding infants.</li>
              <li>Report serious contamination to local authorities if this is a public source.</li>
            </ul>
          </div>
        </div>
      );
    }

    // RIVER: Moderate
    if (pred === 'Moderate') {
      return (
        <div className="my-6 text-left">
          <h3 className="text-xl font-semibold mb-2">What does "Moderate" mean?</h3>
          <p className="text-gray-700 mb-4">
            Moderate water quality means the water is not extremely polluted but may not meet ideal drinking
            standards, especially for sensitive people (kids, elderly, pregnant women).
          </p>

          <h3 className="text-xl font-semibold mb-2">Health Notes</h3>
          <ul className="list-inside list-disc text-gray-700 mb-4">
            <li>May be usable for washing and cleaning.</li>
            <li>For drinking, basic treatment (filtration + boiling) is recommended.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Recommendations</h3>
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <ul className="list-inside list-disc text-gray-700">
              <li>Use household filters or boil water before drinking.</li>
              <li>Monitor taste/smell and avoid if something feels off.</li>
            </ul>
          </div>
        </div>
      );
    }

    // TAP: Low
    if (normalized === 'low') {
      return (
        <div className="my-6 text-left">
          <h3 className="text-xl font-semibold mb-2">Tap Quality: Low Risk</h3>
          <p className="text-gray-700 mb-4">
            Your tap water is in the <strong>Low</strong> risk zone based on pH, Hardness, Chloramines,
            Sulfate, and Turbidity. Overall, parameters look within safer ranges.
          </p>

          <h3 className="text-xl font-semibold mb-2">What this means</h3>
          <ul className="list-inside list-disc text-gray-700 mb-4">
            <li>Suitable for regular household use and drinking (with normal filtration).</li>
            <li>Less chances of irritation, strange taste, or visible impurities.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Tips</h3>
          <div className="bg-emerald-50 p-4 rounded-md border border-emerald-200">
            <ul className="list-inside list-disc text-gray-700">
              <li>Use a basic filter for better taste and extra safety.</li>
              <li>Clean your filter regularly to maintain good quality.</li>
            </ul>
          </div>
        </div>
      );
    }

    // TAP: Average
    if (normalized === 'average') {
      return (
        <div className="my-6 text-left">
          <h3 className="text-xl font-semibold mb-2">Tap Quality: Average</h3>
          <p className="text-gray-700 mb-4">
            Your tap water is in the <strong>Average</strong> zone. Most parameters are around the typical
            range, but some might be slightly higher or lower than ideal.
          </p>

          <h3 className="text-xl font-semibold mb-2">What this means</h3>
          <ul className="list-inside list-disc text-gray-700 mb-4">
            <li>Generally usable for bathing, cleaning and sometimes drinking.</li>
            <li>For long-term daily drinking, a good quality filter/RO is recommended.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Tips</h3>
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
            <ul className="list-inside list-disc text-gray-700">
              <li>Use RO/UV filter if possible, especially for children and elderly.</li>
              <li>Check for unusual smell, color, or taste time to time.</li>
            </ul>
          </div>
        </div>
      );
    }

    // TAP: High
    if (normalized === 'high') {
      return (
        <div className="my-6 text-left">
          <h3 className="text-xl font-semibold mb-2">Tap Quality: High Risk</h3>
          <p className="text-gray-700 mb-4">
            One or more tap water parameters are in the <strong>High</strong> zone (for example excessive
            hardness, turbidity, or chemicals). This can affect taste, pipes, and long-term health.
          </p>

          <h3 className="text-xl font-semibold mb-2">Possible Issues</h3>
          <ul className="list-inside list-disc text-gray-700 mb-4">
            <li>Scaling in utensils, geysers and pipes due to high hardness.</li>
            <li>Cloudy/colored water due to higher turbidity or contaminants.</li>
            <li>Long-term excess chemicals may stress kidneys or cause other health issues.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">Recommendations</h3>
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <ul className="list-inside list-disc text-gray-700">
              <li>Use advanced treatment (RO + UV) for drinking.</li>
              <li>Avoid giving this water directly to infants or people with kidney issues.</li>
              <li>Consider periodic lab testing if you suspect serious contamination.</li>
            </ul>
          </div>
        </div>
      );
    }

    // fallback
    return (
      <div className="my-6 text-left">
        <h3 className="text-xl font-semibold mb-2">Prediction result</h3>
        <p className="text-gray-700">
          Model returned: <strong>{pred}</strong>
        </p>
      </div>
    );
  };

  // ---------------- Result Screen ----------------

  if (prediction) {
    const normalized = prediction.toLowerCase();

    let title = prediction;
    let headerBg = 'bg-gray-100';
    let badgeBg = 'bg-gray-900';
    const badgeText = 'text-white';

    if (prediction === 'Polluted') {
      title = 'Polluted River Water';
      headerBg = 'bg-red-50';
      badgeBg = 'bg-red-600';
    } else if (prediction === 'Moderate') {
      title = 'Moderate River Water';
      headerBg = 'bg-amber-50';
      badgeBg = 'bg-amber-600';
    } else if (normalized === 'low') {
      title = 'Tap Water – Low Risk';
      headerBg = 'bg-emerald-50';
      badgeBg = 'bg-emerald-600';
    } else if (normalized === 'average') {
      title = 'Tap Water – Average Quality';
      headerBg = 'bg-amber-50';
      badgeBg = 'bg-amber-600';
    } else if (normalized === 'high') {
      title = 'Tap Water – High Risk';
      headerBg = 'bg-red-50';
      badgeBg = 'bg-red-600';
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <h1 className="text-center text-3xl font-extrabold mb-6 text-gray-900">{title}</h1>

          <div className={`${headerBg} rounded-2xl p-5 text-center mb-4`}>
            <span
              className={`inline-flex px-5 py-2 font-semibold rounded-full shadow-sm ${badgeBg} ${badgeText}`}
            >
              {prediction}
            </span>
            <p className="mt-3 text-sm text-gray-600">
              This result is generated using your selected parameters and our trained water quality model.
            </p>
          </div>

          {renderExplanation(prediction)}

          <div className="mt-6 text-center">
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-full font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700"
            >
              <span>⟲</span>
              <span>Go Back & Predict Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- Main Screen (cards + forms) ----------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-4">
          Water Quality <span className="text-teal-500">Analyzer</span>
        </h2>

        <p className="text-center text-gray-600 mb-8">
          Choose a card below — measure river values or set tap options and predict.
        </p>

        {!showForm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* River card */}
            <div className="relative bg-white rounded-3xl shadow-xl p-6 border-2 border-cyan-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-white/80 rounded-bl-3xl transform translate-x-6 -translate-y-6 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12s4-8 9-8 9 8 9 8-4 8-9 8-9-8-9-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">River Water</h3>
                  <p className="text-sm text-gray-500">
                    Predict ecological status and pollution level of natural water bodies.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setWaterType('river');
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-3 py-3 px-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-2xl hover:from-blue-600 hover:to-blue-700"
                >
                  Start River Prediction
                </button>
              </div>
            </div>

            {/* Tap card */}
            <div className="relative bg-white rounded-3xl shadow-xl p-6 border-2 border-sky-200 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/80 rounded-bl-3xl transform translate-x-6 -translate-y-6 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <svg
                    className="w-8 h-8 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v4m0 10v4m9-9h-4M7 12H3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Tap Water</h3>
                  <p className="text-sm text-gray-500">
                    Evaluate potability and safety of household drinking water.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setWaterType('tap');
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-3 py-3 px-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-semibold shadow-2xl hover:from-indigo-700 hover:to-indigo-600"
                >
                  Start Tap Prediction
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
            {/* Top bar with title + Back + Reset */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {waterType === 'river' ? 'River Water Input' : 'Tap Water Options'}
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {waterType === 'river' ? 'Detailed parameters' : 'Quick Low / Avg / High'}
                  </span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {waterType === 'river'
                    ? 'Fill in measured values from your test results to get a more scientific prediction.'
                    : 'Select how your tap water feels for each parameter. We convert it to numeric ranges internally.'}
                </p>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
                >
                  <span>←</span>
                  <span>Back</span>
                </button>
                <button
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
                >
                  <span>⟲</span>
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {waterType === 'river' ? (
              <form onSubmit={handleRiverSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'temperature', placeholder: 'Temperature (°C)', hint: 'Typical: 20–30 °C' },
                    {
                      name: 'dissolvedOxygen',
                      placeholder: 'Dissolved Oxygen (mg/L)',
                      hint: 'Higher is usually better',
                    },
                    { name: 'ph', placeholder: 'pH (0-14)', hint: 'Ideal near 7' },
                    {
                      name: 'conductivity',
                      placeholder: 'Conductivity (µmho/cm)',
                      hint: 'Related to salt/mineral content',
                    },
                    { name: 'bod', placeholder: 'BOD (mg/L)', hint: 'High BOD → more organic pollution' },
                    { name: 'nitrate', placeholder: 'Nitrate N (mg/L)', hint: 'High nitrate is harmful' },
                    {
                      name: 'fecalColiform',
                      placeholder: 'Fecal Coliform (MPN/100ml)',
                      hint: 'Indicates sewage contamination',
                    },
                    {
                      name: 'totalColiform',
                      placeholder: 'Total Coliform (MPN/100ml)',
                      hint: 'General microbial contamination',
                    },
                  ].map(field => (
                    <div key={field.name} className="p-3 rounded-xl border border-gray-100 bg-gray-50/40">
                      <label
                        htmlFor={field.name}
                        className="block text-sm font-medium text-gray-700 capitalize"
                      >
                        {field.placeholder}
                      </label>
                      <input
                        type="number"
                        name={field.name}
                        id={field.name}
                        value={formData[field.name as keyof FormState]}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 sm:text-sm"
                        placeholder={field.placeholder}
                        step="any"
                      />
                      <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-3 py-3 px-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-2xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-60"
                  >
                    {isLoading ? 'Predicting...' : 'Predict River Quality'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tapParams.map(p => (
                    <div
                      key={p.name}
                      className="p-4 border border-gray-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{p.name}</h4>
                          <span className="text-xs text-gray-500">{p.description}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500">
                          Selected: {p.value}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-2">
                        {(['Low', 'Average', 'High'] as ('Low' | 'Average' | 'High')[]).map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleTapParamChange(p.name, opt)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium border transition ${
                              p.value === opt
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTapSubmit}
                    disabled={isLoading}
                    className="inline-flex items-center gap-3 py-3 px-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-semibold shadow-2xl hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60"
                  >
                    {isLoading ? 'Predicting...' : 'Predict Tap Quality'}
                  </button>

                  <p className="text-xs text-gray-500 text-center max-w-md">
                    Your Low / Average / High selections are converted into numeric ranges for each parameter and
                    passed to the tap water model for prediction.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="mt-6 text-center text-red-600 font-medium">{error}</div>}
      </div>
    </div>
  );
};

export default Prediction;
