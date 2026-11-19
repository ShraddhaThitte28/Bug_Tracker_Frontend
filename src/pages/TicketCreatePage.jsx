import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProjectsApi, getProjectMembersApi } from '../api/projects';
import { createTicketApi } from '../api/tickets';
import { formatApiError } from '../api/axios';
import { useAuth } from '../context/useAuth';

export default function TicketCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Projects and team members state
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Bug');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const isViewer = user?.role === 'Viewer';

  // 1. Fetch accessible projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoadingProjects(true);
        const data = await getProjectsApi();
        setProjects(data);
        if (data.length > 0) {
          setProjectId(String(data[0].id));
        }
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  const handleProjectChange = (newProjectId) => {
    setProjectId(newProjectId);
    setAssigneeId('');
    setMembers([]);
    if (fieldErrors.projectId) {
      setFieldErrors((prev) => ({ ...prev, projectId: null }));
    }
  };

  // 2. Fetch team members when the selected project changes
  useEffect(() => {
    if (!projectId) {
      return;
    }

    let isMounted = true;
    async function fetchMembers() {
      try {
        setLoadingMembers(true);
        const data = await getProjectMembersApi(Number(projectId));
        // Filter only active members as required by backend assignee rules
        if (isMounted) {
          const activeMembers = data.filter((m) => m.is_active);
          setMembers(activeMembers);
        }
      } catch (err) {
        console.warn('Could not load project team members:', err);
        if (isMounted) {
          setMembers([]);
        }
      } finally {
        if (isMounted) {
          setLoadingMembers(false);
        }
      }
    }

    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Client-side field validation
  const validateForm = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Ticket title is required.';
    } else if (title.trim().length > 200) {
      errors.title = 'Ticket title cannot exceed 200 characters.';
    }

    if (!projectId) {
      errors.projectId = 'Please select a project.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isViewer) {
      setError('Viewers have read-only access and cannot create tickets.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    // Payload adheres strictly to backend TicketCreate schema
    // created_by is deliberately omitted (server derives from JWT)
    const payload = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      type,
      status,
      priority,
      project_id: Number(projectId),
      assignee_id: assigneeId ? Number(assigneeId) : null,
    };

    try {
      const created = await createTicketApi(payload);
      setSuccessMessage(`Ticket #${created.id} ("${created.title}") created successfully!`);
      // Short delay so the user sees the success alert before navigating
      setTimeout(() => {
        navigate('/tickets');
      }, 900);
    } catch (err) {
      setError(formatApiError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link to="/dashboard" className="hover:text-blue-600 transition">
                Dashboard
              </Link>
              <span>/</span>
              <Link to="/tickets" className="hover:text-blue-600 transition">
                Tickets
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Create Ticket</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Ticket</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              File a new bug, task, or feature request in an accessible project
            </p>
          </div>

          <Link
            to="/tickets"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
        </div>

        {/* Viewer Warning */}
        {isViewer && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start space-x-3">
            <span className="text-amber-600 font-bold text-lg leading-none">!</span>
            <div>
              <p className="font-semibold">Read-only account restriction</p>
              <p className="mt-0.5 text-xs text-amber-800">
                You are currently signed in with the <strong>Viewer</strong> role. Viewers can browse tickets but cannot create or modify issues.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <span className="font-semibold">Error: </span>
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {successMessage}
          </div>
        )}

        {/* Ticket Creation Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-800">
                Ticket Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                disabled={isViewer || submitting}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: null }));
                  }
                }}
                maxLength={200}
                placeholder="e.g., Fix login page crash on Safari"
                className={`mt-1.5 block w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm shadow-sm placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.title ? 'border-red-300 bg-red-50/30' : 'border-slate-300'
                  }`}
              />
              <div className="flex justify-between items-center mt-1 text-xs">
                {fieldErrors.title ? (
                  <span className="text-red-600 font-medium">{fieldErrors.title}</span>
                ) : (
                  <span className="text-slate-400">Be concise and descriptive</span>
                )}
                <span className="text-slate-400">{title.length}/200</span>
              </div>
            </div>

            {/* Project & Assignee Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Project Selection */}
              <div>
                <label htmlFor="project" className="block text-sm font-semibold text-slate-800">
                  Project <span className="text-red-500">*</span>
                </label>
                {loadingProjects ? (
                  <div className="mt-1.5 text-xs text-slate-500 py-2">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="mt-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No accessible projects found. Ask an admin to add you to a project first.
                  </div>
                ) : (
                  <select
                    id="project"
                    required
                    disabled={isViewer || submitting}
                    value={projectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name} (ID: #{proj.id})
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.projectId && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.projectId}</p>
                )}
              </div>

              {/* Assignee Selection */}
              <div>
                <label htmlFor="assignee" className="block text-sm font-semibold text-slate-800">
                  Assignee <span className="text-xs font-normal text-slate-500">(Optional)</span>
                </label>
                <select
                  id="assignee"
                  disabled={isViewer || submitting || loadingMembers || members.length === 0}
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 disabled:bg-slate-50"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username} ({member.role})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  {loadingMembers
                    ? 'Loading project members...'
                    : members.length === 0
                    ? 'No members in this project'
                    : 'Only active members of this project can be assigned'}
                </p>
              </div>
            </div>

            {/* Type, Status, Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-semibold text-slate-800">
                  Issue Type
                </label>
                <select
                  id="type"
                  disabled={isViewer || submitting}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  <option value="Bug">Bug</option>
                  <option value="Task">Task</option>
                  <option value="Feature">Feature</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-slate-800">
                  Initial Status
                </label>
                <select
                  id="status"
                  disabled={isViewer || submitting}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-slate-800">
                  Priority
                </label>
                <select
                  id="priority"
                  disabled={isViewer || submitting}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-800">
                Description <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <textarea
                id="description"
                rows={4}
                disabled={isViewer || submitting}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed steps to reproduce, expected vs actual behavior, or acceptance criteria..."
                className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
              <Link
                to="/tickets"
                className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isViewer || submitting || projects.length === 0}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Ticket...</span>
                  </>
                ) : (
                  <span>Create Ticket</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

