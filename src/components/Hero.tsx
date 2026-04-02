import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Github, Linkedin, Mail } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const Hero = () => {
  const [profile, setProfile] = useState<any>(null);
  const [text, setText] = useState('');
  const fullText = "Building the future, one line of code at a time.";
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'profile', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // Fallback data from resume
          setProfile({
            name: "Goutam Kumar Ghosal",
            tagline: "B.Tech CSE Student @ IIT Patna",
            intro: "Motivated B.Tech Computer Science student at IIT Patna seeking internship opportunities to apply programming, problem-solving, and software development skills. Passionate about data structures, algorithms, and building real-world applications while continuously learning new technologies.",
            resumeUrl: "#"
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'profile/main');
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + fullText[index]);
        setIndex((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 px-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="max-w-4xl w-full text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-blue-500 font-mono mb-4 tracking-widest uppercase text-sm">Welcome to my world</h2>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            I'm <span className="text-gradient">{profile?.name || "Goutam Kumar Ghosal"}</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-medium">
            {profile?.tagline || "B.Tech CSE Student | IIT Patna"}
          </p>
          
          <div className="h-8 mb-10">
            <p className="text-lg font-mono text-blue-400">
              {text}<span className="animate-pulse">|</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={profile?.resumeUrl || "#"}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Download size={20} /> Download Resume
            </motion.a>
            <div className="flex items-center gap-4 ml-4">
              <a href={profile?.githubUrl || "https://github.com/Goutam-2702"} target="_blank" rel="noopener noreferrer" className="p-3 glass rounded-full hover:text-blue-500 transition-colors">
                <Github size={24} />
              </a>
              <a href={profile?.linkedinUrl || "https://linkedin.com/in/goutam-kumar-ghosal"} target="_blank" rel="noopener noreferrer" className="p-3 glass rounded-full hover:text-blue-500 transition-colors">
                <Linkedin size={24} />
              </a>
              <a href="mailto:kumargoutam2006@gmail.com" className="p-3 glass rounded-full hover:text-blue-500 transition-colors">
                <Mail size={24} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-muted rounded-full flex justify-center p-1">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-1 h-2 bg-muted rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};
