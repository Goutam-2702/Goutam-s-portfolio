import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { X, ZoomIn } from 'lucide-react';

import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const Certificates = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'certificates'), (snapshot) => {
      setCertificates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'certificates'));
    return unsubscribe;
  }, []);

  return (
    <section id="certificates" className="py-24 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 tracking-tight">Certificates <span className="text-gradient">Gallery</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A showcase of my professional certifications and course completions.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedImage(cert.imageUrl)}
              className="glass-card rounded-2xl overflow-hidden cursor-pointer group relative"
            >
              <img
                src={cert.imageUrl}
                alt={cert.title}
                className="w-full aspect-[4/3] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="text-white" size={32} />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold truncate">{cert.title}</h3>
                <p className="text-[10px] text-muted-foreground">{cert.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedImage}
              className="max-w-full max-h-full rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
