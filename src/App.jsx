/* PROJECTPRO MANAGEMENT SUITE 
   Version: 11.1 
   Feature: Auto-focus on "One Week Ago" with full scroll history
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
    
    // נקודת התחלה: שבועיים אחורה כדי שיהיה לאן לגלול שמאלה
    let start = new Date(today);
    start.setDate(today.getDate() - 21); // 3 שבועות אחורה כבסיס
    
    if (data.length > 0) {
      const earliestTaskStart = new Date(Math.min(...data.map(d => safeDate(d.start))));
      if (earliestTaskStart < start) {
        start = new Date(earliestTaskStart.getTime() - (7 * 24 * 60 * 60 * 1000));
      }
    }
    
    let end = new Date(today);
    end.setDate(end.getDate() + 90); // 3 חודשים קדימה כבסיס
    
    if (data.length > 0) {
      const latestTaskEnd = new Date(Math.max(...data.map(d => safeDate(d.end))));
      if (latestTaskEnd > end) {
        end = new Date(latestTaskEnd.getTime() + (14 * 24 * 60 * 60 * 1000));
      }
    }
    
    return { start, end, totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) };
  }, [data]);

  // לוגיקת המיקוד: גלילה לשבוע אחד לפני היום
  useEffect(() => {
    if (activeTab === 'gantt' && ganttContainerRef.current) {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      
      const diffDays = (oneWeekAgo - projectRange.start) / (1000 * 60 * 60 * 24);
      const scrollPos = (diffDays * 40 * zoomScale);
      
      // גלילה חלקה למיקום המחושב
      ganttContainerRef.current.scrollLeft = scrollPos;
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
    sidebar: isDarkMode ? 'bg-slate-900/40 backdrop-blur-2xl border-white/5' : 'bg-white/40 backdrop-blur-2xl border-white/40',
    card: isDarkMode ? 'bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl' : 'bg-white/40 backdrop-blur-xl border-white/60 shadow-xl',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-white/5' : 'border-white/40',
    input: isDarkMode ? 'bg-slate-800/50 border-white/10 text-white' : 'bg-white/60 border-white/40 text-slate-900'
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-700 font-sans overflow-hidden relative`} dir="ltr">
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />

      {/* Sidebar */}
      <aside className={`w-64 ${theme.sidebar} p-6 flex flex-col shrink-0 border-r z-50 transition-all`}>
        <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg"><Activity size={20}/></div>
                <h1 className="font-black text-xl italic tracking-tighter uppercase">ProjectPro</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-indigo-950/5'} transition-colors`}>
                {isDarkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-indigo-600"/>}
            </button>
        </div>

        <div className="mb-8 mt-2">
            <span className="bg-indigo-600/10 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-600/20 tracking-widest uppercase">
                v11.1 Smart View
            </span>
        </div>
        
        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'hover:bg-indigo-600/10 hover:text-indigo-600'}`}>
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
        {activeTab === 'gantt' && (
          <div className={`${theme.card} rounded-[2.5rem] border flex flex-col h-full overflow-hidden shadow-2xl`}>
            <div className={`p-4 border-b ${theme.border} flex justify-between items-center ${isDarkMode ? 'bg-slate-800/40' : 'bg-white/40'}`}>
               <div className={`flex ${isDarkMode ? 'bg-slate-800' : 'bg-white/80'} p-1.5 rounded-xl shadow-inner border ${theme.border} scale-90 origin-left`}>
                  <button onClick={() => setZoomScale(Math.max(0.3, zoomScale - 0.1))} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><ZoomOut size={16}/></button>
                  <span className={`px-5 py-1 text-[10px] font-bold border-x ${theme.border} flex items-center text-indigo-600`}>{Math.round(zoomScale*100)}%</span>
                  <button onClick={() => setZoomScale(Math.min(2.5, zoomScale + 0.1))} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><ZoomIn size={16}/></button>
               </div>
               <div className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-widest`}>Showing 7 days history by default</div>
            </div>
            
            <div className="flex-1 overflow-auto relative" ref={ganttContainerRef}>
              <div style={{ width: `${projectRange.totalDays * 40 * zoomScale}px` }} className="relative min-h-full">
                {/* Header */}
                <div className={`flex sticky top-0 z-40 ${isDarkMode ? 'bg-slate-950/60 backdrop-blur-md' : 'bg-white/60 backdrop-blur-md'} border-b ${theme.border} ml-[200px]`}>
                  {Array.from({length: Math.ceil(projectRange.totalDays / 7)}).map((_, i) => {
                    const d = new Date(projectRange.start); d.setDate(d.getDate() + (i * 7));
                    return <div key={i} className={`flex-1 text-center py-4 border-r ${theme.border} font-bold text-[9px] ${theme.textMuted} uppercase`} style={{ minWidth: `${7 * 40 * zoomScale}px` }}>W{i+1} • {d.getDate()}/{d.getMonth()+1}</div>
                  })}
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-0 ml-[200px] pointer-events-none flex z-0">
                   {Array.from({length: projectRange.totalDays}).map((_, i) => (
                     <div key={i} className={`border-r ${isDarkMode ? 'border-white/5' : 'border-slate-200'} h-full`} style={{ width: `${40 * zoomScale}px` }} />
                   ))}
                </div>

                {/* TODAY LINE */}
                {(() => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const diffDays = (today - projectRange.start) / (1000 * 60 * 60 * 24);
                  const leftPos = 200 + (diffDays * 40 * zoomScale);
                  return (
                    <div className="absolute top-0 bottom-0 z-50 pointer-events-none border-l-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)]" style={{ left: `${leftPos}px` }}>
                      <div className="bg-red-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full absolute top-[60px] left-1/2 -translate-x-1/2 whitespace-nowrap shadow-xl uppercase">Today</div>
                    </div>
                  );
                })()}

                {/* Content */}
                <div className="relative z-10">
                  {groupedData.map((group, idx) => (
                    <React.Fragment key={idx}>
                      <div className={`flex items-center border-b ${theme.border} ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-600/5'} sticky left-0 z-20`}>
                        <div className={`w-[200px] shrink-0 p-4 ${isDarkMode ? 'bg-slate-900/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-r sticky left-0 z-30 font-black text-[10px] text-indigo-600 uppercase`}>📁 {group.name}</div>
                        <div className="flex-1 h-10 relative" />
                      </div>
                      {group.tasks.map(task => {
                        const start = safeDate(task.start); const end = safeDate(task.end);
                        const left = Math.ceil((start - projectRange.start) / (1000*60*60*24)) * 40 * zoomScale;
                        const w = Math.ceil((end - start) / (1000*60*60*24)) * 40 * zoomScale;
                        return (
                          <div key={task.id} className={`flex items-center border-b ${theme.border} group transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-white/30'}`}>
                            <div className={`w-[200px] shrink-0 p-4 ${isDarkMode ? 'bg-slate-900/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-r sticky left-0 z-30 flex items-center gap-3 shadow-sm`}>
                               <input type="color" value={task.color} onChange={e => updateTask(task.id, 'color', e.target.value)} className="w-4 h-4 rounded-full border-none cursor-pointer" />
                               <div className="truncate leading-tight">
                                   <p className={`text-[10px] font-black ${theme.text} uppercase`}>{task.task}</p>
                                   <p className={`text-[8px] font-bold ${theme.textMuted} uppercase`}>👤 {task.person || 'Unassigned'}</p>
                               </div>
                            </div>
                            <div className="flex-1 h-14 relative">
                               <div className="absolute h-7 top-3.5 rounded-full shadow-lg flex items-center px-3 text-[9px] text-white font-black overflow-hidden group-hover:scale-[1.03] transition-all" 
                                    style={{ left: `${left}px`, width: `${Math.max(w, 40)}px`, backgroundColor: task.color }}>
                                 <div className="absolute inset-0 bg-black/20" style={{ width: `${task.progress}%` }} />
                                 <span className="relative z-10 font-bold">{task.progress}%</span>
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
        {/* שאר הטאבים (Dashboard, Tasks, Team) נשארים ללא שינוי מעיצוב v10.10 */}
      </main>
    </div>
  );
};

export default Dashboard;