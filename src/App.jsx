/* PROJECTPRO MANAGEMENT SUITE 
   Version: 11.4 
   Fix: Maximum Today-Line Visibility & Layering
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, LayoutDashboard, Clock, List, Download, Trash2, Plus, ZoomIn, ZoomOut, Users, Activity, ShieldCheck, Moon, Sun } from 'lucide-react';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('dark_mode')) || false);
  const [team, setTeam] = useState(() => JSON.parse(localStorage.getItem('project_team')) || []);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('project_tasks')) || []);
  const [zoomScale, setZoomScale] = useState(1);
  const [newMember, setNewMember] = useState({ name: '', role: '' });
  const ganttContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('project_tasks', JSON.stringify(data));
    localStorage.setItem('project_team', JSON.stringify(team));
    localStorage.setItem('dark_mode', JSON.stringify(isDarkMode));
  }, [data, team, isDarkMode]);

  const safeDate = (d) => { 
    const date = new Date(d); 
    return isNaN(date) ? new Date() : date; 
  };

  const projectRange = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    // טווח בסיסי: 3 שבועות אחורה, 3 חודשים קדימה
    let start = new Date(today);
    start.setDate(today.getDate() - 21);
    
    if (data.length > 0) {
      const dates = data.map(d => safeDate(d.start).getTime());
      const minDate = new Date(Math.min(...dates));
      if (minDate < start) start = new Date(minDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    }
    
    let end = new Date(today);
    end.setDate(end.getDate() + 90);
    
    if (data.length > 0) {
      const dates = data.map(d => safeDate(d.end).getTime());
      const maxDate = new Date(Math.max(...dates));
      if (maxDate > end) end = new Date(maxDate.getTime() + (14 * 24 * 60 * 60 * 1000));
    }
    
    return { start, end, totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) };
  }, [data]);

  useEffect(() => {
    if (activeTab === 'gantt' && ganttContainerRef.current) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      const diffDays = (oneWeekAgo - projectRange.start) / (1000 * 60 * 60 * 24);
      ganttContainerRef.current.scrollLeft = (diffDays * 40 * zoomScale);
    }
  }, [activeTab, zoomScale, projectRange.start]);

  const groupedData = useMemo(() => {
    const groups = {};
    data.forEach(task => {
      if (!groups[task.project]) groups[task.project] = { name: task.project, tasks: [], start: task.start, end: task.end };
      groups[task.project].tasks.push(task);
      if (new Date(task.start) < new Date(groups[task.project].start)) groups[task.project].start = task.start;
      if (new Date(task.end) > new Date(groups[task.project].end)) groups[task.project].end = task.end;
    });
    return Object.values(groups);
  }, [data]);

  const updateTask = (id, field, value) => {
    setData(data.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    sidebar: isDarkMode ? 'bg-slate-900/60 backdrop-blur-2xl border-white/5' : 'bg-white/40 backdrop-blur-2xl border-white/40',
    card: isDarkMode ? 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/60 shadow-xl',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-white/5' : 'border-white/40',
    input: isDarkMode ? 'bg-slate-800/50 border-white/10 text-white' : 'bg-white/60 border-white/40 text-slate-900'
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-700 font-sans overflow-hidden relative`} dir="ltr">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside className={`w-64 ${theme.sidebar} p-6 flex flex-col shrink-0 border-r z-50`}>
        <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg"><Activity size={20}/></div>
                <h1 className="font-black text-xl italic tracking-tighter uppercase">ProjectPro</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                {isDarkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-indigo-600"/>}
            </button>
        </div>
        
        <div className="mb-8 mt-2">
            <span className="bg-indigo-600/20 text-indigo-500 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/30 tracking-widest uppercase">
                v11.4 Stable
            </span>
        </div>

        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'hover:bg-indigo-600/10 hover:text-indigo-600'}`}>
              {tab === 'dashboard' && <LayoutDashboard size={17}/>}
              {tab === 'tasks' && <List size={17}/>}
              {tab === 'gantt' && <Clock size={17}/>}
              {tab === 'team' && <Users size={17}/>}
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        {activeTab === 'tasks' && (
          <div className={`${theme.card} rounded-[2rem] border overflow-hidden shadow-2xl`}>
            <table className="w-full text-left">
              <thead className={`${isDarkMode ? 'bg-white/5' : 'bg-white/20'} border-b ${theme.border} text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>
                <tr><th className="p-5">Project / Task</th><th className="p-5">Team</th><th className="p-5">Dates</th><th className="p-5">Progress</th><th className="p-5 text-center">Action</th></tr>
              </thead>
              <tbody className={`divide-y ${theme.border} font-bold text-xs`}>
                {data.map(t => (
                  <tr key={t.id} className={`${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/40'} transition-colors`}>
                    <td className="p-4">
                        <input className="text-indigo-500 block bg-transparent outline-none mb-0.5 text-[10px] uppercase font-black" value={t.project} onChange={e => updateTask(t.id, 'project', e.target.value)} />
                        <input className={`${theme.text} block bg-transparent outline-none w-full font-bold`} value={t.task} onChange={e => updateTask(t.id, 'task', e.target.value)} />
                    </td>
                    <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                            {team.map(m => (<button key={m.name} onClick={() => { const cur = t.person || ""; const up = cur.includes(m.name) ? cur.split(',').filter(p => p.trim() !== m.name).join(',') : (cur ? cur + ',' + m.name : m.name); updateTask(t.id, 'person', up); }} className={`px-2 py-0.5 rounded-full text-[8px] transition-all font-semibold ${t.person?.includes(m.name) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-white/60 text-slate-500 border border-white/40 shadow-sm'}`}>{m.name}</button>))}
                        </div>
                    </td>
                    <td className="p-4 flex gap-1.5">
                        <input type="date" className={`text-[9px] p-2 border rounded-xl shadow-sm ${theme.input}`} value={t.start} onChange={e => updateTask(t.id, 'start', e.target.value)} />
                        <input type="date" className={`text-[9px] p-2 border rounded-xl shadow-sm ${theme.input}`} value={t.end} onChange={e => updateTask(t.id, 'end', e.target.value)} />
                    </td>
                    <td className="p-4"><div className="flex items-center gap-2.5"><input type="range" className="w-16 accent-indigo-600" value={t.progress} onChange={e => updateTask(t.id, 'progress', e.target.value)} /> <span className="text-[10px] font-bold tabular-nums">{t.progress}%</span></div></td>
                    <td className="p-4 text-center"><button onClick={() => setData(data.filter(x => x.id !== t.id))} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
                <tr>
                    <td colSpan="5" className="p-6 text-center">
                        <button onClick={() => setData([...data, {id: Date.now(), project: 'NEW', task: 'New Task', start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], progress: 0, color: '#6366f1'}])} 
                                className="bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600 hover:text-white px-6 py-2 rounded-full border border-indigo-500/30 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mx-auto shadow-sm">
                            <Plus size={16}/> Add New Task / Project
                        </button>
                    </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'gantt' && (
          <div className={`${theme.card} rounded-[2.5rem] border flex flex-col h-full overflow-hidden shadow-2xl`}>
            <div className="flex-1 overflow-auto relative" ref={ganttContainerRef}>
              <div style={{ width: `${projectRange.totalDays * 40 * zoomScale}px` }} className="relative min-h-full">
                
                {/* Header Timeline */}
                <div className={`flex sticky top-0 z-40 ${isDarkMode ? 'bg-slate-950/70 backdrop-blur-md' : 'bg-white/70 backdrop-blur-md'} border-b ${theme.border} ml-[200px]`}>
                  {Array.from({length: Math.ceil(projectRange.totalDays / 7)}).map((_, i) => {
                    const d = new Date(projectRange.start); d.setDate(d.getDate() + (i * 7));
                    return <div key={i} className="flex-1 text-center py-4 border-r border-white/10 font-bold text-[9px] uppercase" style={{ minWidth: `${7 * 40 * zoomScale}px` }}>W{i+1} • {d.getDate()}/{d.getMonth()+1}</div>
                  })}
                </div>

                {/* Vertical Grid Lines */}
                <div className="absolute inset-0 ml-[200px] pointer-events-none flex z-0">
                   {Array.from({length: projectRange.totalDays}).map((_, i) => (
                     <div key={i} className={`border-r ${isDarkMode ? 'border-white/5' : 'border-slate-200'} h-full`} style={{ width: `${40 * zoomScale}px` }} />
                   ))}
                </div>

                {/* TODAY LINE - MAXIMUM VISIBILITY (z-index: 100) */}
                {(() => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const diffDays = (today - projectRange.start) / (1000 * 60 * 60 * 24);
                  const leftPos = 200 + (diffDays * 40 * zoomScale);
                  return (
                    <div className="absolute top-0 bottom-0 z-[100] pointer-events-none border-l-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" style={{ left: `${leftPos}px` }}>
                      <div className="bg-red-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full absolute top-[60px] left-1/2 -translate-x-1/2 whitespace-nowrap shadow-xl uppercase">Today</div>
                    </div>
                  );
                })()}

                {/* Content Rows */}
                <div className="relative z-10">
                  {groupedData.map((group, idx) => (
                    <React.Fragment key={idx}>
                      <div className={`flex items-center border-b ${theme.border} ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-600/5'} sticky left-0 z-20`}>
                        <div className={`w-[200px] shrink-0 p-4 ${isDarkMode ? 'bg-slate-900/90 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-r sticky left-0 z-30 font-black text-[10px] text-indigo-600 uppercase`}>📁 {group.name}</div>
                        <div className="flex-1 h-10 relative" />
                      </div>
                      {group.tasks.map(task => {
                        const start = safeDate(task.start); const end = safeDate(task.end);
                        const left = Math.ceil((start - projectRange.start) / (1000*60*60*24)) * 40 * zoomScale;
                        const w = Math.ceil((end - start) / (1000*60*60*24)) * 40 * zoomScale;
                        return (
                          <div key={task.id} className={`flex items-center border-b ${theme.border} group transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/30'}`}>
                            <div className={`w-[200px] shrink-0 p-4 ${isDarkMode ? 'bg-slate-900/90 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-r sticky left-0 z-30 flex items-center gap-3`}>
                               <input type="color" value={task.color} onChange={e => updateTask(task.id, 'color', e.target.value)} className="w-4 h-4 rounded-full border-none cursor-pointer bg-transparent" />
                               <div className="truncate"><p className={`text-[10px] font-black ${theme.text} uppercase`}>{task.task}</p></div>
                            </div>
                            <div className="flex-1 h-14 relative">
                               <div className="absolute h-7 top-3.5 rounded-full shadow-lg flex items-center px-3 text-[9px] text-white font-black overflow-hidden group-hover:scale-[1.02] transition-all" 
                                    style={{ left: `${left}px`, width: `${Math.max(w, 40)}px`, backgroundColor: task.color }}>
                                 <div className="absolute inset-0 bg-black/20" style={{ width: `${task.progress}%` }} />
                                 <span className="relative z-10 font-bold">{task.progress}%</span>
                               </div>
                               
                               {/* Milestone Marker & Date */}
                               <div className="absolute top-3.5 flex flex-col items-center" style={{ left: `${left + w}px`, transform: 'translateX(-50%)' }}>
                                  <div className="w-3 h-3 rotate-45 border-2 border-white shadow-md" style={{ backgroundColor: task.color }} />
                                  <span className={`text-[8px] font-black mt-5 px-1.5 py-0.5 rounded shadow-sm ${isDarkMode ? 'bg-slate-800 text-indigo-300' : 'bg-white text-indigo-600'}`}>
                                    {end.getDate()}/{end.getMonth()+1}
                                  </span>
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