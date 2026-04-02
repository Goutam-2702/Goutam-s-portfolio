import React from 'react';
import { motion } from 'motion/react';
import { Github, Linkedin, Mail, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-white/10 glass">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold tracking-tighter text-gradient mb-2">GK.</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Building digital experiences with passion and precision. 
            B.Tech CSE Student at IIT Patna.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-6">
            <a href="https://github.com/Goutam-2702" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a href="https://linkedin.com/in/goutam-kumar-ghosal" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-500 transition-colors">
              <Linkedin size={20} />
            </a>
            <a href="mailto:kumargoutam2006@gmail.com" className="text-muted-foreground hover:text-red-500 transition-colors">
              <Mail size={20} />
            </a>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart size={12} className="text-red-500 fill-red-500" /> by Goutam Kumar Ghosal
          </p>
        </div>

        <div className="text-center md:text-right">
          <p className="text-sm font-medium mb-2">Quick Links</p>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 text-xs text-muted-foreground uppercase tracking-widest">
            <a href="#about" className="hover:text-blue-500 transition-colors">About</a>
            <a href="#projects" className="hover:text-blue-500 transition-colors">Projects</a>
            <a href="#contact" className="hover:text-blue-500 transition-colors">Contact</a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
        © 2024 Goutam Kumar Ghosal. All rights reserved.
      </div>
    </footer>
  );
};
