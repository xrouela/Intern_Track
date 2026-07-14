import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiService';
import { format } from 'date-fns';
import { parseUTCDate } from '../../utils/dateUtils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileDown, Search, Filter, Calendar, Users, FileText, CheckCircle, Clock, AlertCircle, Plus, X, ListTodo, Download, FileSpreadsheet, BarChart3, Check, Info, TrendingUp, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TaskReport() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('Date');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    estimated_hours: 0,
    status: 'pending',
    priority: 'medium'
  });

  const fetchData = async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const [allTasks, allShifts, allUsers] = await Promise.all([
        api.getTasks(profile.uid),
        api.getShifts(profile.uid),
        api.getUsers()
      ]);
      setTasks(allTasks);
      setShifts(allShifts);
      setInterns(allUsers);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;

  const requiredHours = profile?.required_hours || 0;
  const hoursRendered = shifts.filter(s => s.status === 'completed').reduce((acc, s) => acc + (s.total_hours || 0), 0);
  const remainingHours = Math.max(requiredHours - hoursRendered, 0);
  const completionPercentage = requiredHours > 0 ? Math.min(Math.round((hoursRendered / requiredHours) * 100), 100) : 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalEstimatedHours = tasks.reduce((acc, t) => acc + (t.estimated_hours || 0), 0);
  const avgHoursPerTask = totalTasks > 0 ? (totalEstimatedHours / totalTasks).toFixed(1) : '0.0';

  // Filter and sort tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = (t.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
       matchesDate = t.start_date >= dateRange.start && t.start_date <= dateRange.end;
    }
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    if (sortBy === 'Date') return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    if (sortBy === 'Title') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'Status') return (a.status || '').localeCompare(b.status || '');
    if (sortBy === 'Hours') return (b.estimated_hours || 0) - (a.estimated_hours || 0);
    return 0;
  });

  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const handleManualTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskPayload = {
        ...formData,
        assigned_to: profile?.uid,
        assigned_to_name: profile?.name,
        estimated_hours: Number(formData.estimated_hours),
      };
      await api.createTask(taskPayload);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        estimated_hours: 0,
        status: 'pending',
        priority: 'medium'
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to save task.');
    }
  };

  const getExportData = () => {
    return filteredTasks.map(t => ({
      Date: t.start_date || '--',
      'Task Title': t.title || 'N/A',
      Description: t.description || '',
      'Assigned By': t.assigned_to_name || 'System',
      Status: t.status || 'Pending',
      'Hours Spent': t.estimated_hours || 0
    }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Task Report', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Intern Name: ${profile?.name || ''}`, 14, 25);
    doc.text(`Department: ${profile?.department || ''}`, 14, 30);
    doc.text(`Report Period: ${dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'All Time'}`, 14, 35);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 40);

    const tableData = filteredTasks.map(t => [
      t.start_date || '--',
      t.title || 'N/A',
      t.description || '',
      t.assigned_to_name || 'System',
      t.status || 'Pending',
      t.estimated_hours || 0
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Task Title', 'Description', 'Assigned By', 'Status', 'Hours Spent']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' }
    });

    doc.save(`Task_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const generateExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Task Report');
    XLSX.writeFile(wb, `Task_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };


  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Report</h1>
          <p className="text-slate-500 text-sm">View and export your task accomplishment report.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generatePDF} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"><FileText size={14}/> Export as PDF</button>
          <button onClick={generateExcel} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm"><FileSpreadsheet size={14}/> Export as Excel</button>
        </div>
      </div>



      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: totalTasks, icon: ListTodo, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Completed', value: completedTasks, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', value: pendingTasks, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Overdue', value: overdueTasks, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stat.value}</div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                {stat.label === 'Total Tasks' ? 'All assigned tasks' : 
                 stat.label === 'Completed' ? `${totalTasks > 0 ? ((stat.value/totalTasks)*100).toFixed(1) : 0}% completed` :
                 stat.label === 'Pending' ? `${totalTasks > 0 ? ((stat.value/totalTasks)*100).toFixed(1) : 0}% pending` :
                 `${totalTasks > 0 ? ((stat.value/totalTasks)*100).toFixed(1) : 0}% overdue`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Statistics */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          Report Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="flex items-start gap-4 pt-4 lg:pt-0">
            <Clock size={36} strokeWidth={1.5} className="text-indigo-500 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Hours Worked</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-indigo-600">{totalEstimatedHours.toFixed(2)}</span>
                <span className="text-sm font-bold text-indigo-400">hrs</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-1">All tasks</span>
            </div>
          </div>
          
          <div className="flex items-start gap-4 pt-4 lg:pt-0 lg:pl-8">
            <CheckCircle size={36} strokeWidth={1.5} className="text-emerald-500 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Tasks Completed</span>
              <span className="text-2xl font-black text-emerald-600">{completedTasks}</span>
              <span className="text-xs font-semibold text-slate-500 mt-1">This period</span>
            </div>
          </div>
          
          <div className="flex items-start gap-4 pt-4 lg:pt-0 lg:pl-8">
            <TrendingUp size={36} strokeWidth={1.5} className="text-blue-500 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Completion Rate</span>
              <span className="text-2xl font-black text-blue-600">{taskCompletionRate.toFixed(1)}%</span>
              <span className="text-xs font-semibold text-slate-500 mt-1">Excellent</span>
            </div>
          </div>
          
          <div className="flex items-start gap-4 pt-4 lg:pt-0 lg:pl-8">
            <PieChart size={36} strokeWidth={1.5} className="text-amber-500 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Average Hours per Task</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-500">{avgHoursPerTask}</span>
                <span className="text-sm font-bold text-amber-400">hrs</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-1">Per task</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-800">Filters</span>
            </div>
            
            <div className="flex-1 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Search Task</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by task title or keyword..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date Range</label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text"
                    placeholder="07/01/2026 - 07/31/2026"
                    className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary transition-all"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="w-36">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Status</label>
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-primary transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="w-40">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Assigned By</label>
                <select 
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-primary transition-all"
                >
                  <option value="Date">Date (Newest)</option>
                  <option value="Title">Title</option>
                  <option value="Status">Status</option>
                  <option value="Hours">Hours</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateRange({start: '', end: ''});
              }}
              className="text-xs font-bold text-primary hover:text-indigo-700 self-start mt-1 whitespace-nowrap"
            >
              Reset Filters
            </button>
          </div>
        </div>



        {/* Table */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            Task Report <span className="text-slate-500 font-medium">({filteredTasks.length} of {totalTasks} tasks)</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#f8f9ff] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Task Title</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Description</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Assigned By</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Hours Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTasks.length > 0 ? paginatedTasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-600 whitespace-nowrap">{task.start_date || '--'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{task.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-[250px] truncate" title={task.description}>{task.description || '--'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{task.assigned_to_name || 'System'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                      task.status === 'completed' ? 'bg-[#e0f5ea] text-[#1e8653]' :
                      task.status === 'in-progress' ? 'bg-[#e0e7ff] text-[#4f46e5]' :
                      task.status === 'pending' ? 'bg-[#ffedd5] text-[#ea580c]' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">{Number(task.estimated_hours).toFixed(2)} hrs</td>
                  <td className="px-6 py-4 text-slate-400">
                    <button className="p-1 hover:text-slate-600 rounded">
                      <ListTodo size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No tasks found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Manual Task Button */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full max-w-sm py-2 text-primary font-bold text-sm hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Plus size={16} strokeWidth={3} />
            Add Manual Task Entry
          </button>
        </div>
      </div>
      
      {/* Report Includes */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-4">Report Includes</h3>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Check size={16} className="text-primary" /> Task Title & Description
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Check size={16} className="text-primary" /> Status & Remarks
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Check size={16} className="text-primary" /> Date Assigned & Completed
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Check size={16} className="text-primary" /> Evidence Link (if any)
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Check size={16} className="text-primary" /> Hours Spent
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Check size={16} className="text-primary" /> Supervisor Notes (if any)
            </div>
          </div>
          
          <div className="md:w-64 bg-[#f8f9ff] rounded-xl p-4 border border-indigo-50/50">
            <div className="text-xs font-bold text-slate-800 mb-1">Report Period</div>
            <div className="text-primary font-bold text-sm mb-4">
              {dateRange.start && dateRange.end ? `${format(new Date(dateRange.start), 'MMMM d')} - ${format(new Date(dateRange.end), 'MMMM d, yyyy')}` : 'July 1 - July 31, 2026'}
            </div>
            <div className="text-[10px] text-slate-500">
              Generated on {format(new Date(), 'MMMM d, yyyy h:mm a')}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f8f9ff] border border-indigo-50/50 rounded-xl p-4 flex items-center gap-3 text-sm text-slate-600 shadow-sm">
        <Info size={18} className="text-primary" />
        All times are recorded in hours.
      </div>

      {/* Manual Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">Add Manual Task</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleManualTaskSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Task Title</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-24"
                    placeholder="Describe what you did..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                    <input 
                      type="date" 
                      required
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hours Spent</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      required
                      value={formData.estimated_hours}
                      onChange={e => setFormData({ ...formData, estimated_hours: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold bg-primary text-white hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
