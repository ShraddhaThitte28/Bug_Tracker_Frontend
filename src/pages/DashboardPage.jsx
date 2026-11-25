import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getTicketsApi } from '../api/tickets';
import { getProjectsApi } from '../api/projects';
import { formatApiError } from '../api/axios';
import { TypeBadge, StatusBadge, PriorityBadge, RoleBadge } from '../components/StatusBadge';
import { useAuth } from '../context/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isViewer = user?.role === 'Viewer';

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [ticketsData, projectsData] = await Promise.all([
          getTicketsApi(),
          getProjectsApi().catch(() => []),
        ]);

        if (isMounted) {
          setTickets(ticketsData);
          setProjects(projectsData);
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

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      const [ticketsData, projectsData] = await Promise.all([
        getTicketsApi(),
        getProjectsApi().catch(() => []),
      ]);

      setTickets(ticketsData);
      setProjects(projectsData);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Derive all metrics directly from actual backend data
  const totalTickets = tickets.length;
  const totalProjects = projects.length;

  const toDoCount = tickets.filter((t) => t.status === 'To Do').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const doneCount = tickets.filter((t) => t.status === 'Done').length;

  const highPriorityCount = tickets.filter((t) => t.priority === 'High').length;
  const mediumPriorityCount = tickets.filter((t) => t.priority === 'Medium').length;
  const lowPriorityCount = tickets.filter((t) => t.priority === 'Low').length;

  const bugCount = tickets.filter((t) => t.type === 'Bug').length;
  const taskCount = tickets.filter((t) => t.type === 'Task').length;
  const featureCount = tickets.filter((t) => t.type === 'Feature').length;

  const assignedToMeCount = user?.id
    ? tickets.filter((t) => t.assignee_id === user.id).length
    : 0;

  // Build project name lookup map & per-project ticket counts
  const projectsMap = {};
  const projectTicketCounts = {};
  projects.forEach((p) => {
    projectsMap[p.id] = p.name;
    projectTicketCounts[p.id] = 0;
  });
  tickets.forEach((t) => {
    if (projectTicketCounts[t.project_id] !== undefined) {
      projectTicketCounts[t.project_id] += 1;
    }
  });

  // Recent 5 tickets sorted by ID descending
  const recentTickets = [...tickets].sort((a, b) => b.id - a.id).slice(0, 5);

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Welcome Header & Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, {user?.username || 'Team Member'}!
                </h1>
                {user?.role && <RoleBadge role={user.role} />}
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Overview of current issues, active sprints, and workload across your accessible projects.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
                title="Refresh dashboard metrics"
              >
                <span className={`mr-1.5 text-sm ${loading ? 'animate-spin' : ''}`}>↻</span>
                <span>Refresh</span>
              </button>

              <Link
                to="/tickets"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition shadow-sm"
              >
                View All Tickets
              </Link>

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
        </div>

        {/* Error Alert with Retry */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div>
              <span className="font-semibold">Failed to load dashboard data: </span>
              {error}
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs font-bold underline hover:no-underline self-start sm:self-auto"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner State */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm font-semibold text-slate-700">Loading dashboard metrics...</p>
            <p className="mt-1 text-xs text-slate-400">Fetching accessible projects and tickets from FastAPI backend</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Card 1: Total Tickets */}
              <Link
                to="/tickets"
                className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Tickets</span>
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                    #
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                    {totalTickets}
                  </span>
                  <span className="text-xs font-medium text-blue-600 group-hover:underline">
                    View list →
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Across {totalProjects} accessible project{totalProjects === 1 ? '' : 's'}
                </p>
              </Link>

              {/* Card 2: In Progress */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">In Progress</span>
                  <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                    ⏳
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                    {inProgressCount}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    {totalTickets > 0 ? `${Math.round((inProgressCount / totalTickets) * 100)}%` : '0%'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Active tasks currently being resolved</p>
              </div>

              {/* Card 3: High Priority */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">High Priority</span>
                  <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                    ▲
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">
                    {highPriorityCount}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Urgent
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Critical items requiring immediate attention</p>
              </div>

              {/* Card 4: Resolved / Done */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resolved / Done</span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    ✓
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {doneCount}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {totalTickets > 0 ? `${Math.round((doneCount / totalTickets) * 100)}%` : '0%'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Successfully closed and verified tickets</p>
              </div>
            </div>

            {/* Middle Section: Distribution Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Workflow Status Distribution */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Status Breakdown</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tickets distributed by lifecycle stage</p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>To Do</span>
                        <span>{toDoCount} ({totalTickets > 0 ? Math.round((toDoCount / totalTickets) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400 rounded-full transition-all duration-500"
                          style={{ width: `${totalTickets > 0 ? (toDoCount / totalTickets) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>In Progress</span>
                        <span>{inProgressCount} ({totalTickets > 0 ? Math.round((inProgressCount / totalTickets) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${totalTickets > 0 ? (inProgressCount / totalTickets) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Done</span>
                        <span>{doneCount} ({totalTickets > 0 ? Math.round((doneCount / totalTickets) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${totalTickets > 0 ? (doneCount / totalTickets) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned to me:</span>
                  <span className="font-bold text-slate-800">{assignedToMeCount} issue{assignedToMeCount === 1 ? '' : 's'}</span>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Priority Distribution</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Categorized by urgency level</p>

                  <div className="mt-5 space-y-3.5">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <PriorityBadge priority="High" />
                        <span className="text-xs text-slate-600">High priority</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{highPriorityCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <PriorityBadge priority="Medium" />
                        <span className="text-xs text-slate-600">Medium priority</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{mediumPriorityCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <PriorityBadge priority="Low" />
                        <span className="text-xs text-slate-600">Low priority</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{lowPriorityCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total priority items:</span>
                  <span className="font-bold text-slate-800">{totalTickets}</span>
                </div>
              </div>

              {/* Issue Type Breakdown */}
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Issue Types</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Classification of reported work</p>

                  <div className="mt-5 space-y-3.5">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <TypeBadge type="Bug" />
                        <span className="text-xs text-slate-600">Software bugs & defects</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{bugCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <TypeBadge type="Task" />
                        <span className="text-xs text-slate-600">Engineering tasks</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{taskCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <TypeBadge type="Feature" />
                        <span className="text-xs text-slate-600">Feature requests</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{featureCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Defect ratio:</span>
                  <span className="font-bold text-slate-800">
                    {totalTickets > 0 ? `${Math.round((bugCount / totalTickets) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Recent Tickets (2/3 width on desktop) & Accessible Projects (1/3 width) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Tickets Table */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Recent Tickets</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Latest issues recorded in accessible projects</p>
                    </div>
                    <Link
                      to="/tickets"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      View all ({totalTickets}) →
                    </Link>
                  </div>

                  {recentTickets.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-500">No tickets found in your accessible projects.</p>
                      {!isViewer && (
                        <Link
                          to="/tickets/new"
                          className="mt-3 inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                        >
                          + Create first ticket
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          <tr>
                            <th scope="col" className="px-5 py-3">Key</th>
                            <th scope="col" className="px-5 py-3">Title</th>
                            <th scope="col" className="px-5 py-3 hidden sm:table-cell">Project</th>
                            <th scope="col" className="px-5 py-3">Status</th>
                            <th scope="col" className="px-5 py-3 hidden md:table-cell">Priority</th>
                            <th scope="col" className="px-5 py-3 hidden sm:table-cell">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {recentTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-50/75 transition">
                              <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-slate-500">
                                #{ticket.id}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-semibold text-slate-900 line-clamp-1">
                                  {ticket.title}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5 sm:hidden">
                                  <span>{projectsMap[ticket.project_id] || `#${ticket.project_id}`}</span>
                                  <span>•</span>
                                  <span>{ticket.type}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 font-medium hidden sm:table-cell">
                                {projectsMap[ticket.project_id] || `Project #${ticket.project_id}`}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <StatusBadge status={ticket.status} />
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap hidden md:table-cell">
                                <PriorityBadge priority={ticket.priority} />
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 hidden sm:table-cell">
                                {formatDate(ticket.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/40 text-right">
                  <Link
                    to="/tickets"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                  >
                    Open Full Ticket Queue →
                  </Link>
                </div>
              </div>

              {/* Accessible Projects List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/60">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Accessible Projects</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Projects assigned to your account</p>
                  </div>

                  {projects.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No accessible projects found. Ask an administrator to assign you to a project.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {projects.map((project) => (
                        <Link
                          key={project.id}
                          to={`/tickets?project_id=${project.id}`}
                          className="block p-4 sm:p-5 hover:bg-slate-50 transition cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                {project.name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                Project ID: #{project.id}
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              {projectTicketCounts[project.id] ?? 0} ticket{(projectTicketCounts[project.id] ?? 0) === 1 ? '' : 's'}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                            <span>Created: {formatDate(project.created_at)}</span>
                            <span className="font-semibold text-blue-600 group-hover:underline flex items-center space-x-1">
                              <span>View Tickets</span>
                              <span>→</span>
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
                  {user?.role === 'Admin' ? (
                    <span>Logged in as <strong>Admin</strong> (System-wide visibility enabled)</span>
                  ) : (
                    <span>Showing projects where your account has confirmed membership</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

