/* PROJECTPRO MANAGEMENT SUITE 
   Version: 11.6 
   Feature: Rich Text Notes (Color, Lists, Links, Sub-items)
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, LayoutDashboard, Clock, List, Download, Trash2, Plus, ZoomIn, ZoomOut, Users, Activity, ShieldCheck, Moon, Sun, StickyNote, CheckCircle, RotateCcw, CornerDownRight, Bold, ListOrdered, Link, Palette, AlignRight } from 'lucide-react';
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

  // פונקציות עריכת טקסט עשיר
  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
  };

  const addNote = (parentId = null) => {
    const newNote = {
      id: Date.now(),
      parentId: parentId,
      title: parentId ? 'Follow-up' : 'New Note',
      content: '<div>Start typing...</div>',
      date: new Date().toLocaleString('he-IL'),
      color: parentId ? (isDarkMode ? '#1e293b' : '#f3f4f6') : (isDarkMode ? '#312e81' : '#fef08a'),
      textColor: isDarkMode ? '#e2e8f0' : '#000000',
      isClosed: false,
    };
    setNotes([newNote, ...notes]);
  };

  const updateNote = (id, field, value) => setNotes(notes.map(n => n.id === id ? { ...n, [field]: value } : n));
  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id));

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    sidebar: isDarkMode ? 'bg-slate-900/60 backdrop-blur-2xl border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-2xl border-white/40 shadow-xl',
    card: isDarkMode ? 'bg-slate-900/40 backdrop-blur-xl border-white/5' : 'bg-white/40 backdrop-blur-xl border-white/60',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    border: isDarkMode ? 'border-white/10' : 'border-white/40',
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-700 font-sans overflow-hidden relative`} dir="ltr">
      
      {/* Sidebar */}
      <aside className={`w-64 ${theme.sidebar} p-6 flex flex-col shrink-0 border-r z-50`}>
        <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg"><Activity size={20}/></div>
                <h1 className="font-black text-xl italic tracking-tighter uppercase">ProjectPro</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-white/10">
                {isDarkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-indigo-600"/>}
            </button>
        </div>
        <div className="mb-6"><span className="bg-indigo-600/20 text-indigo-500 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/30 tracking-widest uppercase">v11.6 Rich Notes</span></div>

        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team', 'notes'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-600/10 hover:text-indigo-600'}`}>
              {tab === 'notes' && <StickyNote size={17}/>} {tab === 'gantt' && <Clock size={17}/>} {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Rich Text Workspace</h2>
              <button onClick={() => addNote()} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all">
                <Plus size={16}/> New Note
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {notes.filter(n => !n.parentId).map(note => (
                <div key={note.id} className="space-y-4">
                  {/* MAIN NOTE */}
                  <div className={`${theme.card} p-6 rounded-[2.5rem] border relative group transition-all shadow-2xl ${note.isClosed ? 'opacity-30' : ''}`} style={{ backgroundColor: note.isClosed ? '' : note.color }}>
                    
                    {/* Toolbar */}
                    <div className="flex gap-2 mb-4 p-2 bg-black/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity overflow-x-auto">
                        <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-black/10 rounded"><Bold size={14}/></button>
                        <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-black/10 rounded"><ListOrdered size={14}/></button>
                        <button onClick={() => {const url = prompt('Enter URL:'); if(url) execCmd('createLink', url)}} className="p-1.5 hover:bg-black/10 rounded"><Link size={14}/></button>
                        <button onClick={() => {const color = prompt('Enter Color (e.g. red, #ff0000):'); if(color) execCmd('foreColor', color)}} className="p-1.5 hover:bg-black/10 rounded"><Palette size={14}/></button>
                        <button onClick={() => execCmd('indent')} className="p-1.5 hover:bg-black/10 rounded"><AlignRight size={14}/></button>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <input 
                        className="bg-transparent font-black uppercase text-sm outline-none w-full" 
                        value={note.title} 
                        onChange={(e) => updateNote(note.id, 'title', e.target.value)}
                        style={{ color: note.textColor }}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => updateNote(note.id, 'isClosed', !note.isClosed)} className="text-indigo-600">{note.isClosed ? <RotateCcw size={16}/> : <CheckCircle size={16}/>}</button>
                        <button onClick={() => deleteNote(note.id)} className="text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    
                    {/* Editable Content */}
                    <div 
                      className="min-h-[150px] text-xs outline-none font-medium leading-relaxed prose prose-sm max-w-none"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateNote(note.id, 'content', e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: note.content }}
                      style={{ color: note.textColor }}
                    />

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-black/5">
                      <span className="text-[9px] font-black opacity-40 uppercase tracking-tighter">{note.date}</span>
                      <div className="flex gap-3">
                        <input type="color" className="w-5 h-5 rounded-lg border-none cursor-pointer" value={note.color} onChange={(e) => updateNote(note.id, 'color', e.target.value)} />
                        <button onClick={() => addNote(note.id)} className="text-[9px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase flex items-center gap-1 shadow-md shadow-indigo-600/20"><CornerDownRight size={12}/> Follow-up</button>
                      </div>
                    </div>
                  </div>

                  {/* CHILD NOTES */}
                  {notes.filter(child => child.parentId === note.id).map(child => (
                    <div key={child.id} className="ml-12 relative">
                      <div className="absolute left-[-24px] top-6 text-indigo-400"><CornerDownRight size={20}/></div>
                      <div className={`${theme.card} p-5 rounded-[2rem] border text-xs shadow-lg ${child.isClosed ? 'opacity-30' : ''}`} style={{ backgroundColor: child.color }}>
                        <input className="bg-transparent font-black w-full outline-none mb-3" value={child.title} onChange={(e) => updateNote(child.id, 'title', e.target.value)} />
                        <div 
                          className="outline-none min-h-[60px] text-[11px]"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateNote(child.id, 'content', e.currentTarget.innerHTML)}
                          dangerouslySetInnerHTML={{ __html: child.content }}
                        />
                        <div className="flex justify-between mt-4 opacity-40 text-[8px] font-black uppercase">
                           <span>{child.date}</span>
                           <button onClick={() => deleteNote(child.id)} className="text-red-600 hover:scale-110"><Trash2 size={14}/></button>
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