/* PROJECTPRO MANAGEMENT SUITE 
  Version: 10.2 
  Features: Compact Rows, Hierarchical Gantt, Global Zoom, Today Line, Team & Analytics
*/

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload, LayoutDashboard, Clock, List, Download, Trash2, Plus, ZoomIn, ZoomOut, Users, Calendar, FileText, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [team, setTeam] = useState(() => JSON.parse(localStorage.getItem('project_team')) || []);
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem('project_tasks')) || []);
  const [zoomScale, setZoomScale] = useState(1);
  const [newMember, setNewMember] = useState({ name: '', role: '' });

  useEffect(() => {
    localStorage.setItem('project_tasks', JSON.stringify(data));
    localStorage.setItem('project_team', JSON.stringify(team));
  }, [data, team]);

  const safeDate = (d) => { const date = new Date(d); return isNaN(date) ? new Date() : date; };

  const projectRange = useMemo(() => {
    if (data.length === 0) return { start: new Date(), end: new Date(Date.now() + 30*24*60*60*1000), totalDays: 30 };
    const start = new Date(Math.min(...data.map(d => safeDate(d.start))));
    const end = new Date(Math.max(...data.map(d => safeDate(d.end))));
    start.setDate(start.getDate() - start.getDay());
    end.setDate(end.getDate() + 14); 
    return { start, end, totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) };
  }, [data]);

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

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Tasks");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(team), "Team");
    XLSX.writeFile(wb, "ProjectPro_v10.2_Export.xlsx");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const tasks = XLSX.utils.sheet_to_json(wb.Sheets["Tasks"] || wb.Sheets[wb.SheetNames[0]]);
      setData(tasks.map((t, i) => ({ ...t, id: Date.now() + i, color: t.color || '#6366f1' })));
      if (wb.Sheets["Team"]) setTeam(XLSX.utils.sheet_to_json(wb.Sheets["Team"]));
    };
    reader.readAsBinaryString(file);
  };

  const updateTask = (id, field, value) => {
    setData(data.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div className="flex h-screen bg-slate-50 text-left font-sans overflow-hidden" dir="ltr">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-400 p-6 flex flex-col shrink-0 shadow-2xl">
        <div className="flex items-center gap-3 mb-2 text-white">
          <div className="bg-indigo-500 p-2 rounded-xl"><Activity size={20}/></div>
          <h1 className="font-black text-xl italic tracking-tighter uppercase">ProjectPro</h1>
        </div>
        <div className="text-[9px] font-black text-indigo-400 mb-8 bg-indigo-500/10 w-fit px-2 py-0.5 rounded border border-indigo-500/20">VERSION 10.2</div>
        
        <nav className="space-y-1.5 flex-1 font-bold text-sm">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}><LayoutDashboard size={17}/> Dashboard</button>
          <button onClick={() => setActiveTab('tasks')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl ${activeTab === 'tasks' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}><List size={17}/> Tasks Table</button>
          <button onClick={() => setActiveTab('gantt')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl ${activeTab === 'gantt' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}><Clock size={17}/> Gantt View</button>
          <button onClick={() => setActiveTab('team')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl ${activeTab === 'team' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}><Users size={17}/> Team</button>
        </nav>
        
        <div className="pt-4 border-t border-white/10 space-y-2">
          <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 text-xs font-black bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-500 transition-all"><Download size={14}/> EXPORT EXCEL</button>
          <label className="w-full flex items-center justify-center gap-2 text-xs font-black bg-slate-800 text-slate-400 p-3 rounded-xl cursor-pointer hover:bg-slate-700 transition-all border border-white/5"><Upload size={14}/> IMPORT EXCEL<input type="file" className="hidden" onChange={handleImport}/></label>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {/* Dashboard and Team Tabs remain consistent... */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-[1.5rem] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr><th className="p-4">Project / Task</th><th className="p-4">Team</th><th className="p-4">Dates</th><th className="p-4">Progress</th><th className="p-4">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-xs">
                {data.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3"><input className="text-indigo-600 block bg-transparent outline-none mb-0.5 text-[10px]" value={t.project} onChange={e => updateTask(t.id, 'project', e.target.value)} /><input className="text-slate-800 block bg-transparent outline-none w-full" value={t.task} onChange={e => updateTask(t.id, 'task', e.target.value)} /></td>
                    <td className="p-3"><div className="flex flex-wrap gap-1">{team.map(m => (<button key={m.name} onClick={() => { const cur = t.person || ""; const up = cur.includes(m.name) ? cur.split(',').filter(p => p.trim() !== m.name).join(',') : (cur ? cur + ',' + m.name : m.name); updateTask(t.id, 'person', up); }} className={`px-1.5 py-0.5 rounded text-[8px] ${t.person?.includes(m.name) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{m.name}</button>))}</div></td>
                    <td className="p-3"><div className="flex gap-1"><input type="date" className="text-[9px] p-0.5 border rounded" value={t.start} onChange={e => updateTask(t.id, 'start', e.target.value)} /><input type="date" className="text-[9px] p-0.5 border rounded" value={t.end} onChange={e => updateTask(t.id, 'end', e.target.value)} /></div></td>
                    <td className="p-3"><div className="flex items-center gap-2"><input type="range" className="w-16 accent-indigo-600" value={t.progress} onChange={e => updateTask(t.id, 'progress', e.target.value)} /> <span className="text-[9px]">{t.progress}%</span></div></td>
                    <td className="p-3"><button onClick={() => setData(data.filter(x => x.id !== t.id))} className="text-slate-200 hover:text-red-500"><Trash2 size={14}/></button></td>
                  </tr>
                ))}
                <tr><td colSpan={5} className="p-3 text-center"><button onClick={() => setData([...data, {id: Date.now(), project: 'NEW', task: 'Task', start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], progress: 0, color: '#6366f1'}])} className="text-[10px] font-black text-indigo-600 flex items-center gap-2 mx-auto"><Plus size={14}/> ADD TASK</button></td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'gantt' && (
          <div className="bg-white rounded-[2rem] shadow-sm border flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
               <div className="flex bg-white p-1 rounded-lg shadow-sm border scale-90 origin-left">
                  <button onClick={() => setZoomScale(Math.max(0.3, zoomScale - 0.1))} className="p-1.5 hover:bg-slate-50 rounded-md"><ZoomOut size={16}/></button>
                  <span className="px-3 py-1 text-[9px] font-black border-x uppercase flex items-center">Scale: {Math.round(zoomScale*100)}%</span>
                  <button onClick={() => setZoomScale(Math.min(2.5, zoomScale + 0.1))} className="p-1.5 hover:bg-slate-50 rounded-md"><ZoomIn size={16}/></button>
               </div>
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">v10.2 Compact Gantt</div>
            </div>

            <div className="flex-1 overflow-auto relative">
              <div style={{ width: `${projectRange.totalDays * 40 * zoomScale}px` }} className="relative">
                {/* Timeline Header */}
                <div className="flex sticky top-0 z-30 bg-white/95 border-b ml-[200px]">
                  {Array.from({length: Math.ceil(projectRange.totalDays / 7)}).map((_, i) => {
                    const d = new Date(projectRange.start); d.setDate(d.getDate() + (i * 7));
                    return <div key={i} className="flex-1 text-center py-3 border-r border-slate-50 font-black text-[9px] text-slate-400 uppercase" style={{ minWidth: `${7 * 40 * zoomScale}px` }}>W{i+1} • {d.getDate()}/{d.getMonth()+1}</div>
                  })}
                </div>

                {/* Vertical Lines */}
                <div className="absolute inset-0 ml-[200px] pointer-events-none flex z-0">
                   {Array.from({length: projectRange.totalDays}).map((_, i) => (
                     <div key={i} className="border-r border-slate-50/50 h-full" style={{ width: `${40 * zoomScale}px` }} />
                   ))}
                </div>

                {/* TODAY LINE FIX */}
                {(() => {
                  const today = new Date();
                  if (today >= projectRange.start && today <= projectRange.end) {
                    const diffDays = (today - projectRange.start) / (1000 * 60 * 60 * 24);
                    const leftPos = 200 + (diffDays * 40 * zoomScale);
                    return (
                      <div className="absolute top-0 bottom-0 z-40 pointer-events-none border-l-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                           style={{ left: `${leftPos}px` }}>
                        <div className="bg-red-500 text-white text-[7px] font-black px-1 py-0.5 rounded-b absolute top-[36px] left-[-1px] whitespace-nowrap uppercase">Today</div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Rows */}
                <div className="relative z-10">
                  {groupedData.map((group, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex items-center border-b bg-indigo-50/20 sticky left-0 z-10">
                        <div className="w-[200px] shrink-0 p-3 bg-indigo-50/50 border-r sticky left-0 z-30 font-black text-[10px] text-indigo-700 uppercase">📁 {group.name}</div>
                        <div className="flex-1 h-8 relative">
                           <div className="absolute h-1 top-3.5 bg-indigo-300/30 rounded-full" 
                                style={{ 
                                  left: `${Math.ceil((safeDate(group.start) - projectRange.start) / (1000*60*60*24)) * 40 * zoomScale}px`, 
                                  width: `${Math.ceil((safeDate(group.end) - safeDate(group.start)) / (1000*60*60*24)) * 40 * zoomScale}px` 
                                }} />
                        </div>
                      </div>
                      {group.tasks.map(task => {
                        const start = safeDate(task.start); const end = safeDate(task.end);
                        const left = Math.ceil((start - projectRange.start) / (1000*60*60*24)) * 40 * zoomScale;
                        const w = Math.ceil((end - start) / (1000*60*60*24)) * 40 * zoomScale;
                        return (
                          <div key={task.id} className="flex items-center border-b group hover:bg-slate-50/30 transition-colors">
                            <div className="w-[200px] shrink-0 p-3 bg-white border-r sticky left-0 z-30 flex items-center gap-2 shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                               <input type="color" value={task.color} onChange={e => updateTask(task.id, 'color', e.target.value)} className="w-3 h-3 rounded-full border-none cursor-pointer" />
                               <div className="truncate leading-tight"><p className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">{task.task}</p><p className="text-[7px] font-bold text-slate-400">👤 {task.person || 'N/A'}</p></div>
                            </div>
                            <div className="flex-1 h-10 relative">
                               <div className="absolute h-5 top-2.5 rounded-lg shadow-sm flex items-center px-2 text-[8px] text-white font-black overflow-hidden" style={{ left: `${left}px`, width: `${w}px`, backgroundColor: task.color }}>
                                 <div className="absolute inset-0 bg-black/10" style={{ width: `${task.progress}%` }} />
                                 <span className="relative z-10">{task.progress}%</span>
                               </div>
                               <div className="absolute top-2.5 flex flex-col items-center" style={{ left: `${left + w}px`, transform: 'translateX(-50%)' }}>
                                  <div className="w-2.5 h-2.5 rotate-45 border border-white shadow-sm" style={{ backgroundColor: task.color }} />
                                  <span className="text-[7px] font-black text-slate-400 mt-5 bg-white/90 px-0.5 rounded">{end.getDate()}/{end.getMonth()+1}</span>
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