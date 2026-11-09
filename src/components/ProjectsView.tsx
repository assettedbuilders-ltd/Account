import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Calendar,
  Layers,
  MapPin,
  ArrowRight,
  Eye,
  X
} from 'lucide-react';
import { Project, UserRole } from '../types';
import { formatBDT } from '../utils/numberToWords';
import { exportToExcel } from '../utils/exportUtils';

interface ProjectsViewProps {
  projects: Project[];
  userRole: UserRole;
  onSaveProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  userRole,
  onSaveProject,
  onDeleteProject,
  onSelectProject,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedForDetail, setSelectedForDetail] = useState<Project | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Project>>({
    id: '',
    name: '',
    address: '',
    landArea: '',
    floors: 9,
    startDate: new Date().toISOString().slice(0, 10),
    expectedCompletionDate: '',
    status: 'In Progress',
    budget: 0,
    description: ''
  });

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    const newId = `PRJ-${String(projects.length + 1).padStart(3, '0')}`;
    setEditingProject(null);
    setFormData({
      id: newId,
      name: '',
      address: 'Notun Panir pamp Road, Block# B, Sayednagar, Vatara, Gulshan, Dhaka-1212',
      landArea: '6 Katha',
      floors: 9,
      startDate: new Date().toISOString().slice(0, 10),
      expectedCompletionDate: '2028-12-31',
      status: 'In Progress',
      budget: 35000000,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({ ...project });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.id) {
      alert('Please fill in project name and project ID');
      return;
    }

    const projectToSave: Project = {
      id: formData.id || `PRJ-${Date.now()}`,
      name: formData.name,
      address: formData.address || '',
      landArea: formData.landArea || '',
      floors: Number(formData.floors) || 1,
      startDate: formData.startDate || '',
      expectedCompletionDate: formData.expectedCompletionDate || '',
      status: formData.status as Project['status'] || 'In Progress',
      budget: Number(formData.budget) || 0,
      description: formData.description || '',
      createdAt: editingProject ? editingProject.createdAt : new Date().toISOString()
    };

    onSaveProject(projectToSave);
    setIsModalOpen(false);
  };

  const handleDelete = (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}" (${project.id})? This will remove its project profile.`)) {
      onDeleteProject(project.id);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredProjects.map(p => ({
      'Project ID': p.id,
      'Project Name': p.name,
      'Site Address': p.address,
      'Land Area': p.landArea,
      'Number of Floors': p.floors,
      'Start Date': p.startDate,
      'Expected Completion': p.expectedCompletionDate,
      'Project Status': p.status,
      'Estimated Budget (BDT)': p.budget,
      'Description': p.description
    }));
    exportToExcel('Assetted_Builders_Projects_List', 'Projects', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" /> Real Estate Projects Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage construction projects, land area, structural specifications, and budgets
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </button>
          {userRole !== 'project_manager' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add New Project
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project name, ID, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
        >
          <option value="ALL">All Project Statuses</option>
          <option value="Planning">Planning</option>
          <option value="In Progress">In Progress</option>
          <option value="Near Completion">Near Completion</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map(project => (
          <div
            key={project.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-amber-400 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {project.id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5">{project.name}</h3>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    project.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                    project.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    project.status === 'Planning' ? 'bg-sky-100 text-sky-800' :
                    'bg-slate-100 text-slate-700'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              <div className="flex items-center text-xs text-slate-500 gap-1.5 mb-3">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{project.address}</span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                {project.description || 'No additional project description provided.'}
              </p>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs mb-4">
                <div>
                  <span className="text-[11px] text-slate-400 block">Land Area</span>
                  <span className="font-semibold text-slate-800">{project.landArea || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Number of Floors</span>
                  <span className="font-semibold text-slate-800">{project.floors} Floors</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Estimated Budget</span>
                  <span className="font-bold text-slate-900 font-mono-numbers">৳ {formatBDT(project.budget)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Completion Target</span>
                  <span className="font-semibold text-slate-800">{project.expectedCompletionDate || 'TBD'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  onSelectProject(project.id);
                  onNavigate('vr_ledger');
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                Open Accounts Ledger <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  title="View Details"
                  onClick={() => setSelectedForDetail(project)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {userRole !== 'project_manager' && (
                  <>
                    <button
                      title="Edit Project"
                      onClick={() => handleOpenEdit(project)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      title="Delete Project"
                      onClick={() => handleDelete(project)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or add a new project.</p>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingProject ? 'Edit Project Details' : 'Add New Real Estate Project'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. PRJ-AMT-01"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. Assetted Master Tower"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Notun Panir pamp Road, Block# B, Sayednagar, Vatara, Gulshan, Dhaka-1212"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Land Area</label>
                  <input
                    type="text"
                    value={formData.landArea}
                    onChange={e => setFormData({ ...formData, landArea: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="e.g. 6 Katha"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Floors</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.floors}
                    onChange={e => setFormData({ ...formData, floors: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Project Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Near Completion">Near Completion</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expected Completion</label>
                  <input
                    type="date"
                    value={formData.expectedCompletionDate}
                    onChange={e => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Estimated Budget (BDT)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  placeholder="e.g. 45000000"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Project Scope</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Describe building specifications, parking slots, rooftop amenities..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
                >
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedForDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedForDetail.id}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedForDetail.name}</h2>
              </div>
              <button
                onClick={() => setSelectedForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="text-slate-400 block text-[11px]">Site Address:</span>
                <span className="font-semibold text-slate-900">{selectedForDetail.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Land Area:</span>
                  <span className="font-bold text-slate-900">{selectedForDetail.landArea}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Floors:</span>
                  <span className="font-bold text-slate-900">{selectedForDetail.floors} Floors</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Start Date:</span>
                  <span className="font-semibold text-slate-900">{selectedForDetail.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Completion Target:</span>
                  <span className="font-semibold text-slate-900">{selectedForDetail.expectedCompletionDate}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Estimated Construction Budget:</span>
                  <span className="font-extrabold text-amber-700 text-sm font-mono-numbers">
                    ৳ {formatBDT(selectedForDetail.budget)} BDT
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Description:</span>
                <p className="mt-1 text-slate-600">{selectedForDetail.description || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between gap-2">
              <button
                onClick={() => {
                  onSelectProject(selectedForDetail.id);
                  setSelectedForDetail(null);
                  onNavigate('roof_expenses');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Roof Statement
              </button>
              <button
                onClick={() => {
                  onSelectProject(selectedForDetail.id);
                  setSelectedForDetail(null);
                  onNavigate('vr_ledger');
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold"
              >
                Open VR Statement Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
