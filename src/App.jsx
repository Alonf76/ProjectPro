/* PROJECTPRO MANAGEMENT SUITE 
   Version: 10.8 
   Fix: Version badge visibility & UI polish
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
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    start.setDate(start.getDate() - start.getDay());
    let end = new Date(today);
    end.setDate(end.getDate() + 60);
    if (data.length > 0) {
      const latestTaskEnd = new Date(Math.max(...data.map(d => safeDate(d.end))));
      if (latestTaskEnd > end) end = new Date(latestTaskEnd.getTime() + (14 * 24 * 60 * 60 * 1000));
    }
    return { start, end, totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) };
  }, [data]);

  useEffect(() => {
    if (activeTab === 'gantt' && ganttContainerRef.current) {
      const today = new Date();
      const diffDays = (today - projectRange.start) / (1000 * 60 * 60 * 24);
      const scrollPos = (diffDays * 40 * zoomScale);
      ganttContainerRef.current.scrollLeft = scrollPos - 200;
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

  const handleExportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "ProjectPro_v10.8.csv");
    link.click();
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      setData(json.map((t, i) => ({ ...t, id: t.id || Date.now() + i, color: t.color || '#6366f1' })));
    };
    reader.readAsBinaryString(file);
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    card: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-100',
    input: isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-colors duration-300 font-sans overflow-hidden`} dir="ltr">
      <aside className="w-64 bg-slate-900 text-slate-400 p-6 flex flex-col shrink-0 shadow-2xl z-50">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-white">
                <div className="bg-indigo-500 p-2 rounded-xl"><Activity size={20}/></div>
                <h1 className="font-black text-xl italic tracking-tighter uppercase">ProjectPro</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                {isDarkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-indigo-400"/>}
            </button>
        </div>

        {/* VERSION BADGE - FIXED VISIBILITY */}
        <div className="mb-8 mt-2">
            <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-indigo-500/30 tracking-widest uppercase">
                v10.8 Stable
            </span>
        </div>
        
        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          {['dashboard', 'tasks', 'gantt', 'team'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-white/5'}`}>
              {tab === 'dashboard' && <LayoutDashboard size={17}/>}
              {tab === 'tasks' && <List size={17}/>}
              {tab === 'gantt' && <Clock size={17}/>}
              {tab === 'team' && <Users size={17}/>}
              {tab}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-3">
          <button onClick={handleExportCSV} className="w-full flex items-center justify-center gap-2 text-[10px] font-black bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-500 transition-all uppercase tracking-widest"><Download size={14}/> Export CSV</button>
          <label className="w-full flex items-center justify-center gap-2 text-[10px] font-black bg-slate-800 text-slate-300 py-3 rounded-xl cursor-pointer hover:bg-slate-700 transition-all border border-white/5 uppercase tracking-widest">
            <Upload size={14}/> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV}/>
          </label>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 gap-8 h-80">
            <div className={`${theme.card} p-6 rounded-3xl shadow-sm border`}>
                <h3 className={`text-xs font-black ${theme.textMuted} mb-4 uppercase tracking-tighter`}>Workload</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={team.map(m => ({ name: m.name, count: data.filter(d => d.person?.includes(m.name)).length }))}>
                        <XAxis dataKey="name" stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={10} axisLine={false} tickLine={false}/>
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}/>
                        <Bar dataKey="count" fill="#6366f1" radius={[6,6,0,0]} barSize={30}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className={`${theme.card} p-6 rounded-3xl shadow-sm border`}>
                <h3 className={`text-xs font-black ${theme.textMuted} mb-4 uppercase tracking-tighter`}>Project Health</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={[{name:'Done', value: data.filter(d=>d.progress==100).length || 1}, {name:'Open', value: data.filter(d=>d.progress<100).length || 1}]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            <Cell fill="#10b981" stroke="none"/><Cell fill="#6366f1" stroke="none"/>
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className={`${theme.card} rounded-3xl shadow-xl border overflow-hidden`}>
            <table className="w-full text-left">
              <thead className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} border-b ${theme.border} text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>
                <tr><th className="p-4">Project / Task</th><th className="p-4">Team</th><th className="p-4">Dates</th><th className="p-4">Progress</th><th className="p-4 text-center">Delete</th></tr>
              </thead>
              <tbody className={`divide-y ${theme.border} font-bold text-xs`}>
                {data.map(t => (
                  <tr key={t.id} className={`${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className="p-3">
                        <input className="text-indigo-400 block bg-transparent outline-none mb-0.5 text-[10px] uppercase font-black" value={t.project} onChange={e => updateTask(t.id, 'project', e.target.value)} />
                        <input className={`${theme.text} block bg-transparent outline-none w-full font-bold`} value={t.task} onChange={e => updateTask(t.id, 'task', e.target.value)} />
                    </td>
                    <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                            {team.map(m => (<button key={m.name} onClick={() => { const cur = t.person || ""; const up = cur.includes(m.name) ? cur.split(',').filter(p => p.trim() !== m.name).join(',') : (cur ? cur + ',' + m.name : m.name); updateTask(t.id, 'person', up); }} className={`px-2 py-0.5 rounded-full text-[8px] transition-all ${t.person?.includes(m.name) ? 'bg-indigo-600 text-white' : isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>{m.name}</button>))}
                        </div>
                    </td>
                    <td className="p-3 flex gap-1">
                        <input type="date" className={`text-[9px] p-1.5 border rounded-lg ${theme.input}`} value={t.start} onChange={e => updateTask(t.id, 'start', e.target.value)} />
                        <input type="date" className={`text-[9px] p-1.5 border rounded-lg ${theme.input}`} value={t.end} onChange={e => updateTask(t.id, 'end', e.target.value)} />
                    </td>
                    <td className="p-3"><div className="flex items-center gap-2"><input type="range" className="w-16 accent-indigo-600" value={t.progress} onChange={e => updateTask(t.id, 'progress', e.target.value)} /> <span className="text-[9px] tabular-nums">{t.progress}%</span></div></td>
                    <td className="p-3 text-center"><button onClick={() => setData(data.filter(x => x.id !== t.id))} className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button></td>
                  </tr>
                ))}
                <tr><td colSpan={5} className="p-4 text-center"><button onClick={() => setData([...data, {id: Date.now(), project: 'NEW', task: 'New Task', start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], progress: 0, color: '#6366f1'}])} className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 flex items-center gap-2 mx-auto uppercase tracking-widest"><Plus size={14}/> Add New Task</button></td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'gantt' && (
          <div className={`${theme.card} rounded-[2rem] shadow-xl border flex flex-col h-full overflow-hidden`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}`}>
               <div className={`flex ${isDarkMode ? 'bg-slate-800' : 'bg-white'} p-1 rounded-xl shadow-sm border ${theme.border} scale-90 origin-left`}>
                  <button onClick={() => setZoomScale(Math.max(0.3, zoomScale - 0.1))} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}><ZoomOut size={16}/></button>
                  <span className={`px-4 py-1 text-[10px] font-black border-x ${theme.border} flex items-center`}>{Math.round(zoomScale*100)}%</span>
                  <button onClick={() => setZoomScale(Math.min(2.5, zoomScale + 0.1))} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}><ZoomIn size={16}/></button>
               </div>
               <div className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>Interactive Gantt Chart</div>
            </div>
            <div className="flex-1 overflow-auto relative" ref={ganttContainerRef}>
              <div style={{ width: `${projectRange.totalDays * 40 * zoomScale}px` }} className="relative min-h-full">
                <div className={`flex sticky top-0 z-40 ${isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'} border-b ${theme.border} ml-[200px]`}>
                  {Array.from({length: Math.ceil(projectRange.totalDays / 7)}).map((_, i) => {
                    const d = new Date(projectRange.start); d.setDate(d.getDate() + (i * 7));
                    return <div key={i} className={`flex-1 text-center py-4 border-r ${theme.border} font-black text-[9px] ${theme.textMuted} uppercase`} style={{ minWidth: `${7 * 40 * zoomScale}px` }}>W{i+1} • {d.getDate()}/{d.getMonth()+1}</div>
                  })}
                </div>
                <div className="absolute inset-0 ml-[200px] pointer-events-none flex z-0">
                   {Array.from({length: projectRange.totalDays}).map((_, i) => (
                     <div key={i} className={`border-r ${isDarkMode ? 'border-white/5' : 'border-slate-100'} h-full`} style={{ width: `${40 * zoomScale}px` }} />
                   ))}
                </div>
                {/* TODAY LINE */}
                {(() => {
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const diffDays = (today - projectRange.start) / (1000 * 60 * 60 * 24);
                  const leftPos = 200 + (diffDays * 40 * zoomScale);
                  return (
                    <div className="absolute top-0 bottom-0 z-50 pointer-events-none border-l-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]" style={{ left: `${leftPos}px` }}>
                      <div className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full absolute top-[50px] left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg uppercase">Today</div>
                    </div>
                  );
                })()}
                <div className="relative z-10">
                  {groupedData.map((group, idx) => (
                    <React.Fragment key={idx}>
                      <div className={`flex items-center border-b ${theme.border} ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50/30'} sticky left-0 z-20`}>
                        <div className={`w-[200px] shrink-0 p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-indigo-50/50 border-slate-100'} border-r sticky left-0 z-30 font-black text-[10px] text-indigo-500 uppercase`}>📁 {group.name}</div>
                        <div className="flex-1 h-10 relative" />
                      </div>
                      {group.tasks.map(task => {
                        const start = safeDate(task.start); const end = safeDate(task.end);
                        const left = Math.ceil((start - projectRange.start) / (1000*60*60*24)) * 40 * zoomScale;
                        const w = Math.ceil((end - start) / (1000*60*60*24)) * 40 * zoomScale;
                        return (
                          <div key={task.id} className={`flex items-center border-b ${theme.border} group transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                            <div className={`w-[200px] shrink-0 p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border-r sticky left-0 z-30 flex items-center gap-3 shadow-md`}>
                               <input type="color" value={task.color} onChange={e => updateTask(task.id, 'color', e.target.value)} className="w-4 h-4 rounded-full border-none cursor-pointer bg-transparent" />
                               <div className="truncate">
                                   <p className={`text-[10px] font-black ${theme.text} uppercase leading-tight`}>{task.task}</p>
                                   <p className={`text-[8px] font-bold ${theme.textMuted} uppercase`}>👤 {task.person || 'Unassigned'}</p>
                               </div>
                            </div>
                            <div className="flex-1 h-12 relative">
                               <div className="absolute h-6 top-3 rounded-full shadow-lg flex items-center px-3 text-[9px] text-white font-black overflow-hidden group-hover:scale-[1.02] transition-transform" style={{ left: `${left}px`, width: `${Math.max(w, 40)}px`, backgroundColor: task.color }}>
                                 <div className="absolute inset-0 bg-black/20" style={{ width: `${task.progress}%` }} />
                                 <span className="relative z-10 drop-shadow-md">{task.progress}%</span>
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

        {activeTab === 'team' && (
           <div className={`max-w-3xl ${theme.card} p-10 rounded-[2.5rem] shadow-2xl border mx-auto`}>
              <h2 className="text-2xl font-black mb-8 italic tracking-tighter uppercase flex items-center gap-3">
                <ShieldCheck className="text-indigo-500" size={32}/> Team Directory
              </h2>
              <div className="flex gap-3 mb-10">
                <input placeholder="Full Name" className={`flex-1 p-4 rounded-2xl outline-none border text-sm font-bold ${theme.input}`} value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                <input placeholder="Job Role" className={`flex-1 p-4 rounded-2xl outline-none border text-sm font-bold ${theme.input}`} value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} />
                <button onClick={() => {if(newMember.name) setTeam([...team, newMember]); setNewMember({name:'', role:''})}} className="bg-indigo-600 text-white px-10 rounded-2xl font-black hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/30">Add Member</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {team.map((m, i) => (
                  <div key={i} className={`flex justify-between items-center p-5 ${isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'} rounded-3xl border ${theme.border} group`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">{m.name.charAt(0)}</div>
                      <div>
                        <p className={`font-black text-sm ${theme.text} uppercase mb-0.5`}>{m.name}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-80">{m.role || 'Contributor'}</p>
                      </div>
                    </div>
                    <button onClick={() => setTeam(team.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-500 p-2 transition-colors"><Trash2 size={18}/></button>
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