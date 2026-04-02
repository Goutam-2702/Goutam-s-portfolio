import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc, getDoc 
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  ref, uploadString, getDownloadURL 
} from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { extractProfileFromResume } from '../services/geminiService';
import { 
  Plus, Trash2, Edit2, Save, LogOut, LogIn, 
  LayoutDashboard, FolderKanban, Trophy, Award, User as UserIcon, Upload, X, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'achievements' | 'certificates' | 'profile'>('projects');
  const [projects, setProjects] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({
    name: '', 
    tagline: '', 
    intro: '', 
    resumeUrl: '', 
    skills: [], 
    education: [],
    githubUrl: '',
    linkedinUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  useEffect(() => {
    if (!user) return;

    const unsubProjects = onSnapshot(collection(db, 'projects'), (s) => 
      setProjects(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'projects'));
    
    const unsubAchievements = onSnapshot(collection(db, 'achievements'), (s) => 
      setAchievements(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'achievements'));
    
    const unsubCertificates = onSnapshot(collection(db, 'certificates'), (s) => 
      setCertificates(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => handleFirestoreError(err, OperationType.GET, 'certificates'));

    const fetchProfile = async () => {
      try {
        const d = await getDoc(doc(db, 'profile', 'main'));
        if (d.exists()) setProfile(d.data());
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'profile/main');
      }
    };
    fetchProfile();

    return () => {
      unsubProjects();
      unsubAchievements();
      unsubCertificates();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const compressImageToBase64 = (file: File): Promise<string> => {
    console.log(`compressImageToBase64 started for: ${file.name}`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        console.log("FileReader loaded image data");
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          console.log(`Original image dimensions: ${img.width}x${img.height}`);
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          console.log(`Target image dimensions: ${width}x${height}`);
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.5);
          console.log(`Compression finished. Base64 length: ${base64.length}`);
          resolve(base64);
        };
        img.onerror = (e) => {
          console.error("Image load error", e);
          reject(new Error("Failed to load image for compression"));
        };
      };
      reader.onerror = (e) => {
        console.error("FileReader error", e);
        reject(new Error("Failed to read file"));
      };
    });
  };

  const handleFileUpload = async (file: File, path: string) => {
    console.log(`handleFileUpload started for: ${file.name}, original size: ${file.size}, path: ${path}`);
    
    if (!auth.currentUser) {
      setStatusMsg({ text: 'You must be logged in to upload files', type: 'error' });
      return null;
    }

    console.log(`File type: ${file.type}, size: ${file.size}`);
    setIsUploading(true);
    setStatusMsg({ text: 'Processing image...', type: 'success' });
    
    try {
      // For images, we'll use Base64 storage in Firestore as a robust alternative to Storage
      if (file.type.startsWith('image/')) {
        try {
          console.log("Starting extreme image compression for Firestore storage...");
          const base64Data = await compressImageToBase64(file);
          console.log(`Compression finished. Base64 length: ${base64Data.length}`);
          
          // Check if the base64 is within Firestore limits (1MB)
          if (base64Data.length > 800000) { // ~800KB limit to be safe
            throw new Error('Image too large even after compression');
          }
          
          setStatusMsg({ text: 'Image processed successfully!', type: 'success' });
          setIsUploading(false);
          return base64Data;
        } catch (compressError: any) {
          console.error("Compression failed:", compressError);
          setStatusMsg({ text: `Compression failed: ${compressError.message}`, type: 'error' });
          setIsUploading(false);
          return null;
        }
      }

      // Fallback for non-image files (though not expected for certificates)
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const uploadData = await base64Promise;
      
      await uploadString(storageRef, uploadData, 'data_url');
      const url = await getDownloadURL(storageRef);
      setIsUploading(false);
      return url;

    } catch (error: any) {
      console.error("Upload setup exception:", error);
      setStatusMsg({ text: `Upload failed: ${error.message}`, type: 'error' });
      setIsUploading(false);
      return null;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 rounded-3xl text-center max-w-md w-full"
        >
          <LayoutDashboard size={64} className="mx-auto mb-6 text-blue-500" />
          <h1 className="text-3xl font-bold mb-4">Admin Access</h1>
          <p className="text-muted-foreground mb-8">Please sign in to manage your portfolio content.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
          >
            <LogIn size={20} /> Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  // Check if admin (simple check for demo, real check in security rules)
  const isAdmin = user.email === "litughosal@gmail.com";

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card p-12 rounded-3xl text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="mb-8">Only the owner can access the admin dashboard.</p>
          <button onClick={handleLogout} className="px-6 py-2 bg-muted rounded-lg">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          <div className="glass-card p-4 rounded-2xl mb-6 flex items-center gap-3">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          
          {[
            { id: 'projects', label: 'Projects', icon: <FolderKanban size={18} /> },
            { id: 'achievements', label: 'Achievements', icon: <Trophy size={18} /> },
            { id: 'certificates', label: 'Certificates', icon: <Award size={18} /> },
            { id: 'profile', label: 'Profile', icon: <UserIcon size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "hover:bg-white/10"
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all mt-8"
          >
            <LogOut size={18} /> Logout
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-grow space-y-6 relative">
          <AnimatePresence>
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "absolute -top-12 left-0 right-0 p-3 rounded-xl text-center text-sm font-bold z-10",
                  statusMsg.type === 'success' ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-red-500/20 text-red-500 border border-red-500/30"
                )}
              >
                {statusMsg.text}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'projects' && <ProjectManager projects={projects} onUpload={handleFileUpload} setStatus={setStatusMsg} />}
          {activeTab === 'achievements' && <AchievementManager achievements={achievements} onUpload={handleFileUpload} setStatus={setStatusMsg} />}
          {activeTab === 'certificates' && <CertificateManager certificates={certificates} onUpload={handleFileUpload} setStatus={setStatusMsg} />}
          {activeTab === 'profile' && <ProfileManager profile={profile} setProfile={setProfile} onUpload={handleFileUpload} setStatus={setStatusMsg} />}
        </main>
      </div>
    </div>
  );
};

// Sub-components for Manager Tabs
const ProjectManager = ({ projects, onUpload, setStatus }: { projects: any[], onUpload: any, setStatus: any }) => {
  const [editing, setEditing] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', githubUrl: '', liveUrl: '', tags: '', order: 0, imageUrl: '' });

  const handleSave = async () => {
    if (!newItem.title) return setStatus({ text: 'Title is required', type: 'error' });
    setIsSaving(true);
    try {
      const data = { ...newItem, tags: newItem.tags.split(',').map(t => t.trim()) };
      if (editing) {
        await updateDoc(doc(db, 'projects', editing.id), data);
        setStatus({ text: 'Project updated!', type: 'success' });
        setEditing(null);
      } else {
        await addDoc(collection(db, 'projects'), data);
        setStatus({ text: 'Project added!', type: 'success' });
      }
      setNewItem({ title: '', description: '', githubUrl: '', liveUrl: '', tags: '', order: 0, imageUrl: '' });
    } catch (error) {
      console.error(error);
      setStatus({ text: 'Error saving project', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
      setStatus({ text: 'Project deleted!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
      setStatus({ text: 'Error deleting project', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Plus className="text-blue-500" /> {editing ? 'Edit Project' : 'Add New Project'}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input 
            placeholder="Title" 
            className="glass p-3 rounded-xl outline-none" 
            value={newItem.title} 
            onChange={e => setNewItem({...newItem, title: e.target.value})} 
          />
          <input 
            placeholder="Order (number)" 
            type="number"
            className="glass p-3 rounded-xl outline-none" 
            value={isNaN(newItem.order) ? '' : newItem.order} 
            onChange={e => {
              const val = parseInt(e.target.value);
              setNewItem({...newItem, order: isNaN(val) ? 0 : val});
            }} 
          />
          <textarea 
            placeholder="Description" 
            className="glass p-3 rounded-xl outline-none md:col-span-2 h-24" 
            value={newItem.description} 
            onChange={e => setNewItem({...newItem, description: e.target.value})} 
          />
          <input 
            placeholder="GitHub URL" 
            className="glass p-3 rounded-xl outline-none" 
            value={newItem.githubUrl} 
            onChange={e => setNewItem({...newItem, githubUrl: e.target.value})} 
          />
          <input 
            placeholder="Live URL" 
            className="glass p-3 rounded-xl outline-none" 
            value={newItem.liveUrl} 
            onChange={e => setNewItem({...newItem, liveUrl: e.target.value})} 
          />
          <input 
            placeholder="Tags (comma separated)" 
            className="glass p-3 rounded-xl outline-none md:col-span-2" 
            value={newItem.tags} 
            onChange={e => setNewItem({...newItem, tags: e.target.value})} 
          />
          <div className="md:col-span-2 flex items-center gap-4">
            <input 
              type="file" 
              id="proj-img" 
              className="hidden" 
              onChange={async e => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const url = await onUpload(file, 'projects');
                    if (url) setNewItem({...newItem, imageUrl: url});
                  } catch (err) {
                    console.error("Project image upload error", err);
                  }
                }
              }} 
            />
            <label htmlFor="proj-img" className="flex items-center gap-2 px-4 py-2 glass rounded-xl cursor-pointer hover:bg-white/10">
              <Upload size={16} /> {newItem.imageUrl ? 'Image Uploaded' : 'Upload Image'}
            </label>
            {newItem.imageUrl && <img src={newItem.imageUrl} className="h-10 w-10 object-cover rounded-lg" referrerPolicy="no-referrer" />}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {editing ? 'Update' : 'Save'}
          </button>
          {editing && <button onClick={() => { setEditing(null); setNewItem({ title: '', description: '', githubUrl: '', liveUrl: '', tags: '', order: 0, imageUrl: '' }); }} className="px-6 py-2 bg-muted rounded-xl">Cancel</button>}
        </div>
      </div>

      <div className="grid gap-4">
        {projects.map(p => (
          <div key={p.id} className="glass-card p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={p.imageUrl || 'https://picsum.photos/100'} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
              <div>
                <p className="font-bold">{p.title}</p>
                <p className="text-xs text-muted-foreground">Order: {p.order}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(p); setNewItem({ ...p, tags: p.tags.join(', ') }); }} className="p-2 hover:bg-white/10 rounded-lg text-blue-500"><Edit2 size={18} /></button>
              <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-500"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AchievementManager = ({ achievements, onUpload, setStatus }: { achievements: any[], onUpload: any, setStatus: any }) => {
  const [newItem, setNewItem] = useState({ title: '', description: '', date: '', type: 'hackathon', imageUrl: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!newItem.title || !newItem.description || !newItem.date) {
      return setStatus({ text: 'All fields are required', type: 'error' });
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'achievements'), newItem);
      setStatus({ text: 'Achievement added!', type: 'success' });
      setNewItem({ title: '', description: '', date: '', type: 'hackathon', imageUrl: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'achievements');
      setStatus({ text: 'Error saving achievement', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'achievements', id));
      setStatus({ text: 'Achievement deleted!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `achievements/${id}`);
      setStatus({ text: 'Error deleting achievement', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-xl font-bold mb-6">Add Achievement</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input placeholder="Title" className="glass p-3 rounded-xl outline-none" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
          <select className="glass p-3 rounded-xl outline-none" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
            <option value="hackathon">Hackathon</option>
            <option value="certification">Certification</option>
            <option value="internship">Internship</option>
          </select>
          <input placeholder="Date (e.g. Mar 2024)" className="glass p-3 rounded-xl outline-none" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} />
          <textarea placeholder="Description" className="glass p-3 rounded-xl outline-none md:col-span-2 h-24" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
          <div className="md:col-span-2">
            <input type="file" id="ach-img" className="hidden" onChange={async e => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const url = await onUpload(file, 'achievements');
                  if (url) setNewItem({...newItem, imageUrl: url});
                } catch (err) {
                  console.error("Achievement image upload error", err);
                }
              }
            }} />
            <label htmlFor="ach-img" className="flex items-center gap-2 px-4 py-2 glass rounded-xl cursor-pointer hover:bg-white/10 w-fit">
              <Upload size={16} /> {newItem.imageUrl ? 'Image Uploaded' : 'Upload Image'}
            </label>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Save Achievement
        </button>
      </div>
      <div className="grid gap-4">
        {achievements.map(a => (
          <div key={a.id} className="glass-card p-4 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 glass rounded-lg"><Trophy size={16} /></div>
              <div>
                <p className="font-bold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.type} • {a.date}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(a.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CertificateManager = ({ certificates, onUpload, setStatus }: { certificates: any[], onUpload: any, setStatus: any }) => {
  const [newItem, setNewItem] = useState({ title: '', imageUrl: '', date: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [localUploading, setLocalUploading] = useState(false);

  const handleSave = async () => {
    if (!newItem.title || !newItem.imageUrl) {
      console.log("Validation failed: Title or Image missing", newItem);
      return setStatus({ text: 'Title and Image are required', type: 'error' });
    }
    setIsSaving(true);
    try {
      console.log("Final newItem before saving to Firestore:", newItem);
      console.log("Saving certificate to Firestore...", newItem);
      await addDoc(collection(db, 'certificates'), newItem);
      setStatus({ text: 'Certificate added!', type: 'success' });
      setNewItem({ title: '', imageUrl: '', date: '' });
    } catch (error: any) {
      console.error("Error saving certificate:", error);
      let errorMessage = 'Error saving certificate';
      try {
        handleFirestoreError(error, OperationType.WRITE, 'certificates');
      } catch (err: any) {
        try {
          const info = JSON.parse(err.message);
          errorMessage = `Save failed: ${info.error}`;
        } catch (e) {
          errorMessage = err.message;
        }
      }
      setStatus({ text: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'certificates', id));
      setStatus({ text: 'Certificate deleted!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `certificates/${id}`);
      setStatus({ text: 'Error deleting certificate', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-xl font-bold mb-6">Add Certificate</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input placeholder="Title" className="glass p-3 rounded-xl outline-none" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
          <input placeholder="Date (e.g. 2024)" className="glass p-3 rounded-xl outline-none" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} />
          <div className="md:col-span-2">
            <input type="file" id="cert-img" className="hidden" accept="image/*" onChange={async e => {
              const file = e.target.files?.[0];
              if (file) {
                setLocalUploading(true);
                try {
                  const url = await onUpload(file, 'certificates');
                  if (url) setNewItem({...newItem, imageUrl: url});
                } catch (err) {
                  console.error("Certificate image upload error", err);
                } finally {
                  setLocalUploading(false);
                }
              }
            }} />
            <label htmlFor="cert-img" className={cn(
              "flex items-center gap-2 px-4 py-2 glass rounded-xl cursor-pointer hover:bg-white/10 w-fit transition-all",
              localUploading && "opacity-50 pointer-events-none"
            )}>
              {localUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {newItem.imageUrl ? 'Image Uploaded' : 'Upload Image'}
            </label>
            {newItem.imageUrl && (
              <div className="mt-2 relative w-fit">
                <img src={newItem.imageUrl} className="h-20 w-32 object-cover rounded-lg border border-white/10" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setNewItem({...newItem, imageUrl: ''})}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving || localUploading}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Save Certificate
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {certificates.map(c => (
          <div key={c.id} className="glass-card p-3 rounded-2xl relative group">
            <img src={c.imageUrl} className="w-full aspect-video object-cover rounded-lg mb-2" referrerPolicy="no-referrer" />
            <p className="text-xs font-bold truncate">{c.title}</p>
            {c.date && <p className="text-[10px] text-muted-foreground">{c.date}</p>}
            <button onClick={() => handleDelete(c.id)} className="absolute top-4 right-4 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfileManager = ({ profile, setProfile, onUpload, setStatus }: { profile: any, setProfile: any, onUpload: any, setStatus: any }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'profile', 'main'), profile);
      setStatus({ text: 'Profile updated!', type: 'success' });
    } catch (error) {
      console.error(error);
      setStatus({ text: 'Error updating profile', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtract = async (file: File) => {
    setIsExtracting(true);
    setStatus({ text: 'Extracting data from resume...', type: 'success' });
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;
      
      const data = await extractProfileFromResume(base64, file.type);
      if (data) {
        setProfile({
          ...profile,
          name: data.name || profile.name,
          tagline: data.tagline || profile.tagline,
          intro: data.intro || profile.intro,
          skills: data.skills || profile.skills,
          education: data.education || profile.education,
          githubUrl: data.githubUrl || profile.githubUrl,
          linkedinUrl: data.linkedinUrl || profile.linkedinUrl
        });
        setStatus({ text: 'Data extracted successfully!', type: 'success' });
      } else {
        setStatus({ text: 'Failed to extract data.', type: 'error' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ text: 'Error extracting data.', type: 'error' });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="glass-card p-8 rounded-3xl space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Manage Profile</h3>
        <div className="flex gap-2">
          <input 
            type="file" 
            id="resume-extract" 
            className="hidden" 
            accept=".pdf,.doc,.docx" 
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleExtract(file);
            }} 
          />
          <label 
            htmlFor="resume-extract" 
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl cursor-pointer hover:bg-purple-600/30 transition-all",
              isExtracting && "opacity-50 pointer-events-none"
            )}
          >
            {isExtracting ? (
              <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            Extract from Resume
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
          <input className="w-full glass p-3 rounded-xl outline-none" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Tagline</label>
          <input className="w-full glass p-3 rounded-xl outline-none" value={profile.tagline} onChange={e => setProfile({...profile, tagline: e.target.value})} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Intro Text</label>
          <textarea className="w-full glass p-3 rounded-xl outline-none h-24" value={profile.intro} onChange={e => setProfile({...profile, intro: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Resume URL / Upload</label>
          <div className="flex gap-2">
            <input className="flex-grow glass p-3 rounded-xl outline-none" value={profile.resumeUrl} onChange={e => setProfile({...profile, resumeUrl: e.target.value})} />
            <input type="file" id="resume-up" className="hidden" accept=".pdf" onChange={async e => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const url = await onUpload(file, 'resumes');
                  if (url) setProfile({...profile, resumeUrl: url});
                } catch (err) {
                  console.error("Resume upload error", err);
                }
              }
            }} />
            <label htmlFor="resume-up" className="p-3 glass rounded-xl cursor-pointer hover:bg-white/10">
              <Upload size={18} />
            </label>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Skills (comma separated)</label>
          <input className="w-full glass p-3 rounded-xl outline-none" value={profile.skills?.join(', ')} onChange={e => setProfile({...profile, skills: e.target.value.split(',').map((s: string) => s.trim())})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">GitHub URL</label>
          <input className="w-full glass p-3 rounded-xl outline-none" value={profile.githubUrl} onChange={e => setProfile({...profile, githubUrl: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">LinkedIn URL</label>
          <input className="w-full glass p-3 rounded-xl outline-none" value={profile.linkedinUrl} onChange={e => setProfile({...profile, linkedinUrl: e.target.value})} />
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase text-muted-foreground">Education</label>
            <button 
              onClick={() => setProfile({...profile, education: [...(profile.education || []), { degree: '', institution: '', year: '' }]})}
              className="p-1 hover:bg-white/10 rounded-lg text-blue-500"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-3">
            {profile.education?.map((edu: any, idx: number) => (
              <div key={idx} className="glass p-4 rounded-2xl relative group">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    placeholder="Degree" 
                    className="bg-transparent border-b border-white/10 p-1 outline-none text-sm" 
                    value={edu.degree} 
                    onChange={e => {
                      const newEdu = [...profile.education];
                      newEdu[idx].degree = e.target.value;
                      setProfile({...profile, education: newEdu});
                    }} 
                  />
                  <input 
                    placeholder="Institution" 
                    className="bg-transparent border-b border-white/10 p-1 outline-none text-sm" 
                    value={edu.institution} 
                    onChange={e => {
                      const newEdu = [...profile.education];
                      newEdu[idx].institution = e.target.value;
                      setProfile({...profile, education: newEdu});
                    }} 
                  />
                  <input 
                    placeholder="Year" 
                    className="bg-transparent border-b border-white/10 p-1 outline-none text-sm" 
                    value={edu.year} 
                    onChange={e => {
                      const newEdu = [...profile.education];
                      newEdu[idx].year = e.target.value;
                      setProfile({...profile, education: newEdu});
                    }} 
                  />
                </div>
                <button 
                  onClick={() => {
                    const newEdu = profile.education.filter((_: any, i: number) => i !== idx);
                    setProfile({...profile, education: newEdu});
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button 
        onClick={handleSave} 
        disabled={isSaving}
        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
      >
        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
        Save Changes
      </button>
    </div>
  );
};
