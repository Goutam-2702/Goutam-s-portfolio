import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Award, Briefcase, Calendar } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const Achievements = () => {
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'achievements'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setAchievements([
          {
            id: 'a1',
            title: 'The Big Code 2026 Hackathon',
            description: 'Recognized among Top 15,000 students in Big Code 2026 for coding and problem-solving skills; progressed to Round 1.',
            date: '2026',
            type: 'hackathon'
          },
          {
            id: 'a2',
            title: 'Vista Codefest Hackathon',
            description: 'Participated in Vista Codefest Hackathon – IIT BHU.',
            date: '2026',
            type: 'hackathon'
          }
        ]);
      } else {
        setAchievements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'achievements'));
    return unsubscribe;
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'hackathon': return <Trophy className="text-yellow-500" />;
      case 'certification': return <Award className="text-blue-500" />;
      case 'internship': return <Briefcase className="text-green-500" />;
      default: return <Trophy className="text-blue-500" />;
    }
  };

  return (
    <section id="achievements" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-bold mb-4 tracking-tight">Achievements & <span className="text-gradient">Experience</span></h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Milestones, awards, and professional experiences that have shaped my journey.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {achievements.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-3xl flex gap-6 items-start hover:border-blue-500/30 transition-all group"
          >
            <div className="p-4 glass rounded-2xl group-hover:scale-110 transition-transform">
              {getIcon(item.type)}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <Calendar size={12} /> {item.date}
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
              {item.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden h-32">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
