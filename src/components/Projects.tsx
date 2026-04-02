import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Github, ExternalLink, Code } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const Projects = () => {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProjects([
          {
            id: '1',
            title: 'Goutam-GPT',
            description: 'A ChatGPT-like AI assistant built to deliver intelligent, real-time conversations using modern LLM technology. Supports natural language queries and coding help.',
            tags: ['React', 'Express', 'Node.js', 'Tailwind CSS'],
            githubUrl: '#',
            order: 1
          },
          {
            id: '2',
            title: 'AI Money Mentor',
            description: 'AI-powered personal finance assistant that analyzes income data to optimize taxes and evaluate financial health.',
            tags: ['React', 'Node.js', 'Tailwind CSS'],
            githubUrl: '#',
            order: 2
          },
          {
            id: '3',
            title: 'Swasthya Bandhu',
            description: 'Indic voice AI recovery assistant for post-discharge patient care, enabling voice-based daily check-ins in regional languages.',
            tags: ['Supabase', 'React', 'Node.js', 'Tailwind CSS'],
            githubUrl: '#',
            order: 3
          },
          {
            id: '4',
            title: 'Mess Menu Web App',
            description: 'Displays daily and weekly hostel mess menu for IIT Patna students, enabling easy access to meal details.',
            tags: ['HTML', 'CSS', 'JavaScript'],
            githubUrl: '#',
            order: 4
          }
        ]);
      } else {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'projects'));
    return unsubscribe;
  }, []);

  return (
    <section id="projects" className="py-24 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Featured <span className="text-gradient">Projects</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A collection of my recent work, ranging from web applications to AI-powered tools.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass-card rounded-3xl overflow-hidden group flex flex-col h-full"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.imageUrl || `https://picsum.photos/seed/${project.id}/600/400`}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <div className="flex gap-4">
                      {project.githubUrl && (
                        <a href={project.githubUrl} className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-colors">
                          <Github size={20} />
                        </a>
                      )}
                      {project.liveUrl && (
                        <a href={project.liveUrl} className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-colors">
                          <ExternalLink size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <Code size={16} className="text-blue-500" />
                    <h3 className="text-xl font-bold">{project.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
                    {project.description}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {project.tags?.map((tag: string) => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
