import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getTicketsApi } from '../api/tickets';
import { getProjectsApi } from '../api/projects';
import { formatApiError } from '../api/axios';
import { TypeBadge, StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { useAuth } from '../context/useAuth';

export default function TicketListPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [projectsMap, setProjectsMap] = useState({});
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const isViewer = user?.role === 'Viewer';

  // 1. Debounce keyword search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // 2. Load accessible projects for filter dropdown and mapping
  useEffect(() => {
    let isMounted = true;

    getProjectsApi()
      .then((data) => {
        if (!isMounted) return;
        const map = {};
        data.forEach((p) => {
          map[p.id] = p.name;
        });
        setProjectsMap(map);
        setProjectsList(data);
      })
      .catch(() => {
        // Non-blocking: projects failover gracefully to empty list
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch tickets when debouncedSearch, selectedProject, selectedStatus, selectedPriority, or selectedType changes
  useEffect(() => {
    let isMounted = true;

    async function fetchFilteredTickets() {
      setLoading(true);
      setError('');

      try {
        const params = {};
        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }
        if (selectedProject) {
          params.project_id = Number(selectedProject);
        }
        if (selectedStatus) {
          params.status_filter = selectedStatus;
        }
        if (selectedPriority) {
          params.priority_filter = selectedPriority;
        }
        if (selectedType) {
          params.type_filter = selectedType;
        }

        const data = await getTicketsApi(params);
        if (isMounted) {
          setTickets(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(formatApiError(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFilteredTickets();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedProject, selectedStatus, selectedPriority, selectedType]);

  // 4. Refresh tickets with active filters without re-fetching projects
  const handleRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (selectedProject) {
        params.project_id = Number(selectedProject);
      }
      if (selectedStatus) {
        params.status_filter = selectedStatus;
      }
      if (selectedPriority) {
        params.priority_filter = selectedPriority;
      }
      if (selectedType) {
        params.type_filter = selectedType;
      }

      const ticketsData = await getTicketsApi(params);
      setTickets(ticketsData);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const isFiltered = Boolean(
    searchTerm.trim() ||
    selectedProject ||
    selectedStatus ||
    selectedPriority ||
    selectedType
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedProject('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedType('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link to="/dashboard" className="hover:text-blue-600 transition">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Tickets</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tickets</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Browse, search, and filter issues across your accessible projects
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50 cursor-pointer"
              title="Refresh ticket list"
            >
              <span className={`mr-1.5 ${loading ? 'animate-spin' : ''}`}>↻</span>
              <span>Refresh</span>
            </button>

            {!isViewer && (
              <Link
                to="/tickets/new"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
              >
                <span className="text-base font-bold mr-1 leading-none">+</span>
                <span>Create Ticket</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Project Dropdown */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-slate-700"
            >
              <option value="">All Projects</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>

            {/* Priority Dropdown */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-slate-700"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            {/* Type Dropdown */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-slate-700"
            >
              <option value="">All Types</option>
              <option value="Bug">Bug</option>
              <option value="Task">Task</option>
              <option value="Feature">Feature</option>
            </select>

            {/* Reset / Clear Filters Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                title="Reset all filters"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Showing <strong className="text-slate-800">{tickets.length}</strong> {tickets.length === 1 ? 'ticket' : 'tickets'}
              {isFiltered && ' (filtered)'}
            </span>
            {isFiltered && (
              <span className="text-[11px] text-blue-600">
                Filters active
              </span>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start justify-between">
            <div>
              <span className="font-semibold">Failed to load tickets: </span>
              {error}
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs font-bold underline hover:no-underline ml-4 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="mt-6">
          {loading ? (
            /* Loading State */
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-sm font-medium text-slate-600">Loading accessible tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            /* Empty State: distinguishes filtered vs overall empty */
            isFiltered ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center text-xl font-bold">
                  🔍
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">No matching tickets</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No tickets match your current search and filter criteria. Try adjusting or clearing your filters.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">No tickets found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  There are currently no tickets in the projects accessible to your account.
                </p>
                {!isViewer && (
                  <div className="mt-6">
                    <Link
                      to="/tickets/new"
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                    >
                      + Create your first ticket
                    </Link>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Tickets Table */
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total tickets: {tickets.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-3.5">Key</th>
                      <th scope="col" className="px-6 py-3.5">Title</th>
                      <th scope="col" className="px-6 py-3.5">Project</th>
                      <th scope="col" className="px-6 py-3.5">Type</th>
                      <th scope="col" className="px-6 py-3.5">Status</th>
                      <th scope="col" className="px-6 py-3.5">Priority</th>
                      <th scope="col" className="px-6 py-3.5">Assignee</th>
                      <th scope="col" className="px-6 py-3.5">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {tickets.map((ticket) => {
                      const projectName = projectsMap[ticket.project_id]
                        ? `${projectsMap[ticket.project_id]} (#${ticket.project_id})`
                        : `Project #${ticket.project_id}`;

                      return (
                        <tr key={ticket.id} className="hover:bg-slate-50/75 transition">
                          {/* Key */}
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-500">
                            #{ticket.id}
                          </td>

                          {/* Title & Description preview */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              <Link
                                to={`/tickets/${ticket.id}`}
                                className="font-semibold text-slate-900 hover:text-blue-600 transition line-clamp-1 cursor-pointer"
                                title="View ticket details and comments"
                              >
                                {ticket.title}
                              </Link>
                            </div>
                            {ticket.description && (
                              <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {ticket.description}
                              </div>
                            )}
                          </td>

                          {/* Project */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                            {projectName}
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <TypeBadge type={ticket.type} />
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={ticket.status} />
                          </td>

                          {/* Priority */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <PriorityBadge priority={ticket.priority} />
                          </td>

                          {/* Assignee */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                            {ticket.assignee_id ? (
                              <span className="font-medium text-slate-800">
                                User #{ticket.assignee_id}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            {formatDate(ticket.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
