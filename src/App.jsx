/* PROJECTPRO MANAGEMENT SUITE 
   Version: 12.0 - The "Ultimate Workspace" Update
   Features: Gantt-Note Integration, Search, Pinning, Smart Bi-Di Editor
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, LayoutDashboard, Clock, List, Download, Trash2, Plus, ZoomIn, ZoomOut, Users, Activity, ShieldCheck, Moon, Sun, StickyNote, CheckCircle, RotateCcw, CornerDownRight, Bold, ListOrdered, Link as LinkIcon, Palette, Indent, Outdent, Pin, Search, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('dark_mode')) || false);
  const [team, setTeam] = useState(() => JSON.parse(localStorage.getItem('project_team')) || []);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('project_tasks')) || []);
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('project_notes')) || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const ganttContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('project_tasks', JSON.stringify(data));
    localStorage.setItem('project_team', JSON.stringify(team));
    localStorage.setItem('project_notes', JSON.stringify(notes));
    localStorage.setItem('dark_mode', JSON.stringify(isDarkMode));
  }, [data, team, notes, isDarkMode]);

  const safeDate = (d) => { const date = new Date(d); return isNaN(date) ? new Date() : date; };

  const projectRange = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    let start = new Date(today); start.setDate(today.getDate() - 21);
    if (data.length > 0) {
      const minDate = new Date(Math.min(...data.map(d => safeDate(d.start).getTime())));
      if (minDate < start) start = new Date(minDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    }
    let end = new Date(today); end.setDate(end.getDate() + 90);
    return { start, end, totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) };
  }, [data]);

  useEffect(() => {
    if (activeTab === 'gantt' && ganttContainerRef.current) {
      const today = new Date();
      const oneWeekAgo = new Date(today.setDate(today.getDate() - 7));
      const diffDays = (oneWeekAgo - projectRange.start) / (1000 * 60 * 60 * 24);
      ganttContainerRef.current.scrollLeft = (diffDays * 40 * zoomScale);
    }
  }, [activeTab, zoomScale, projectRange.start]);

  const groupedData = useMemo(() => {
    const groups = {};
    data.forEach(task => {
      if (!groups[task.project]) groups[task.project] = { name: task.project, tasks: [] };
      groups[task.project].tasks.push(task);
    });
    return Object.values(groups);
  }, [data]);

  // --- ACTIONS ---
  const execCmd = (cmd, value = null) => document.execCommand(cmd, false, value);
  
  const insertLink = () => {
    const url = prompt("כתובת האתר (URL):", "https://");
    if (!url) return;
    const text = prompt("טקסט להצגה:", "לינק");
    if (!text) return;
    const html = `<a href="${url}" target="_blank" style="color:#4f46e5; font-weight:bold; text-decoration:underline;">${text}</a>&nbsp;`;
    execCmd('insertHTML', html);
  };

  const addNote = (parentId = null) => {
    const newNote = {
      id: Date.now(),
      parentId,
      title: parentId ? 'Follow-up' : 'New Note',
      content: '<div></div>',
      date: new Date().toLocaleString('he-IL'),
      color: isDarkMode ? '#1e1b4b' : '#fefcbf',
      isClosed: false,
      isPinned: false,
      linkedTaskId: null
    };
    setNotes([newNote, ...notes]);
  };

  const updateNote = (id, field, value) => setNotes(notes.map(n => n.id === id ? { ...n, [field]: value } : n));

  const filteredNotes = useMemo(() => {
    let list = notes.filter(n => 
      !n.parentId && 
      (n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       n.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return list.sort((a, b) => (b.isPinned - a.isPinned));
  }, [notes, searchTerm]);

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    sidebar: isDarkMode ? 'bg-slate-900/80 backdrop-blur-2xl border-white/5' : 'bg-white/60 backdrop-blur-2xl border-white/40',
    card: isDarkMode ? 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white/50 backdrop-blur-xl border-white/60 shadow-xl',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    border: isDarkMode ? 'border-white/10' : 'border-white/40',
    input: isDarkMode ? 'bg-slate-800/50 border-white/10' : 'bg-white/60 border-white/40'
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-700 font-sans overflow-hidden relative`} dir="ltr">
      
      {/* Sidebar */}
      <aside className={`w-64 ${theme.sidebar} p-6 flex flex-col shrink-0 border-r z-50`}>
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl"><Activity size={20} className="text-white"/></div>
                <h1 className="font-black text-xl uppercase tracking-tighter italic">ProjectPro</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun className="text-yellow-400"/> : <Moon className="text-indigo-600"/>}</button>
        </div>
        <div className="mb-6"><span className="bg-indigo-600/20 text-indigo-500 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/30 uppercase">v12.0 Pro</span></div>
        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team', 'notes'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-indigo-600/10'}`}>
              {tab === 'notes' && <StickyNote size={17}/>} {tab === 'gantt' && <Clock size={17}/>} {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        
        {/* --- NOTES TAB --- */}
        {activeTab === 'notes' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white/10 p-4 rounded-[2rem] backdrop-blur-md border border-white/10">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  placeholder="חיפוש בפתקים..." 
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none border transition-all ${theme.input}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={() => addNote()} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Plus size={18}/> New Note
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {filteredNotes.map(note => (
                <div key={note.id} className="space-y-4">
                  <div className={`${theme.card} p-8 rounded-[3rem] border-2 group transition-all relative ${note.isClosed ? 'opacity-40 grayscale' : ''}`} style={{ backgroundColor: note.isClosed ? '' : note.color }}>
                    
                    {/* Toolbar */}
                    <div className="flex gap-2 mb-4 p-2 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => execCmd('bold')}><Bold size={16}/></button>
                      <button onClick={() => execCmd('insertUnorderedList')}><ListOrdered size={16}/></button>
                      <button onClick={insertLink}><LinkIcon size={16}/></button>
                      <button onClick={() => execCmd('indent')}><Indent size={16}/></button>
                      <button onClick={() => updateNote(note.id, 'isPinned', !note.isPinned)} className={note.isPinned ? 'text-indigo-600' : ''}><Pin size={16}/></button>
                    </div>

                    <div className="flex justify-between mb-4">
                      <input 
                        className="bg-transparent font-black text-lg outline-none w-full uppercase" 
                        value={note.title} 
                        onChange={(e) => updateNote(note.id, 'title', e.target.value)} 
                      />
                      <select 
                        className="bg-transparent text-[10px] font-bold outline-none max-w-[100px] border-none"
                        value={note.linkedTaskId || ''}
                        onChange={(e) => updateNote(note.id, 'linkedTaskId', e.target.value)}
                      >
                        <option value="">קישור למשימה...</option>
                        {data.map(t => <option key={t.id} value={t.id}>{t.task}</option>)}
                      </select>
                    </div>

                    <div 
                      className="min-h-[150px] text-sm outline-none font-medium prose prose-indigo max-w-none"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateNote(note.id, 'content', e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: note.content }}
                      style={{ direction: 'auto', textAlign: 'start' }}
                    />

                    <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-center">
                      <span className="text-[10px] font-black opacity-30">{note.date}</span>
                      <div className="flex gap-2">
                        <input type="color" value={note.color} onChange={(e) => updateNote(note.id, 'color', e.target.value)} className="w-6 h-6 rounded-full border-2 border-white cursor-pointer" />
                        <button onClick={() => updateNote(note.id, 'isClosed', !note.isClosed)} className="p-2">{note.isClosed ? <RotateCcw size={18}/> : <CheckCircle size={18} className="text-emerald-600"/>}</button>
                        <button onClick={() => addNote(note.id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><CornerDownRight size={12}/> Sub-task</button>
                      </div>
                    </div>
                  </div>

                  {/* Child Notes Rendering Logic */}
                  {notes.filter(c => c.parentId === note.id).map(child => (
                    <div key={child.id} className="ml-16 border-l-2 border-indigo-200 pl-6">
                      <div className={`${theme.card} p-4 rounded-2xl text-xs bg-white/30`} style={{ direction: 'auto' }}>
                         <div contentEditable dangerouslySetInnerHTML={{ __html: child.content }} onBlur={(e) => updateNote(child.id, 'content', e.currentTarget.innerHTML)} className="outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- GANTT TAB WITH NOTE INTEGRATION --- */}
        {activeTab === 'gantt' && (
          <div className={`${theme.card} rounded-[3rem] border flex flex-col h-full overflow-hidden shadow-2xl`}>
             <div className="flex-1 overflow-auto relative" ref={ganttContainerRef}>
               <div style={{ width: `${projectRange.totalDays * 40 * zoomScale}px` }} className="relative min-h-full">
                 <div className={`flex sticky top-0 z-40 ${isDarkMode ? 'bg-slate-950/60' : 'bg-white/60'} backdrop-blur-md border-b ${theme.border} ml-[200px]`}>
                   {Array.from({length: Math.ceil(projectRange.totalDays / 7)}).map((_, i) => {
                     const d = new Date(projectRange.start); d.setDate(d.getDate() + (i * 7));
                     return <div key={i} className="flex-1 text-center py-4 border-r border-white/10 font-bold text-[9px] uppercase" style={{ minWidth: `${7 * 40 * zoomScale}px` }}>W{i+1} • {d.getDate()}/{d.getMonth()+1}</div>
                   })}
                 </div>

                 {/* TODAY LINE */}
                 {(() => {
                   const today = new Date(); today.setHours(0,0,0,0);
                   const diffDays = (today - projectRange.start) / (1000 * 60 * 60 * 24);
                   return <div className="absolute top-0 bottom-0 z-[100] border-l-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" style={{ left: `${200 + (diffDays * 40 * zoomScale)}px` }}><div className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full absolute top-10 -left-4">TODAY</div></div>;
                 })()}

                 <div className="relative z-10">
                   {groupedData.map((group, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center border-b ${theme.border} bg-indigo-500/5"><div className="w-[200px] shrink-0 p-4 border-r font-black text-[10px] text-indigo-500 uppercase sticky left-0 z-30 bg-inherit">📁 {group.name}</div><div className="flex-1 h-10" /></div>
                      {group.tasks.map(task => {
                        const start = safeDate(task.start); const end = safeDate(task.end);
                        const left = Math.ceil((start - projectRange.start) / (1000*60*60*24)) * 40 * zoomScale;
                        const w = Math.ceil((end - start) / (1000*60*60*24)) * 40 * zoomScale;
                        const hasNote = notes.find(n => n.linkedTaskId == task.id);
                        return (
                          <div key={task.id} className="flex items-center border-b transition-colors hover:bg-white/5">
                            <div className="w-[200px] shrink-0 p-4 border-r sticky left-0 z-30 bg-inherit flex items-center gap-2">
                               <input type="color" value={task.color} readOnly className="w-3 h-3 rounded-full border-none" />
                               <span className="text-[10px] font-black uppercase truncate">{task.task}</span>
                            </div>
                            <div className="flex-1 h-14 relative">
                               <div className="absolute h-7 top-3.5 rounded-full flex items-center px-3 text-[9px] text-white font-black overflow-hidden shadow-lg transition-transform hover:scale-[1.02]" 
                                    style={{ left: `${left}px`, width: `${Math.max(w, 40)}px`, backgroundColor: task.color }}>
                                 <div className="absolute inset-0 bg-black/20" style={{ width: `${task.progress}%` }} />
                                 <span className="relative z-10">{task.progress}%</span>
                                 {/* ICON INDICATOR ON BAR */}
                                 {hasNote && <div title={hasNote.title} className="absolute right-2 text-white/80 animate-bounce"><StickyNote size={12}/></div>}
                               </div>
                               <div className="absolute top-3.5 flex flex-col items-center" style={{ left: `${left + w}px`, transform: 'translateX(-50%)' }}>
                                  <div className="w-3 h-3 rotate-45 border-2 border-white shadow-md" style={{ backgroundColor: task.color }} />
                                  <span className="text-[8px] font-black mt-5 px-1 rounded bg-white/20">{end.getDate()}/{end.getMonth()+1}</span>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;