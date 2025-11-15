import React, { useState, useRef, useEffect } from 'react';

// --- MOCK/STUB DEFINITIONS ---
// Stubs for libraries or hooks not available in a single file environment
const useAuth = () => ({ token: 'mock-token' });

// Define a generic component type to suppress TypeScript errors related to framer-motion props
type MotionStubComponent = React.FC<any>;

// Updated motion stub to use generic props (any) to resolve the Type is missing properties errors
const motion: Record<string, MotionStubComponent> = {
  // Destructure and discard framer-motion props before spreading to native elements
  button: (props: any) => {
    const { children, whileHover, whileTap, initial, animate, transition, ...restProps } = props;
    return <button {...restProps}>{children}</button>;
  },
  div: (props: any) => {
    const { children, whileHover, whileTap, initial, animate, transition, ...restProps } = props;
    return <div {...restProps}>{children}</div>;
  },
};
// --- END MOCK/STUB DEFINITIONS ---


// --- TYPE DEFINITIONS ---
// Define the type for the WaterParameter structure
type WaterParameter = {
  name: string;
  // value tracks the selected state: 'Low', 'Average', 'High'
  value: 'Low' | 'Average' | 'High'; 
  unit: string;
  icon: string;
  options: Record<string, { range: string; description: string }>;
};

// Define props for WaterParameterSlider
type WaterParameterSliderProps = {
  parameter: WaterParameter;
  onChange: (value: 'Low' | 'Average' | 'High') => void;
};

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

type BackButtonProps = {
  goToChooser: () => void;
}
// --- END TYPE DEFINITIONS ---


// --- WATER PARAMETER SLIDER COMPONENT (FIXED) ---

const WaterParameterSlider: React.FC<WaterParameterSliderProps> = ({ parameter, onChange }) => {
  const displayValue = parameter.value;

  const currentOptions = parameter.options;

  // Function to determine the icon/color for the selected status
  const getStatusColor = (key: string, isActive: boolean) => {
    // Attractive, descriptive colors based on status
    if (isActive) {
      if (key === 'Low') return 'border-orange-500 bg-orange-50 text-orange-800 shadow-lg ring-4 ring-orange-100';
      if (key === 'High') return 'border-red-500 bg-red-50 text-red-800 shadow-lg ring-4 ring-red-100';
      // Default/Average (Ideal) is Cyan/Blue
      return 'border-cyan-500 bg-cyan-50 text-cyan-800 shadow-lg ring-4 ring-cyan-200';
    }
    // Inactive state - Clean and subtle
    return 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100 hover:border-cyan-300';
  }
  
  // Custom Icon based on status - replacing the generic thumbs up/down emojis
  const getCustomIcon = (key: string) => {
    if (key === 'Average') return '✨'; // Ideal/Optimal
    if (key === 'Low') return '⬇';    // Low/Under
    if (key === 'High') return '⬆';   // High/Over
    return '';
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-5 bg-white rounded-2xl shadow-xl border border-gray-100 h-full flex flex-col"
    >
      <h4 className="flex items-center text-xl font-bold text-gray-800 mb-4"> 
        <span className="mr-3 text-3xl">{parameter.icon}</span>
        {parameter.name}
      </h4>
      <div className="flex flex-col space-y-3 flex-grow"> 
        {Object.keys(currentOptions).map(key => {
          const isActive = key === displayValue;
          const option = currentOptions[key];
          
          // Get dynamic styles based on status and active state
          const statusClasses = getStatusColor(key, isActive);

          return (
            <motion.button
              key={key}
              // Improved hover/tap effects
              whileHover={{ scale: 1.01, boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)' }} 
              whileTap={{ scale: 0.99 }}
              onClick={() => onChange(key as 'Low' | 'Average' | 'High')}
              // Corrected: Use template literal (backticks) for className to inject dynamic variables
              className={`w-full flex flex-col items-start p-4 rounded-xl transition-all duration-300 text-base font-semibold border-2 
                ${statusClasses} text-left
              `}
            >
              <div className="flex items-center mb-1">
                {/* Icon and Status Name (Left side) - CORRECTED CLASS SYNTAX */}
                <span className={`text-xl mr-2 font-black ${isActive ? 'text-current' : 'text-gray-400'}`}>{getCustomIcon(key)}</span>
                {/* Status Name - CORRECTED CLASS SYNTAX */}
                <span className={`font-extrabold text-lg ${isActive ? 'text-current' : 'text-gray-800'}`}>{key}</span>
              </div>
              
              {/* Description (Full width, left-aligned text) - CORRECTED CLASS SYNTAX */}
              <span className={`text-sm text-left font-medium ${isActive ? 'text-current' : 'text-gray-600'} block w-full mt-1`}>
                {option.description}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
// --- END WATER PARAMETER SLIDER COMPONENT ---


// --- DATA & HELPER FUNCTIONS ---
const parameterRanges = {
  temperature: {
    min: 0,
    max: 35,
    unit: '°C',
    name: 'Temperature'
  },
  dissolvedOxygen: {
    min: 0,
    max: 14,
    unit: 'mg/L',
    name: 'Dissolved Oxygen'
  },
  ph: {
    min: 0,
    max: 14,
    unit: '',
    name: 'pH'
  },
  conductivity: {
    min: 0,
    max: 1000,
    unit: 'µmho/cm',
    name: 'Conductivity'
  },
  bod: {
    min: 0,
    max: 500,
    unit: 'mg/L',
    name: 'BOD (Biochemical Oxygen Demand)'
  },
  nitrate: {
    min: 0,
    max: 50,
    unit: 'mg/L',
    name: 'Nitrate N'
  },
  fecalColiform: {
    min: 0,
    max: 200,
    unit: 'MPN/100ml',
    name: 'Fecal Coliform'
  },
  totalColiform: {
    min: 0,
    max: 500,
    unit: 'MPN/100ml',
    name: 'Total Coliform'
  }
};

const BackButton: React.FC<BackButtonProps> = ({ goToChooser }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.95 }}
      onClick={goToChooser}
      className="absolute top-4 left-4 z-10 flex items-center px-4 py-2 text-gray-700 bg-white rounded-full shadow-lg border border-gray-200 transition-all duration-150"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Selection
    </motion.button>
  );
};

const getResultStyle = (quality: 'Safe' | 'Moderate' | 'Unsafe') => {
  switch (quality) {
    case 'Safe':
      return {
        bg: 'bg-green-100 border-green-500',
        circleBg: 'from-green-500 to-emerald-600',
        text: 'text-green-800',
        icon: '✅'
      };
    case 'Moderate':
      return {
        bg: 'bg-yellow-100 border-yellow-500',
        circleBg: 'from-amber-500 to-orange-600',
        text: 'text-yellow-800',
        icon: '⚠'
      };
    case 'Unsafe':
      return {
        bg: 'bg-red-100 border-red-500',
        circleBg: 'from-red-500 to-pink-600',
        text: 'text-red-800',
        icon: '🚫'
      };
    default:
      return {
        bg: 'bg-gray-100 border-gray-500',
        circleBg: 'from-gray-500 to-gray-600',
        text: 'text-gray-800',
        icon: '❔'
      };
  }
};
// --- END DATA & HELPER FUNCTIONS ---


// --- MAIN PREDICTION COMPONENT ---
const Prediction: React.FC = () => {
  const { token } = useAuth();
  const [formData, setFormData] = useState<FormState>(initialState);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waterType, setWaterType] = useState<'river' | 'tap' | null>(null);

  // Initial parameters state (for Tap Water view)
  const [parameters, setParameters] = useState<WaterParameter[]>([
    {
      name: 'pH Level',
      value: 'Average',
      unit: 'pH',
      icon: '⚗',
      options: {
        Low: {
          range: '< 6.5 (Acidic)',
          description: 'Tastes sour or causes blue/green stains/corrosion on pipes.'
        },
        Average: {
          range: '6.5 - 8.5 (Ideal)',
          description: 'Tastes neutral, no abnormal pipe issues.'
        },
        High: {
          range: '> 8.5 (Alkaline)',
          description: 'Feels slippery or causes scaling/white crusty deposits.'
        }
      },
    },
    {
      name: 'Hardness',
      value: 'Average',
      unit: 'mg/L',
      icon: '💎',
      options: {
        Low: {
          range: '< 60 (Soft)',
          description: 'Soap lathers very easily, no spots on dishes.'
        },
        Average: {
          range: '60 - 120 (Optimal)',
          description: 'Soap lathers well, minimal spotting/scale buildup.'
        },
        High: {
          range: '> 120 (Hard)',
          description: 'Soap won\'t lather easily, heavy residue/scale on fixtures.'
        }
      },
    },
    {
      name: 'Chloramines',
      value: 'Average',
      unit: 'mg/L',
      icon: '🧪',
      options: {
        Low: {
          range: '0 - 1 (Minimal)',
          description: 'No noticeable chemical taste or smell.'
        },
        Average: {
          range: '1 - 3 (Common)',
          description: 'Faint, common chlorine smell/taste.'
        },
        High: {
          range: '> 3 (High)',
          description: 'Strong bleach-like smell or chemical taste.'
        }
      },
    },
    {
      name: 'Sulfate',
      value: 'Average',
      unit: 'mg/L',
      icon: '⚡',
      options: {
        Low: {
          range: '< 250 (Low Risk)',
          description: 'Tastes normal, no unusual flavor.'
        },
        Average: {
          range: '250 - 500 (Moderate)',
          description: 'May taste slightly bitter or metallic.'
        },
        High: {
          range: '> 500 (High Risk)',
          description: 'Strong bitter or salty taste, possible discomfort.'
        }
      },
    },
    {
      name: 'Turbidity',
      value: 'Average',
      unit: 'NTU',
      icon: '🌫',
      options: {
        Low: {
          range: '< 1 (Clear)',
          description: 'Water is crystal clear in a glass.'
        },
        Average: {
          range: '1 - 5 (Acceptable)',
          description: 'Water is slightly hazy or cloudy.'
        },
        High: {
          range: '> 5 (Poor)',
          description: 'Visibly murky, cloudy, or contains noticeable particles.'
        }
      },
    }
  ]);

  const formRef = useRef<HTMLFormElement | null>(null);

  const [tapResult, setTapResult] = useState<{ quality: 'Safe' | 'Moderate' | 'Unsafe'; explanation: string } | null>(null);

  // Function to go back to the chooser view
  const goToChooser = () => {
    setWaterType(null);
    setPrediction(null);
    setTapResult(null);
    setError(null);
    setFormData(initialState);
  }

  // Handle water type selection
  const handleChoose = (type: 'river' | 'tap') => {
    setWaterType(type);
    setPrediction(null);
    setTapResult(null);
    setError(null);
  };

  // Handle parameter selection change (for Tap Water view)
  const handleParameterChange = (name: string, value: 'Low' | 'Average' | 'High') => {
      const newParams = parameters.map(p => {
          if (p.name === name) {
              return { ...p, value: value };
          }
          return p;
      });
      setParameters(newParams);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError(null);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateParameters = (data: FormState): string[] => {
    const errors: string[] = [];
    Object.entries(data).forEach(([key, value]) => {
      const range = (parameterRanges as any)[key];
      if (!range) return;
      const num = parseFloat(String(value));
      if (String(value).trim() === '' || isNaN(num)) {
        errors.push(`- ${range.name} is required and must be a number`);
        return;
      }
      if (num < range.min || num > range.max) {
        errors.push(`- ${range.name} must be between ${range.min} and ${range.max} ${range.unit}`);
      }
    });
    return errors;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setTapResult(null);

    // River Water Prediction Logic (Input Form)
    if (waterType === 'river') {
      const validationErrors = validateParameters(formData);
      if (validationErrors.length) {
        setError(`Please correct the following input errors:\n${validationErrors.join('\n')}`);
        setIsLoading(false);
        return;
      }

      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      const simulated = 'Moderate Polluted';
      setPrediction(simulated);
      setIsLoading(false);
      return;
    }

    // Tap Water Prediction Logic (Sliders)
    if (waterType === 'tap') {
      
      // Use the selected value (Low/Average/High) for the payload
      const payload = parameters.reduce((acc, p) => {
        acc[p.name.toLowerCase().replace(/\s+/g, '_')] = p.value;
        return acc;
      }, {} as Record<string, any>);
      
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      // Simple simulation logic based on selected parameters
      // Counts how many parameters are selected as 'Low' or 'High' (not 'Average')
      const poorCount = parameters.filter(p => p.value === 'High' || p.value === 'Low').length;
      let quality: 'Safe' | 'Moderate' | 'Unsafe' = 'Safe';
      let explanation = 'Based on your selections (measured or experiential), the tap water parameters are generally within safe and desirable limits.';

      if (poorCount >= 2) {
        quality = 'Moderate';
        explanation = 'The readings in two or more parameters suggest moderate quality. While generally safe, further professional testing or attention to filtration is recommended.';
      }
      if (poorCount >= 4) {
        quality = 'Unsafe';
        explanation = 'Multiple parameters show poor quality readings (Low/High). We recommend avoiding consumption without proper filtration or seeking professional testing.';
      }

      setTapResult({ quality, explanation });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  };

  // Chooser view (no type selected)
  if (!waterType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-100 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full"
        >
          <h1 className="text-5xl font-extrabold text-center mb-12 text-gray-800">
            Water Quality <span className="text-cyan-600">Analyzer</span>
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* River Card */}
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              whileTap={{ scale: 0.98 }}
              className="p-10 rounded-3xl bg-white border-4 border-cyan-200 shadow-xl transition duration-300 text-center relative overflow-hidden group cursor-pointer"
              onClick={() => handleChoose('river')}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-100 rounded-bl-3xl opacity-50 transition duration-300"></div>
              <span className="text-6xl mb-4 block transform group-hover:scale-110 transition duration-300">🌊</span>
              <h2 className="text-3xl font-extrabold mb-3 text-gray-800">River Water</h2>
              <p className="text-slate-600 mb-8 font-medium">Predict the ecological status and pollution level of natural water bodies.</p>
              <button
                className="inline-flex items-center py-3 px-8 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-full font-semibold shadow-lg hover:from-cyan-700 hover:to-blue-600 transition-all transform hover:scale-105"
              >
                Start River Prediction
              </button>
            </motion.div>

            {/* Tap Card */}
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              whileTap={{ scale: 0.98 }}
              className="p-10 rounded-3xl bg-white border-4 border-blue-200 shadow-xl transition duration-300 text-center relative overflow-hidden group cursor-pointer"
              onClick={() => handleChoose('tap')}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-3xl opacity-50 transition duration-300"></div>
              <span className="text-6xl mb-4 block transform group-hover:scale-110 transition duration-300">🚰</span>
              <h2 className="text-3xl font-extrabold mb-3 text-gray-800">Tap Water</h2>
              <p className="text-slate-600 mb-8 font-medium">Evaluate the potability and safety of treated or household drinking water.</p>
              <button
                className="inline-flex items-center py-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-full font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-600 transition-all transform hover:scale-105"
              >
                Start Tap Prediction
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Tap view (Sliders / Q&A)
  if (waterType === 'tap') {
    const resultStyle = tapResult ? getResultStyle(tapResult.quality) : null;
    
    // Main Tap Water Slider View
    return (
      <div className="min-h-screen px-4 py-16 bg-gradient-to-br from-indigo-50 via-white to-cyan-100 relative">
        <BackButton goToChooser={goToChooser} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-2xl border-t-8 border-cyan-500"
        >
          <h1 className="text-4xl font-extrabold text-center mb-3 text-gray-800">Tap Water Quality Analysis</h1>
          <p className="text-center text-gray-600 mb-8 text-lg">
            Select the parameter that best matches your *sensory observations* (taste, feel, residue, smell).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {parameters.map((param) => (
              <WaterParameterSlider
                key={param.name}
                parameter={param}
                onChange={(value) => handleParameterChange(param.name, value)}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 15px rgba(6, 182, 212, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubmit()}
              disabled={isLoading}
              className="px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-full font-extrabold text-lg shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : 'Predict Quality'}
            </motion.button>
          </div>

          {tapResult && resultStyle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`mt-10 p-8 rounded-2xl border-4 ${resultStyle.bg} border-l-8 ${resultStyle.text} shadow-2xl transition-all duration-300`}
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className={`w-32 h-32 flex-shrink-0 rounded-full bg-gradient-to-br ${resultStyle.circleBg} flex items-center justify-center text-white text-4xl font-extrabold shadow-2xl`}>
                  {resultStyle.icon}
                </div>
                <div className={`flex-grow ${resultStyle.text}`}>
                  <h3 className="text-3xl font-extrabold mb-2">Result: {tapResult.quality}</h3>
                  <p className="text-lg">{tapResult.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}

          {error && <div className="mt-4 p-3 bg-red-50 border border-red-400 text-red-700 rounded-lg font-medium">{error}</div>}
        </motion.div>
      </div>
    );
  }

  // River view (Form) - Remains unchanged
  return (
    <div className="min-h-screen px-4 py-16 bg-gradient-to-br from-indigo-50 via-white to-cyan-100 relative">
      <BackButton goToChooser={goToChooser} />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-2xl border-t-8 border-cyan-500"
      >
        <h2 className="text-4xl font-extrabold text-center mb-8 text-gray-800">River Water Parameters</h2>
        <p className="text-center text-gray-600 mb-8 text-lg">Enter observed values for river water quality analysis.</p>

        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {[
              { name: 'temperature', label: 'Temperature', placeholder: `(${parameterRanges.temperature.min}-${parameterRanges.temperature.max}${parameterRanges.temperature.unit})` },
              { name: 'dissolvedOxygen', label: 'Dissolved Oxygen', placeholder: `(${parameterRanges.dissolvedOxygen.min}-${parameterRanges.dissolvedOxygen.max} mg/L)` },
              { name: 'ph', label: 'pH', placeholder: `(${parameterRanges.ph.min}-${parameterRanges.ph.max})` },
              { name: 'conductivity', label: 'Conductivity', placeholder: `(${parameterRanges.conductivity.min}-${parameterRanges.conductivity.max} µmho/cm)` },
              { name: 'bod', label: 'BOD', placeholder: `(${parameterRanges.bod.min}-${parameterRanges.bod.max} mg/L)` },
              { name: 'nitrate', label: 'Nitrate', placeholder: `(${parameterRanges.nitrate.min}-${parameterRanges.nitrate.max} mg/L)` },
              { name: 'fecalColiform', label: 'Fecal Coliform', placeholder: `(${parameterRanges.fecalColiform.min}-${parameterRanges.fecalColiform.max} MPN/100ml)` },
              { name: 'totalColiform', label: 'Total Coliform', placeholder: `(${parameterRanges.totalColiform.min}-${parameterRanges.totalColiform.max} MPN/100ml)` },
            ].map(field => {
              const range = (parameterRanges as any)[field.name];
              return (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    <span className="text-gray-500 ml-2 text-xs font-normal">{field.placeholder}</span>
                  </label>
                  <input
                    type="number"
                    name={field.name}
                    id={field.name}
                    value={(formData as any)[field.name]}
                    onChange={handleChange}
                    required
                    min={range?.min}
                    max={range?.max}
                    placeholder={field.placeholder.replace(/[()]/g, '')}
                    className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all sm:text-base"
                    step="any"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 15px rgba(6, 182, 212, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-500 text-white rounded-full font-extrabold text-lg shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Predicting...
                </span>
              ) : 'Predict Water Quality'}
            </motion.button>
          </div>

          {prediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 p-6 bg-blue-50 border-2 border-blue-400 text-blue-800 rounded-xl shadow-lg"
            >
              <h3 className="text-xl font-bold mb-1">Prediction Result:</h3>
              <p className="text-2xl font-extrabold">{prediction}</p>
              <p className="text-sm text-gray-600 mt-2">(Simulated result. Connect to a real ML model for accurate server explanations.)</p>
            </motion.div>
          )}

          {/* FIX: Error block for validation errors */}
          {error && (
            <div className="mt-4 p-4 whitespace-pre-wrap bg-red-100 border-2 border-red-500 text-red-800 rounded-xl font-medium shadow-md">
                <h4 className="font-extrabold mb-1">Validation Error:</h4>
                <p className="text-sm">{error}</p>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
};
export default Prediction;