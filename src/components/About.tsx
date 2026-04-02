import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GraduationCap, Code2, Briefcase } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const About = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'profile', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          setProfile({
            intro: "Motivated B.Tech Computer Science student at IIT Patna seeking internship opportunities to apply programming, problem-solving, and software development skills. Passionate about data structures, algorithms, and building real-world applications while continuously learning new technologies.",
            skills: ["C", "C++", "Python", "JavaScript", "React", "Next.js", "GitHub", "Git", "MongoDB", "Firebase", "Supabase", "Communication", "Teamwork", "Problem Solving", "Critical Thinking"],
            education: [
              { institution: "IIT Patna", degree: "B.Tech (CSE)", year: "Jul 2025 - Present (CGPA: 7)" },
              { institution: "Tetrahedron Higher Secondary School", degree: "12th (CGPA: 75%)", year: "Jan 2024" },
              { institution: "A.P.M Bidyaniketan Pasulunda", degree: "10th (CGPA: 83%)", year: "Jan 2022" }
            ]
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'profile/main');
      }
    };
    fetchProfile();
  }, []);

  return (
    <section id="about" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl font-bold mb-12 text-center tracking-tight">About <span className="text-gradient">Me</span></h2>
        
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="glass-card p-8 rounded-3xl">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Briefcase className="text-blue-500" /> Introduction
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
              {profile?.intro}
            </p>
            
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Code2 className="text-purple-500" /> Skills
            </h3>
            <div className="flex flex-wrap gap-3">
              {profile?.skills?.map((skill: string) => (
                <span key={skill} className="px-4 py-2 glass rounded-xl text-sm font-medium hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl">
            <h3 className="text-2xl font-semibold mb-8 flex items-center gap-2">
              <GraduationCap className="text-pink-500" /> Education
            </h3>
            <div className="space-y-8">
              {profile?.education?.map((edu: any, i: number) => (
                <div key={i} className="relative pl-8 border-l-2 border-muted hover:border-blue-500 transition-colors">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                  <h4 className="text-xl font-bold">{edu.institution}</h4>
                  <p className="text-blue-500 font-medium">{edu.degree}</p>
                  <p className="text-sm text-muted-foreground">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
