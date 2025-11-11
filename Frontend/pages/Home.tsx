import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../components/Card";

const Home: React.FC = () => {
  return (
    <div className="w-full flex flex-col text-white">
      {/* ---------- HERO SECTION ---------- */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-sky-900">
        {/* ---------- BACKGROUND ---------- */}
        <div className="absolute top-0 left-0 w-full h-full bg-sky-800 z-0">
          <div className="absolute bottom-0 left-0 w-full">
            <svg
              className="waves"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 24 150 28"
              preserveAspectRatio="none"
              shapeRendering="auto"
            >
              <defs>
                <path
                  id="gentle-wave"
                  d="M-160 44c30 0 58-18 88-18s58 18 88 18
                  58-18 88-18 58 18 88 18 v44h-352z"
                />
              </defs>
              <g className="parallax">
                <use
                  xlinkHref="#gentle-wave"
                  x="48"
                  y="0"
                  fill="rgba(255,255,255,0.7)"
                />
                <use
                  xlinkHref="#gentle-wave"
                  x="48"
                  y="3"
                  fill="rgba(255,255,255,0.5)"
                />
                <use
                  xlinkHref="#gentle-wave"
                  x="48"
                  y="5"
                  fill="rgba(255,255,255,0.3)"
                />
                <use
                  xlinkHref="#gentle-wave"
                  x="48"
                  y="7"
                  fill="rgba(255,255,255,1)"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* ---------- HERO CONTENT ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 px-4 sm:px-8"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 text-cyan-300 drop-shadow-lg">
            PROTECTING OUR WATER
          </h1>

          <p className="text-lg sm:text-xl text-sky-100 max-w-2xl mx-auto leading-relaxed mb-8">
            Fast, field-ready water pollution screening using AI — get
            contamination risk scores and prioritized remediation steps.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <Link
              to="/prediction"
              className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-cyan-400/50 hover:scale-105 transition transform"
            >
              Start a Prediction
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------- FEATURES SECTION ---------- */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="py-16 px-6 bg-white text-center text-slate-900"
      >
        <h2 className="text-3xl font-bold mb-6">Why This?</h2>
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3">
          <Card
            
            title="Accurate Prediction"
            description="Our AI model provides high-accuracy predictions about water pollution levels."
            icon="💧"
            style={{ backgroundColor: "#E0F7FE" }}
          />
          <Card
            title="Fast Analysis"
            description="Get real-time results instantly with our efficient AI pipeline."
            icon="⚡"
            style={{ backgroundColor: "#FFECEC" }}
          />
          <Card
            title="User Friendly"
            description="Easy-to-use interface for researchers, students, and environmentalists."
            icon="🌍"
            style={{ backgroundColor: "#E7F5FF" }}
          />
        </div>
      </motion.section>

      {/* ---------- PARAMETERS SECTION ---------- */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        id="how-it-works"
        className="py-20 bg-gradient-to-b from-sky-50 to-white text-center text-slate-900"
      >
        <h2 className="text-3xl font-bold mb-4">Parameters We Analyze</h2>
        <p className="text-slate-700 mb-10 max-w-2xl mx-auto">
          Our model analyzes crucial water parameters like pH, turbidity,
          dissolved oxygen, conductivity, and TDS to predict overall water
          quality.
        </p>
        <div className="max-w-4xl mx-auto grid md:grid-cols-5 sm:grid-cols-3 grid-cols-2 gap-6 px-4">
          {["pH", "Turbidity", "Dissolved Oxygen", "BOD", "TDS"].map(
            (param) => (
              <div
                key={param}
                className="bg-white shadow-md p-4 rounded-lg border hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-slate-900">
                  {param}
                </h3>
              </div>
            )
          )}
        </div>
      </motion.section>

      {/* ---------- CTA SECTION ---------- */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="py-16 bg-gradient-to-r from-sky-600 to-emerald-500 text-white text-center"
      >
        <motion.h2
          initial={{ y: 20 }}
          whileInView={{ y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-4"
        >
          Ready to Predict Water Quality?
        </motion.h2>
        <motion.p
          initial={{ y: 20 }}
          whileInView={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 text-lg text-white/90"
        >
          Join us in protecting our most precious resource today.
        </motion.p>
        <Link
          to="/prediction"
          className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3 rounded-full shadow hover:scale-105 transition"
        >
          Start Now
        </Link>
      </motion.section>
    </div>
  );
};

export default Home;
