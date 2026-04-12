/* PROJECTPRO MANAGEMENT SUITE 
   Version: 12.5 - Fix: Note Creation & Background Color Logic
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, LayoutDashboard, Clock, List, Download, Trash2, Plus, ZoomIn, ZoomOut, Users, Activity, ShieldCheck, Moon, Sun, StickyNote, CheckCircle, RotateCcw, CornerDownRight, Bold, ListOrdered, Link as LinkIcon, Palette, Indent, Outdent, Pin, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('dark_mode')) || false);
  const [team, setTeam] = useState(() => JSON.parse(localStorage.getItem('project_team')) || []);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('project_tasks')) || []);
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('project_notes')) || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const [newMember, setNewMember] = useState({ name: '', role: '' });
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
    let end = new Date(today); end.setDate(end.getDate() + 90);
    return { start, end, totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) };
  }, [data]);

  const execCmd = (cmd, value = null) => document.execCommand(cmd, false, value);
  const updateTask = (id, field, value) => setData(data.map(t => t.id === id ? {...t, [field]: value} : t));
  const updateNote = (id, field, value) => setNotes(notes.map(n => n.id === id ? { ...n, [field]: value } : n));
  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id && n.parentId !== id));

  const handleAddNote = (parentId = null) => {
    const newNote = {
      id: Date.now(),
      parentId: parentId,
      title: parentId ? "Sub-task" : "New Note",
      content: "<div></div>",
      date: new Date().toLocaleString('he-IL'),
      color: parentId ? (isDarkMode ? '#1e293b' : '#f8fafb') : (isDarkMode ? '#1e1b4b' : '#fefcbf'),
      isClosed: false,
      isPinned: false,
      linkedTaskId: null
    };
    setNotes([newNote, ...notes]);
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    sidebar: isDarkMode ? 'bg-slate-900/80 backdrop-blur-2xl border-white/5 shadow-2xl' : 'bg-white/60 backdrop-blur-2xl border-white/40 shadow-xl',
    card: isDarkMode ? 'bg-slate-900/60 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white/50 backdrop-blur-xl border-white/60 shadow-xl',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    border: isDarkMode ? 'border-white/10' : 'border-white/40',
    input: isDarkMode ? 'bg-slate-800/50 border-white/10' : 'bg-white/60 border-white/40'
  };

  // --- RECURSIVE NOTE COMPONENT ---
  const NoteCard = ({ note, level = 0 }) => {
    const isMain = level === 0;
    return (
      <div className={`space-y-4 ${!isMain ? 'ml-8 mt-4 border-l-2 border-indigo-400/30 pl-6 relative' : ''}`}>
        {!isMain && <div className="absolute left-0 top-6 w-4 h-px bg-indigo-400/30" />}
        
        <div className={`${theme.card} p-6 rounded-[2.5rem] border-2 group relative transition-all ${note.isClosed ? 'opacity-30 grayscale' : ''}`} 
             style={{ backgroundColor: note.isClosed ? (isDarkMode ? '#0f172a' : '#f1f5f9') : note.color }}>
          
          {/* Toolbar */}
          <div className="flex gap-1.5 mb-4 p-1.5 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-black/10 rounded"><Bold size={14}/></button>
            <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-black/10 rounded"><ListOrdered size={14}/></button>
            <button onClick={() => execCmd('indent')} className="p-1.5 hover:bg-black/10 rounded"><Indent size={14}/></button>
            <button onClick={() => updateNote(note.id, 'isPinned', !note.isPinned)} className={note.isPinned ? 'text-indigo-600 p-1.5' : 'p-1.5 hover:bg-black/10 rounded'}><Pin size={14}/></button>
          </div>

          <div className="flex justify-between items-start mb-4">
            <input className="bg-transparent font-black uppercase text-sm outline-none w-full" value={note.title} onChange={(e) => updateNote(note.id, 'title', e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => updateNote(note.id, 'isClosed', !note.isClosed)}>{note.isClosed ? <RotateCcw size={18}/> : <CheckCircle size={18} className="text-emerald-600"/>}</button>
              <button onClick={() => deleteNote(note.id)} className="text-red-500"><Trash2 size={18}/></button>
            </div>
          </div>
          
          <div className="min-h-[100px] text-sm outline-none font-medium prose prose-sm max-w-none" 
               contentEditable suppressContentEditableWarning 
               onBlur={(e) => updateNote(note.id, 'content', e.currentTarget.innerHTML)} 
               dangerouslySetInnerHTML={{ __html: note.content }} 
               style={{ unicodeBidi: 'plaintext', textAlign: 'initial' }} />

          <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <input type="color" value={note.color} onChange={(e) => updateNote(note.id, 'color', e.target.value)} className="w-5 h-5 rounded-full border-none cursor-pointer shadow-sm" />
               <select className="bg-transparent text-[8px] font-black outline-none opacity-40 uppercase" value={note.linkedTaskId || ''} onChange={(e) => updateNote(note.id, 'linkedTaskId', e.target.value)}>
                  <option value="">Link...</option>
                  {data.map(t => <option key={t.id} value={t.id}>{t.task}</option>)}
               </select>
            </div>
            <button onClick={() => handleAddNote(note.id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 shadow-md hover:scale-105 transition-all"><Plus size={12}/> Follow-up</button>
          </div>
        </div>

        {notes.filter(child => child.parentId === note.id).map(child => (
          <NoteCard key={child.id} note={child} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-700 font-sans overflow-hidden relative`} dir="ltr">
      
      <aside className={`w-64 ${theme.sidebar} p-6 flex flex-col shrink-0 border-r z-50`}>
        <div className="flex items-center justify-between mb-4 text-white">
            <div className="flex items-center gap-3"><div className="bg-indigo-600 p-2 rounded-xl"><Activity size={20}/></div><h1 className="font-black text-xl uppercase italic">ProjectPro</h1></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun className="text-yellow-400"/> : <Moon className="text-indigo-600"/>}</button>
        </div>
        <div className="mb-8"><span className="bg-indigo-600/20 text-indigo-500 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">v12.5 Stable</span></div>
        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team', 'notes'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-indigo-600/10'}`}>
              {tab === 'notes' && <StickyNote size={17}/>} {tab === 'tasks' && <List size={17}/>} {tab === 'gantt' && <Clock size={17}/>} {tab === 'team' && <Users size={17}/>} {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        {activeTab === 'notes' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-white/10 p-4 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input placeholder="Search..." className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none border ${theme.input}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => handleAddNote()} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all"><Plus size={18}/> New Note</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {notes.filter(n => !n.parentId && (n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase()))).sort((a,b)=>b.isPinned-a.isPinned).map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}

        {/* --- OTHER TABS STAY STABLE --- */}
        {activeTab === 'team' && (
           <div className={`max-w-4xl ${theme.card} p-12 rounded-[3rem] border mx-auto`}>
              <h2 className="text-2xl font-black mb-10 italic uppercase flex items-center gap-4 text-indigo-600"><ShieldCheck size={36}/> Team</h2>
              <div className="flex gap-4 mb-12">
                <input placeholder="Name" className={`flex-1 p-4 rounded-2xl border ${theme.input}`} value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                <button onClick={() => {if(newMember.name) setTeam([...team, newMember]); setNewMember({name:'', role:''})}} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs">Add</button>
              </div>
              <div className="grid grid-cols-2 gap-5">{team.map((m, i) => (<div key={i} className={`flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-[2rem] shadow-sm`}><div className="flex items-center gap-5"><div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">{m.name.charAt(0)}</div><p className="font-black text-sm uppercase">{m.name}</p></div><button onClick={() => setTeam(team.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={18}/></button></div>))}</div>
           </div>
        )}

        {activeTab === 'tasks' && (
           <div className={`${theme.card} rounded-[2.5rem] border overflow-hidden shadow-2xl`}><table className="w-full text-left text-xs"><thead className="bg-white/10 border-b border-white/10 font-black uppercase text-[10px]"><tr><th className="p-5">Project / Task</th><th className="p-5">Dates</th><th className="p-5">Action</th></tr></thead><tbody className="divide-y border-white/10 font-bold">{data.map(t => (<tr key={t.id} className="hover:bg-white/5 transition-colors"><td className="p-4 font-black uppercase">{t.task}</td><td className="p-4">{t.start} - {t.end}</td><td className="p-4"><button onClick={() => setData(data.filter(x => x.id !== t.id))} className="text-red-500"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;