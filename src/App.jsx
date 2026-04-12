/* PROJECTPRO MANAGEMENT SUITE 
   Version: 12.1 
   Fixes: Restored Tasks Tab, Fixed Sub-task Creation & Deletion
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, LayoutDashboard, Clock, List, Download, Trash2, Plus, ZoomIn, ZoomOut, Users, Activity, ShieldCheck, Moon, Sun, StickyNote, CheckCircle, RotateCcw, CornerDownRight, Bold, ListOrdered, Link as LinkIcon, Palette, Indent, Outdent, Pin, Search, Filter } from 'lucide-react';
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

  // --- ACTIONS ---
  const execCmd = (cmd, value = null) => document.execCommand(cmd, false, value);
  
  const insertLink = () => {
    const url = prompt("כתובת האתר:", "https://");
    if (!url) return;
    const text = prompt("טקסט להצגה:", "Link");
    const html = `<a href="${url}" target="_blank" style="color:#4f46e5; font-weight:bold; text-decoration:underline;">${text || url}</a>&nbsp;`;
    execCmd('insertHTML', html);
  };

  const addNote = (parentId = null) => {
    const newNote = {
      id: Date.now(),
      parentId,
      title: parentId ? 'Follow-up' : 'New Note',
      content: '<div></div>',
      date: new Date().toLocaleString('he-IL'),
      color: parentId ? (isDarkMode ? '#1e293b' : '#f8fafb') : (isDarkMode ? '#1e1b4b' : '#fefcbf'),
      isClosed: false,
      isPinned: false,
      linkedTaskId: null
    };
    setNotes([newNote, ...notes]);
  };

  const updateNote = (id, field, value) => setNotes(notes.map(n => n.id === id ? { ...n, [field]: value } : n));
  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id && n.parentId !== id));

  const filteredNotes = useMemo(() => {
    let list = notes.filter(n => 
      !n.parentId && 
      (n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       n.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return list.sort((a, b) => (b.isPinned - a.isPinned));
  }, [notes, searchTerm]);

  const addTask = () => {
    const newTask = { id: Date.now(), project: "New Project", task: "New Task", start: new Date().toISOString().split('T')[0], end: new Date(Date.now() + 604800000).toISOString().split('T')[0], progress: 0, color: "#6366f1" };
    setData([...data, newTask]);
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    sidebar: isDarkMode ? 'bg-slate-900/80 backdrop-blur-2xl border-white/5' : 'bg-white/60 backdrop-blur-2xl border-white/40',
    card: isDarkMode ? 'bg-slate-900/40 backdrop-blur-xl border-white/5' : 'bg-white/50 backdrop-blur-xl border-white/60',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    border: isDarkMode ? 'border-white/10' : 'border-white/40',
    input: isDarkMode ? 'bg-slate-800/50 border-white/10' : 'bg-white/60 border-white/40'
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-700 font-sans overflow-hidden`} dir="ltr">
      
      {/* Sidebar */}
      <aside className={`w-64 ${theme.sidebar} p-6 flex flex-col shrink-0 border-r z-50`}>
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl"><Activity size={20} className="text-white"/></div>
                <h1 className="font-black text-xl uppercase italic tracking-tighter">ProjectPro</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun className="text-yellow-400"/> : <Moon className="text-indigo-600"/>}</button>
        </div>
        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team', 'notes'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-indigo-600/10'}`}>
              {tab === 'notes' && <StickyNote size={17}/>} {tab === 'tasks' && <List size={17}/>} {tab === 'gantt' && <Clock size={17}/>} {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        
        {/* --- TASKS TAB (RESTORED) --- */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black italic uppercase text-indigo-600">Task Management</h2>
              <button onClick={addTask} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700"><Plus size={18}/> Add Task</button>
            </div>
            <div className={`${theme.card} rounded-[2rem] border overflow-hidden`}>
              <table className="w-full text-left border-collapse">
                <thead className="bg-black/5 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Project</th><th className="p-4">Task</th><th className="p-4">Start</th><th className="p-4">End</th><th className="p-4">Progress</th><th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {data.map(task => (
                    <tr key={task.id} className="border-t border-black/5 hover:bg-black/5 transition-colors">
                      <td className="p-4"><input className="bg-transparent outline-none w-full" value={task.project} onChange={(e) => setData(data.map(t => t.id === task.id ? {...t, project: e.target.value} : t))} /></td>
                      <td className="p-4"><input className="bg-transparent outline-none w-full font-bold" value={task.task} onChange={(e) => setData(data.map(t => t.id === task.id ? {...t, task: e.target.value} : t))} /></td>
                      <td className="p-4"><input type="date" className="bg-transparent outline-none" value={task.start} onChange={(e) => setData(data.map(t => t.id === task.id ? {...t, start: e.target.value} : t))} /></td>
                      <td className="p-4"><input type="date" className="bg-transparent outline-none" value={task.end} onChange={(e) => setData(data.map(t => t.id === task.id ? {...t, end: e.target.value} : t))} /></td>
                      <td className="p-4"><input type="number" className="w-16 bg-transparent outline-none" value={task.progress} onChange={(e) => setData(data.map(t => t.id === task.id ? {...t, progress: parseInt(e.target.value)} : t))} /></td>
                      <td className="p-4"><button onClick={() => setData(data.filter(t => t.id !== task.id))} className="text-red-500 hover:scale-110"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- NOTES TAB (FIXED) --- */}
        {activeTab === 'notes' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input placeholder="Search notes..." className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none border ${theme.input}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => addNote()} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all">
                <Plus size={18}/> New Note
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {filteredNotes.map(note => (
                <div key={note.id} className="space-y-6">
                  {/* MAIN NOTE */}
                  <div className={`${theme.card} p-8 rounded-[3rem] border-2 group relative transition-all shadow-2xl ${note.isClosed ? 'opacity-40 grayscale' : ''}`} style={{ backgroundColor: note.isClosed ? '' : note.color }}>
                    <div className="flex gap-2 mb-4 p-2 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                      <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-black/10 rounded"><Bold size={16}/></button>
                      <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-black/10 rounded"><ListOrdered size={16}/></button>
                      <button onClick={insertLink} className="p-1.5 hover:bg-black/10 rounded"><LinkIcon size={16}/></button>
                      <button onClick={() => execCmd('indent')} className="p-1.5 hover:bg-black/10 rounded"><Indent size={16}/></button>
                      <button onClick={() => updateNote(note.id, 'isPinned', !note.isPinned)} className={`p-1.5 rounded ${note.isPinned ? 'text-indigo-600 bg-indigo-100' : 'hover:bg-black/10'}`}><Pin size={16}/></button>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                      <input className="bg-transparent font-black text-lg outline-none w-full uppercase" value={note.title} onChange={(e) => updateNote(note.id, 'title', e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => updateNote(note.id, 'isClosed', !note.isClosed)} className="p-1 hover:scale-110">{note.isClosed ? <RotateCcw size={20}/> : <CheckCircle size={20} className="text-emerald-600"/>}</button>
                        <button onClick={() => deleteNote(note.id)} className="p-1 text-red-500 hover:scale-110"><Trash2 size={20}/></button>
                      </div>
                    </div>

                    <div 
                      className="min-h-[160px] text-sm outline-none font-medium prose prose-indigo max-w-none"
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => updateNote(note.id, 'content', e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: note.content }}
                      style={{ direction: 'auto', textAlign: 'start' }}
                    />

                    <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-center">
                      <span className="text-[9px] font-black opacity-30">{note.date}</span>
                      <div className="flex gap-3">
                        <input type="color" value={note.color} onChange={(e) => updateNote(note.id, 'color', e.target.value)} className="w-6 h-6 rounded-full border-none cursor-pointer" />
                        <button onClick={() => addNote(note.id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-transform"><CornerDownRight size={12}/> Sub-task</button>
                      </div>
                    </div>
                  </div>

                  {/* CHILD NOTES RENDERING */}
                  {notes.filter(c => c.parentId === note.id).map(child => (
                    <div key={child.id} className="ml-16 relative">
                      <div className="absolute left-[-28px] top-6 text-indigo-400"><CornerDownRight size={20}/></div>
                      <div className={`${theme.card} p-5 rounded-[2rem] border shadow-lg relative group/child`} style={{ backgroundColor: child.color }}>
                         <div className="flex justify-between items-start mb-2">
                            <input className="bg-transparent font-black text-[11px] outline-none uppercase w-full" value={child.title} onChange={(e) => updateNote(child.id, 'title', e.target.value)} />
                            <button onClick={() => deleteNote(child.id)} className="text-red-500 opacity-0 group-hover/child:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                         </div>
                         <div 
                           className="min-h-[60px] text-xs outline-none"
                           contentEditable suppressContentEditableWarning
                           onBlur={(e) => updateNote(child.id, 'content', e.currentTarget.innerHTML)}
                           dangerouslySetInnerHTML={{ __html: child.content }}
                           style={{ direction: 'auto' }}
                         />
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