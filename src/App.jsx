/* PROJECTPRO MANAGEMENT SUITE 
   Version: 11.7 
   Feature: Smart Hyperlinks & Improved Nested Lists
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, LayoutDashboard, Clock, List, Download, Trash2, Plus, ZoomIn, ZoomOut, Users, Activity, ShieldCheck, Moon, Sun, StickyNote, CheckCircle, RotateCcw, CornerDownRight, Bold, ListOrdered, Link as LinkIcon, Palette, Indent, Outdent } from 'lucide-react';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('dark_mode')) || false);
  const [team, setTeam] = useState(() => JSON.parse(localStorage.getItem('project_team')) || []);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('project_tasks')) || []);
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('project_notes')) || []);
  const [zoomScale, setZoomScale] = useState(1);
  const ganttContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('project_tasks', JSON.stringify(data));
    localStorage.setItem('project_team', JSON.stringify(team));
    localStorage.setItem('project_notes', JSON.stringify(notes));
    localStorage.setItem('dark_mode', JSON.stringify(isDarkMode));
  }, [data, team, notes, isDarkMode]);

  // פונקציית עריכה משופרת
  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
  };

  // פונקציית לינק חכמה
  const insertSmartLink = () => {
    const url = prompt("Enter URL (e.g., https://google.com):");
    if (!url) return;
    const text = prompt("Enter the text to display:", url);
    if (!text) return;
    
    // יצירת לינק HTML בצורה ידנית כדי להבטיח תקינות
    const linkHTML = `<a href="${url}" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: bold;">${text}</a>`;
    execCmd('insertHTML', linkHTML);
  };

  const addNote = (parentId = null) => {
    const newNote = {
      id: Date.now(),
      parentId: parentId,
      title: parentId ? 'Follow-up' : 'New Note',
      content: '<div>• New point...</div>',
      date: new Date().toLocaleString('he-IL'),
      color: parentId ? (isDarkMode ? '#1e293b' : '#f9fafb') : (isDarkMode ? '#1e1b4b' : '#fef9c3'),
      textColor: isDarkMode ? '#f8fafc' : '#0f172a',
      isClosed: false,
    };
    setNotes([newNote, ...notes]);
  };

  const updateNote = (id, field, value) => setNotes(notes.map(n => n.id === id ? { ...n, [field]: value } : n));
  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id));

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    sidebar: isDarkMode ? 'bg-slate-900/80 backdrop-blur-2xl border-white/5' : 'bg-white/60 backdrop-blur-2xl border-white/40',
    card: isDarkMode ? 'bg-slate-900/60 backdrop-blur-xl border-white/5' : 'bg-white/50 backdrop-blur-xl border-white/60',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    border: isDarkMode ? 'border-white/10' : 'border-white/40',
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-700 font-sans overflow-hidden relative`} dir="ltr">
      
      {/* Sidebar */}
      <aside className={`w-64 ${theme.sidebar} p-6 flex flex-col shrink-0 border-r z-50 shadow-2xl`}>
        <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg"><Activity size={20}/></div>
                <h1 className="font-black text-xl italic tracking-tighter uppercase">ProjectPro</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-black/10 transition-colors">
                {isDarkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-indigo-600"/>}
            </button>
        </div>
        <div className="mb-6"><span className="bg-indigo-600/20 text-indigo-500 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/30 tracking-widest uppercase">v11.7 Pro Notes</span></div>

        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team', 'notes'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-indigo-600/10 hover:text-indigo-600'}`}>
              {tab === 'notes' && <StickyNote size={17}/>} {tab === 'gantt' && <Clock size={17}/>} {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        {activeTab === 'notes' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter drop-shadow-sm text-indigo-600">Workspace</h2>
              <button onClick={() => addNote()} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center gap-2 hover:bg-indigo-700 hover:scale-105 transition-all">
                <Plus size={18}/> New Note
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {notes.filter(n => !n.parentId).map(note => (
                <div key={note.id} className="space-y-6">
                  {/* MAIN NOTE CARD */}
                  <div className={`${theme.card} p-8 rounded-[3rem] border-2 relative group transition-all shadow-2xl ${note.isClosed ? 'opacity-30 grayscale' : ''}`} style={{ backgroundColor: note.isClosed ? '' : note.color }}>
                    
                    {/* ENHANCED TOOLBAR */}
                    <div className="flex gap-1.5 mb-6 p-2 bg-black/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex-wrap border border-black/5">
                        <button title="Bold" onClick={() => execCmd('bold')} className="p-2 hover:bg-black/10 rounded-lg transition-colors"><Bold size={16}/></button>
                        <button title="Numbered List" onClick={() => execCmd('insertOrderedList')} className="p-2 hover:bg-black/10 rounded-lg transition-colors"><ListOrdered size={16}/></button>
                        <button title="Smart Link" onClick={insertSmartLink} className="p-2 hover:bg-black/10 rounded-lg transition-colors"><LinkIcon size={16}/></button>
                        <button title="Indent" onClick={() => execCmd('indent')} className="p-2 hover:bg-black/10 rounded-lg transition-colors"><Indent size={16}/></button>
                        <button title="Outdent" onClick={() => execCmd('outdent')} className="p-2 hover:bg-black/10 rounded-lg transition-colors"><Outdent size={16}/></button>
                        <div className="w-px h-6 bg-black/10 mx-1" />
                        <button title="Text Color" onClick={() => {const c = prompt('Color?'); if(c) execCmd('foreColor', c)}} className="p-2 hover:bg-black/10 rounded-lg transition-colors"><Palette size={16}/></button>
                    </div>

                    <div className="flex justify-between items-start mb-6">
                      <input 
                        className="bg-transparent font-black uppercase text-base outline-none w-full tracking-tight" 
                        value={note.title} 
                        onChange={(e) => updateNote(note.id, 'title', e.target.value)}
                        style={{ color: note.textColor }}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => updateNote(note.id, 'isClosed', !note.isClosed)} className="p-2 hover:scale-110 transition-transform">{note.isClosed ? <RotateCcw size={20}/> : <CheckCircle size={20} className="text-emerald-600"/>}</button>
                        <button onClick={() => deleteNote(note.id)} className="p-2 hover:scale-110 transition-transform text-red-500"><Trash2 size={20}/></button>
                      </div>
                    </div>
                    
                    {/* RICH EDITABLE AREA */}
                    <div 
                      className="min-h-[180px] text-sm outline-none font-medium leading-relaxed prose prose-indigo max-w-none text-right"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateNote(note.id, 'content', e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: note.content }}
                      style={{ color: note.textColor }}
                    />

                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-black/5">
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{note.date}</span>
                      <div className="flex gap-4">
                        <input type="color" className="w-6 h-6 rounded-full border-2 border-white/50 cursor-pointer shadow-sm" value={note.color} onChange={(e) => updateNote(note.id, 'color', e.target.value)} />
                        <button onClick={() => addNote(note.id)} className="text-[10px] font-black bg-indigo-600 text-white px-5 py-2 rounded-2xl uppercase flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"><CornerDownRight size={14}/> Follow-up</button>
                      </div>
                    </div>
                  </div>

                  {/* CHILD NOTES */}
                  {notes.filter(child => child.parentId === note.id).map(child => (
                    <div key={child.id} className="ml-16 relative group/child">
                      <div className="absolute left-[-32px] top-8 text-indigo-400 transition-transform group-hover/child:translate-x-1"><CornerDownRight size={24}/></div>
                      <div className={`${theme.card} p-6 rounded-[2.5rem] border shadow-xl ${child.isClosed ? 'opacity-30' : ''}`} style={{ backgroundColor: child.color }}>
                        <input className="bg-transparent font-black w-full outline-none mb-3 text-xs uppercase" value={child.title} onChange={(e) => updateNote(child.id, 'title', e.target.value)} />
                        <div 
                          className="outline-none min-h-[80px] text-[12px] leading-relaxed"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateNote(child.id, 'content', e.currentTarget.innerHTML)}
                          dangerouslySetInnerHTML={{ __html: child.content }}
                        />
                        <div className="flex justify-between mt-5 pt-3 border-t border-black/5 opacity-30 text-[9px] font-black uppercase">
                           <span>{child.date}</span>
                           <button onClick={() => deleteNote(child.id)} className="text-red-600 hover:scale-125 transition-transform"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;