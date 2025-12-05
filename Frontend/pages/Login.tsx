import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { motion } from "framer-motion";
import '../styles/auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Real API call to backend (proxied by Vite during development)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Expecting { success: true, token: '...' }
      const { token } = data;
      if (!token) throw new Error('Missing token in response');

      login(token);
      navigate('pridict');

    } catch (err) {
      setError('Invalid email or password.');
      console.error(err);
    }
  };

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="form-container"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div 
          className="form-box"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="form-content">
            <motion.h1 
              className="auth-title"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Welcome Back
            </motion.h1>
            
            <motion.form 
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.div 
                className="input-group"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                />
                <i className='bx bxs-envelope input-icon'></i>
              </motion.div>

              <motion.div 
                className="input-group"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                />
                <i className='bx bxs-lock-alt input-icon'></i>
              </motion.div>

              {error && (
                <motion.p 
                  className="error-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.p>
              )}

              <motion.div 
                className="forgot-link"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <a href="#">Forgot password?</a>
              </motion.div>

              <motion.button 
                type="submit" 
                className="auth-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                Login
              </motion.button>

              {/* <motion.div 
                className="social-section"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <p className="social-text">or login with social platforms</p>
                <div className="social-icons">
                  {['google', 'facebook', 'github', 'linkedin'].map((platform, index) => (
                    <motion.a 
                      key={platform}
                      whileHover={{ scale: 1.1 }} 
                      href="#" 
                      className="social-icon"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                    >
                      <i className={`bx bxl-${platform}`}></i>
                    </motion.a>
                  ))}
                </div>
              </motion.div> */}
            </motion.form>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Login;