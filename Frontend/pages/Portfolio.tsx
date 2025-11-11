import React from 'react';
import Card from '../components/Card';
import { motion } from 'framer-motion';

const Portfolio: React.FC = () => {
  const projects = [
    {
      imageUrl: 'https://picsum.photos/seed/air/400/300',
      title: 'Air Quality Index Predictor',
      description: 'A similar project focused on predicting the Air Quality Index (AQI) using meteorological and pollution data.',
    },
    {
      imageUrl: 'https://picsum.photos/seed/soil/400/300',
      title: 'Soil Nutrient Analysis Tool',
      description: 'An application to analyze soil samples and recommend fertilizers for optimal crop growth.',
    },
    {
      imageUrl: 'https://picsum.photos/seed/climate/400/300',
      title: 'Climate Change Impact Visualizer',
      description: 'A data visualization dashboard showing the potential impacts of climate change on various regions.',
    },
  ];

    return (
    <div className="py-16 bg-gradient-to-b from-blue-50 via-white to-sky-50">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 text-center mb-6">
            Our Portfolio
          </h1>
          <p className="text-lg text-slate-700 mt-2">A collection of our related environmental tech projects.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}>
              <Card
                imageUrl={project.imageUrl}
                title={project.title}
                description={project.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Portfolio;
