import { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Mail, Globe, Phone, Camera, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function AddClientsView() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl font-display font-bold mb-2 tracking-tighter text-ink">Add New Client</h1>
        <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Register a new creative partner in the cloud</p>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
        {/* Form Section */}
        <div className="space-y-8 bg-paper p-10 rounded-3xl border border-ink/5 shadow-sm">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface border border-ink/5 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-muted/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 group-focus-within:text-accent transition-colors" />
                <input 
                  type="email" 
                  placeholder="name@company.com"
                  className="w-full bg-surface border border-ink/5 rounded-xl pl-12 pr-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-muted/40"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Website / Portfolio</label>
              <div className="relative group">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 group-focus-within:text-accent transition-colors" />
                <input 
                  type="text" 
                  placeholder="https://..."
                  className="w-full bg-surface border border-ink/5 rounded-xl pl-12 pr-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-muted/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 group-focus-within:text-accent transition-colors" />
                <input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-surface border border-ink/5 rounded-xl pl-12 pr-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-muted/40"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-ink text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-2xl shadow-ink/20 hover:translate-y-[-2px] active:translate-y-[0px] transition-all">
              Initialize Client Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Avatar / Sidebar Section */}
        <div className="space-y-8">
          {/* Correction Header/Avatar: Explicit padding and relative container to ensure visibility */}
          <div className="relative pt-2"> 
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 mb-4 block">Client Avatar</label>
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              className={cn(
                "aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all overflow-hidden bg-paper shadow-sm group cursor-pointer",
                dragActive ? "border-accent bg-accent/5 scale-[0.98]" : "border-ink/10 hover:border-accent/40"
              )}
            >
              <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center text-muted group-hover:scale-110 group-hover:text-accent transition-all shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center px-6">
                <p className="text-xs font-bold uppercase tracking-widest text-ink">Upload Image</p>
                <p className="text-[10px] text-muted mt-1 font-medium">Recommended: 400x400 JPG/PNG</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-accent/5 border border-accent/10 rounded-2xl">
            <h4 className="text-[10px] font-bold text-accent uppercase tracking-widest mb-3">Onboarding Status</h4>
            <div className="space-y-3">
              {[
                { label: "Profile Setup", done: true },
                { label: "Workspace Creation", done: false },
                { label: "Invite sent", done: false },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={cn("w-1.5 h-1.5 rounded-full", step.done ? "bg-accent" : "bg-ink/10")} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", step.done ? "text-ink" : "text-muted")}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
