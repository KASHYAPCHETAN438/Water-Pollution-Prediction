import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { motion } from 'framer-motion';

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
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waterType, setWaterType] = useState<'river' | 'tap' | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize waterType from query param if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('type');
    if (t === 'river' || t === 'tap') setWaterType(t);
  }, [location.search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetAll = () => {
    setFormData(initialState);
    setPrediction(null);
    setError(null);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await fetch('/api/prediction/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Prediction request failed');
      }

      // Normalize prediction text for consistent handling
      const raw = String(result.prediction || '').trim();
      const normalized = raw.toLowerCase();

      if (normalized.includes('pollut') || normalized.includes('not pot') || normalized.includes('unsafe')) {
        setPrediction('Polluted');
      } else if (normalized.includes('moderate') || normalized.includes('potable') || normalized.includes('safe')) {
        setPrediction('Moderate');
      } else {
        // fallback: use whatever model returned
        setPrediction(raw);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching the prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Explanations for each class
  const renderExplanation = (pred: string) => {
    if (pred === 'Polluted') {
      return (
        <>
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
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <ul className="list-inside list-disc text-gray-700">
                <li>Avoid drinking untreated water — boil or use certified filters before use.</li>
                <li>Do not use this water for cooking, brushing teeth, or feeding infants unless treated.</li>
                <li>If contaminated by sewage/microbial sources, use chlorination or UV treatment.</li>
                <li>Seek medical advice if exposure causes symptoms.</li>
              </ul>
            </div>
          </div>
        </>
      );
    }

    if (pred === 'Moderate') {
      return (
        <>
          <div className="my-6 text-left">
            <h3 className="text-xl font-semibold mb-2">What does "Moderate" mean?</h3>
            <p className="text-gray-700 mb-4">
              Moderate water quality indicates that water may be usable for some purposes but could pose minor
              health risks for sensitive groups. It likely does not meet the best drinking-water standards but
              may be treatable.
            </p>

            <h3 className="text-xl font-semibold mb-2">Health Notes</h3>
            <ul className="list-inside list-disc text-gray-700 mb-4">
              <li>Generally safe for washing and some household uses after simple treatment.</li>
              <li>Infants, elderly, and immunocompromised people should avoid drinking it without treatment.</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">Recommendations</h3>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <ul className="list-inside list-disc text-gray-700">
                <li>Boil water for at least 1 minute before drinking (or follow local health guidance).</li>
                <li>Consider a point-of-use filter certified for bacteria and protozoa.</li>
                <li>Monitor for symptoms and avoid giving this water to infants or very vulnerable people.</li>
              </ul>
            </div>
          </div>
        </>
      );
    }

    // Generic fallback explanation
    return (
      <div className="my-6 text-left">
        <h3 className="text-xl font-semibold mb-2">Prediction result</h3>
        <p className="text-gray-700">Model returned: <strong>{pred}</strong></p>
      </div>
    );
  };

  // If prediction exists, show the result page
  if (prediction) {
    const title = prediction === 'Polluted' ? 'Polluted Water' : prediction === 'Moderate' ? 'Moderate Water' : prediction;
    const headerBg = prediction === 'Polluted' ? 'bg-red-100' : 'bg-green-100';
    const headerTextColor = prediction === 'Polluted' ? 'text-red-800' : 'text-green-800';

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-sky-50 py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 text-center mb-6"
          >
            Water Quality Prediction 
          </motion.h1>

          <div className={`${headerBg} rounded-md p-4 text-center`}>
            <span className={`inline-block px-4 py-2 font-semibold rounded ${headerTextColor} bg-white/0`}>
              {title}
            </span>
          </div>


          {renderExplanation(prediction)}

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetAll}
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 px-6 rounded-full shadow hover:shadow-lg transition-shadow"
            >
              GO BACK AND PREDICT AGAIN
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }
  // If no water type selected yet, show the chooser first
  if (!waterType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-sky-50 py-12 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <motion.div whileHover={{ scale: 1.02 }} className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border shadow-md text-center">
            <h2 className="text-2xl font-bold mb-2">River Water</h2>
            <p className="text-slate-700 mb-6">Predict River Water Quality using environmental sample parameters.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
              navigate(`${location.pathname}?type=river`);
              setWaterType('river');
              }}

              className="inline-flex items-center py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full shadow"
            >
              Go to River Prediction
            </motion.button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border shadow-md text-center">
            <h2 className="text-2xl font-bold mb-2">Tap Water</h2>
            <p className="text-slate-700 mb-6">Predict Tap Water Quality using treated/tap water measurements.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
              navigate(`${location.pathname}?type=tap`);
              setWaterType('tap');
              }}

              className="inline-flex items-center py-3 px-6 bg-gradient-to-r from-emerald-600 to-cyan-400 text-white rounded-full shadow"
            >
              Go to Tap Prediction
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Otherwise show the form
  return (
    <div className="container mx-auto px-4 py-12 bg-gradient-to-b from-blue-50 via-white to-sky-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center text-slate-900 mb-6">
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 text-center mb-6">
            Enter Water Quality Parameters
          </h1>
        </motion.h2>

  <form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'temperature', placeholder: 'Temperature (°C)' },
              { name: 'dissolvedOxygen', placeholder: 'Dissolved Oxygen (mg/L)' },
              { name: 'ph', placeholder: 'pH (0-14)' },
              { name: 'conductivity', placeholder: 'Conductivity (µmho/cm)' },
              { name: 'bod', placeholder: 'BOD (mg/L)' },
              { name: 'nitrate', placeholder: 'Nitrate N (mg/L)' },
              { name: 'fecalColiform', placeholder: 'Fecal Coliform (MPN/100ml)' },
              { name: 'totalColiform', placeholder: 'Total Coliform (MPN/100ml)' },
            ].map(field => (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 capitalize">
                  {field.placeholder}
                </label>
                <input
                  type="number"
                  name={field.name}
                  id={field.name}
                  value={formData[field.name as keyof FormState]}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={field.placeholder}
                  step="any"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? 'Predicting...' : 'Predict'}
            </button>
          </div>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center">
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-lg">{error}</motion.p>
          )}
        </motion.div>
      </motion.div>
       <br />
       <br />   
      
      
    </div>
  );
};

export default Prediction;