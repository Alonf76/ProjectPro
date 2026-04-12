/* PROJECTPRO MANAGEMENT SUITE 
   Version: 12.4 - Recursive Notes & Team Restoration
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
  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id));

  const insertSmartLink = () => {
    const url = prompt("כתובת האתר:"); if (!url) return;
    const text = prompt("טקסט להצגה:", url); if (!text) return;
    const html = `<a href="${url}" target="_blank" style="color:#4f46e5; font-weight:bold; text-decoration:underline;">${text}</a>&nbsp;`;
    execCmd('insertHTML', html);
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    sidebar: isDarkMode ? 'bg-slate-900/80 backdrop-blur-2xl border-white/5' : 'bg-white/60 backdrop-blur-2xl border-white/40',
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
        
        <div className={`${theme.card} p-6 rounded-[2.5rem] border-2 group relative transition-all ${note.isClosed ? 'opacity-30 grayscale' : ''}`} style={{ backgroundColor: note.isClosed ? '' : note.color }}>
          
          {/* Toolbar */}
          <div className="flex gap-1.5 mb-4 p-1.5 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity overflow-x-auto">
            <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-black/10 rounded"><Bold size={14}/></button>
            <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-black/10 rounded"><ListOrdered size={14}/></button>
            <button onClick={insertSmartLink} className="p-1.5 hover:bg-black/10 rounded"><LinkIcon size={14}/></button>
            <button onClick={() => execCmd('indent')} className="p-1.5 hover:bg-black/10 rounded"><Indent size={14}/></button>
            <button onClick={() => updateNote(note.id, 'isPinned', !note.isPinned)} className={note.isPinned ? 'text-indigo-600 p-1.5' : 'p-1.5 hover:bg-black/10 rounded'}><Pin size={14}/></button>
          </div>

          <div className="flex justify-between items-start mb-4">
            <input className="bg-transparent font-black uppercase text-sm outline-none w-full" value={note.title} onChange={(e) => updateNote(note.id, 'title', e.target.value)} />
            <div className="flex gap-2 shrink-0">
              <button onClick={() => updateNote(note.id, 'isClosed', !note.isClosed)}>{note.isClosed ? <RotateCcw size={18}/> : <CheckCircle size={18} className="text-emerald-600"/>}</button>
              <button onClick={() => deleteNote(note.id)} className="text-red-500"><Trash2 size={18}/></button>
            </div>
          </div>
          
          <div className="min-h-[100px] text-sm outline-none font-medium prose prose-sm max-w-none" contentEditable suppressContentEditableWarning onBlur={(e) => updateNote(note.id, 'content', e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: note.content }} style={{ unicodeBidi: 'plaintext', textAlign: 'initial' }} />

          <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <input type="color" value={note.color} onChange={(e) => updateNote(note.id, 'color', e.target.value)} className="w-5 h-5 rounded-full border-none cursor-pointer" />
               <select className="bg-transparent text-[8px] font-black outline-none opacity-40 uppercase max-w-[80px]" value={note.linkedTaskId || ''} onChange={(e) => updateNote(note.id, 'linkedTaskId', e.target.value)}>
                  <option value="">Link...</option>
                  {data.map(t => <option key={t.id} value={t.id}>{t.task}</option>)}
               </select>
            </div>
            <button onClick={() => setNotes([{id: Date.now(), parentId: note.id, title: "Sub-task", content: "<div></div>", date: new Date().toLocaleString('he-IL'), color: isDarkMode ? '#1e293b' : '#f8fafb', isClosed: false}, ...notes])} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 shadow-md hover:scale-105 transition-transform"><Plus size={12}/> Follow-up</button>
          </div>
        </div>

        {/* Recursive Children */}
        {notes.filter(child => child.parentId === note.id).map(child => (
          <NoteCard key={child.id} note={child} level={level + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-700 font-sans overflow-hidden relative`} dir="ltr">
      
      <aside className={`w-64 ${theme.sidebar} p-6 flex flex-col shrink-0 border-r z-50`}>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3"><div className="bg-indigo-600 p-2 rounded-xl"><Activity size={20} className="text-white"/></div><h1 className="font-black text-xl uppercase tracking-tighter italic">ProjectPro</h1></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun className="text-yellow-400"/> : <Moon className="text-indigo-600"/>}</button>
        </div>
        <div className="mb-8"><span className="bg-indigo-600/20 text-indigo-500 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">v12.4 Stable</span></div>
        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team', 'notes'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-indigo-600/10'}`}>
              {tab === 'notes' && <StickyNote size={17}/>} {tab === 'tasks' && <List size={17}/>} {tab === 'gantt' && <Clock size={17}/>} {tab === 'team' && <Users size={17}/>} {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        {/* TEAM TAB - RESTORED */}
        {activeTab === 'team' && (
           <div className={`max-w-4xl ${theme.card} p-12 rounded-[3rem] border shadow-2xl mx-auto`}>
              <h2 className="text-2xl font-black mb-10 italic uppercase flex items-center gap-4 text-indigo-600"><ShieldCheck size={36}/> Team Directory</h2>
              <div className="flex gap-4 mb-12">
                <input placeholder="Full Name" className={`flex-1 p-4 rounded-2xl outline-none border text-sm font-bold shadow-sm ${theme.input}`} value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                <input placeholder="Job Role" className={`flex-1 p-4 rounded-2xl outline-none border text-sm font-bold shadow-sm ${theme.input}`} value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} />
                <button onClick={() => {if(newMember.name) setTeam([...team, newMember]); setNewMember({name:'', role:''})}} className="bg-indigo-600 text-white px-12 rounded-2xl font-black hover:bg-indigo-700 transition-all text-xs uppercase shadow-xl shadow-indigo-600/20">Add Member</button>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {team.map((m, i) => (
                  <div key={i} className={`flex justify-between items-center p-6 ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'} border border-white/10 rounded-[2rem] group transition-all`}>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">{m.name.charAt(0)}</div>
                      <div><p className="font-black text-sm uppercase mb-0.5">{m.name}</p><p className="text-[10px] font-black text-indigo-500 uppercase opacity-60">{m.role || 'Contributor'}</p></div>
                    </div>
                    <button onClick={() => setTeam(team.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-white/10 p-4 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input placeholder="Search..." className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none border ${theme.input}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => addNote()} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all"><Plus size={18}/> New Note</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {notes.filter(n => !n.parentId && (n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.content.toLowerCase().includes(searchTerm.toLowerCase()))).sort((a,b)=>b.isPinned-a.isPinned).map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}

        {/* --- GANTT & TASKS remain as they were in 12.3 --- */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-black italic uppercase text-indigo-600">Tasks</h2><button onClick={() => setData([...data, {id: Date.now(), project: "NEW", task: "New Task", start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], progress: 0, color: "#6366f1"}])} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-2"><Plus size={18}/> Add Task</button></div>
            <div className={`${theme.card} rounded-[2.5rem] border overflow-hidden shadow-2xl`}><table className="w-full text-left text-xs"><thead className="bg-white/10 border-b border-white/10 font-black uppercase text-[10px]"><tr><th className="p-5">Project / Task</th><th className="p-5">Team</th><th className="p-5">Dates</th><th className="p-5">Progress</th><th className="p-5 text-center">Action</th></tr></thead><tbody className="divide-y border-white/10 font-bold">{data.map(t => (<tr key={t.id} className="hover:bg-white/5 transition-colors"><td className="p-4"><input className="text-indigo-500 block bg-transparent outline-none text-[10px] uppercase font-black" value={t.project} onChange={e => updateTask(t.id, 'project', e.target.value)} /><input className="block bg-transparent outline-none w-full font-bold" value={t.task} onChange={e => updateTask(t.id, 'task', e.target.value)} /></td><td className="p-4"><div className="flex flex-wrap gap-1">{team.map(m => (<button key={m.name} onClick={() => { const cur = t.person || ""; const up = cur.includes(m.name) ? cur.split(',').filter(p => p.trim() !== m.name).join(',') : (cur ? cur + ',' + m.name : m.name); updateTask(t.id, 'person', up); }} className={`px-2 py-0.5 rounded-full text-[8px] transition-all font-semibold ${t.person?.includes(m.name) ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 border border-white/20'}`}>{m.name}</button>))}</div></td><td className="p-4 flex gap-1.5"><input type="date" className={`text-[9px] p-2 border rounded-xl ${theme.input}`} value={t.start} onChange={e => updateTask(t.id, 'start', e.target.value)} /><input type="date" className={`text-[9px] p-2 border rounded-xl ${theme.input}`} value={t.end} onChange={e => updateTask(t.id, 'end', e.target.value)} /></td><td className="p-4"><div className="flex items-center gap-2.5"><input type="range" className="w-16 accent-indigo-600" value={t.progress} onChange={e => updateTask(t.id, 'progress', e.target.value)} /> <span className="text-[10px] font-bold">{t.progress}%</span></div></td><td className="p-4 text-center"><button onClick={() => setData(data.filter(x => x.id !== t.id))} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
          </div>
        )}

        {activeTab === 'gantt' && (
           <div className={`${theme.card} rounded-[2.5rem] border flex flex-col h-full overflow-hidden shadow-2xl`}>
           <div className="flex-1 overflow-auto relative" ref={ganttContainerRef}>
             <div style={{ width: `${projectRange.totalDays * 40 * zoomScale}px` }} className="relative min-h-full">
               <div className={`flex sticky top-0 z-40 ${isDarkMode ? 'bg-slate-950/70' : 'bg-white/60'} backdrop-blur-md border-b ${theme.border} ml-[200px]`}>{Array.from({length: Math.ceil(projectRange.totalDays / 7)}).map((_, i) => { const d = new Date(projectRange.start); d.setDate(d.getDate() + (i * 7)); return <div key={i} className="flex-1 text-center py-4 border-r border-white/10 font-bold text-[9px] uppercase" style={{ minWidth: `${7 * 40 * zoomScale}px` }}>W{i+1} • {d.getDate()}/{d.getMonth()+1}</div>})}</div>
               {/* TODAY LINE */}
               {(() => { const today = new Date(); today.setHours(0,0,0,0); const diffDays = (today - projectRange.start) / (1000 * 60 * 60 * 24); return <div className="absolute top-0 bottom-0 z-[100] border-l-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" style={{ left: `${200 + (diffDays * 40 * zoomScale)}px` }}><div className="bg-red-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full absolute top-[60px] left-1/2 -translate-x-1/2 whitespace-nowrap shadow-xl uppercase">Today</div></div>; })()}
               <div className="relative z-10">
                 {useMemo(() => {
                   const groups = {}; data.forEach(task => { if (!groups[task.project]) groups[task.project] = { name: task.project, tasks: [] }; groups[task.project].tasks.push(task); });
                   return Object.values(groups).map((group, idx) => (
                    <React.Fragment key={idx}>
                      <div className={`flex items-center border-b ${theme.border} bg-indigo-500/5 sticky left-0 z-20`}><div className={`w-[200px] shrink-0 p-4 border-r sticky left-0 z-30 font-black text-[10px] text-indigo-500 uppercase ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-lg`}>📁 {group.name}</div><div className="flex-1 h-10" /></div>
                      {group.tasks.map(task => {
                        const start = safeDate(task.start); const end = safeDate(task.end);
                        const left = Math.ceil((start - projectRange.start) / (1000*60*60*24)) * 40 * zoomScale;
                        const w = Math.ceil((end - start) / (1000*60*60*24)) * 40 * zoomScale;
                        const hasNote = notes.find(n => n.linkedTaskId == task.id);
                        return (
                          <div key={task.id} className={`flex items-center border-b ${theme.border} group transition-colors hover:bg-white/5`}><div className={`w-[200px] shrink-0 p-4 border-r sticky left-0 z-30 flex items-center gap-3 ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-lg`}><input type="color" value={task.color} readOnly className="w-3 h-3 rounded-full border-none" /><div className="truncate text-[10px] font-black uppercase">{task.task}</div></div><div className="flex-1 h-14 relative"><div className="absolute h-7 top-3.5 rounded-full flex items-center px-3 text-[9px] text-white font-black shadow-lg" style={{ left: `${left}px`, width: `${Math.max(w, 40)}px`, backgroundColor: task.color }}><div className="absolute inset-0 bg-black/20" style={{ width: `${task.progress}%` }} /><span className="relative z-10">{task.progress}%</span>{hasNote && <div className="absolute right-2 animate-bounce"><StickyNote size={12}/></div>}</div><div className="absolute top-3.5 flex flex-col items-center" style={{ left: `${left + w}px`, transform: 'translateX(-50%)' }}><div className="w-3 h-3 rotate-45 border-2 border-white shadow-md" style={{ backgroundColor: task.color }} /><span className="text-[8px] font-black mt-5 px-1 rounded shadow-sm bg-white/10">{end.getDate()}/{end.getMonth()+1}</span></div></div></div>
                        );
                      })}
                    </React.Fragment>
                   ));
                 }, [data, notes, projectRange.start, zoomScale, isDarkMode])}
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