import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Projects } from './components/Projects';
import { Achievements } from './components/Achievements';
import { Certificates } from './components/Certificates';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { motion, useScroll, useSpring } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';

const HomePage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <About />
      <Projects />
      <Achievements />
      <Certificates />
      <Contact />
    </motion.div>
  );
};

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
              {/* Progress Bar */}
              <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-[100] origin-left"
                style={{ scaleX }}
              />
              
              <Navbar />
              
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
  
              <Footer />
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
