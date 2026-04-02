import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Send, Github, Linkedin, Twitter, MapPin } from 'lucide-react';

export const Contact = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormState({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <section id="contact" className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl font-bold mb-4 tracking-tight">Get In <span className="text-gradient">Touch</span></h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Have a project in mind or just want to say hi? Feel free to reach out!
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-3xl space-y-6">
            <h3 className="text-2xl font-bold">Contact Information</h3>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="p-3 glass rounded-xl text-blue-500">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest">Email</p>
                <p className="text-foreground font-medium">kumargoutam2006@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="p-3 glass rounded-xl text-purple-500">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest">Location</p>
                <p className="text-foreground font-medium">IIT Patna, Bihar, India</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-6">Social Links</h3>
            <div className="flex gap-4">
              {[
                { icon: <Github />, href: "https://github.com/Goutam-2702", color: "hover:text-white" },
                { icon: <Linkedin />, href: "https://linkedin.com/in/goutam-kumar-ghosal", color: "hover:text-blue-500" },
                { icon: <Twitter />, href: "https://twitter.com", color: "hover:text-blue-400" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-4 glass rounded-2xl transition-all hover:scale-110 ${social.color}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Name</label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full px-4 py-3 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Email</label>
              <input
                type="email"
                required
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full px-4 py-3 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Message</label>
              <textarea
                required
                rows={4}
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                className="w-full px-4 py-3 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="How can I help you?"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : submitted ? (
                "Message Sent!"
              ) : (
                <>
                  <Send size={20} /> Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
