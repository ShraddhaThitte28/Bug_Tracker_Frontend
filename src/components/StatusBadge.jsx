export function TypeBadge({ type }) {
  const styles = {
    Bug: 'bg-red-50 text-red-700 border-red-200',
    Task: 'bg-blue-50 text-blue-700 border-blue-200',
    Feature: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const style = styles[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {type}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    'To Do': 'bg-slate-100 text-slate-700 border-slate-300',
    'In Progress': 'bg-amber-50 text-amber-800 border-amber-300',
    Done: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  };
  const style = styles[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    High: 'bg-rose-50 text-rose-700 border-rose-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const style = styles[priority] || 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {priority}
    </span>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    Admin: 'bg-purple-100 text-purple-800 border-purple-200',
    Developer: 'bg-blue-100 text-blue-800 border-blue-200',
    Viewer: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };
  const style = styles[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style}`}>
      {role}
    </span>
  );
}

