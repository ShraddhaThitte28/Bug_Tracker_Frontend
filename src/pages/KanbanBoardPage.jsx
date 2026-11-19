import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import Navbar from '../components/Navbar';
import { TypeBadge, PriorityBadge } from '../components/StatusBadge';
import { useAuth } from '../context/useAuth';
import { getTicketsApi, updateTicketStatusApi } from '../api/tickets';
import { formatApiError } from '../api/axios';

const COLUMNS = [
  {
    id: 'To Do',
    title: 'To Do',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dropHighlight: 'bg-slate-100/70 border-slate-400 ring-2 ring-slate-300',
    emptyMsg: 'No tickets in To Do',
  },
  {
    id: 'In Progress',
    title: 'In Progress',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dropHighlight: 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300',
    emptyMsg: 'No tickets in In Progress',
  },
  {
    id: 'Done',
    title: 'Done',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dropHighlight: 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-300',
    emptyMsg: 'No completed tickets',
  },
];

/**
 * Presentational Ticket Card UI.
 * Pure presentation component - does NOT register any drag hooks itself.
 */
function TicketCardView({
  ticket,
  isViewer,
  isOverlay = false,
  style = {},
  setNodeRef,
  attributes = {},
  listeners = {},
}) {
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm transition ${
        isOverlay
          ? 'shadow-2xl border-blue-400 ring-2 ring-blue-300 rotate-1 cursor-grabbing'
          : isViewer
          ? 'cursor-default'
          : 'cursor-grab active:cursor-grabbing hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-bold text-slate-500">
          #{ticket.id}
        </span>
        <div className="flex items-center space-x-1.5">
          <TypeBadge type={ticket.type} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">
        {ticket.title}
      </h4>

      {ticket.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {ticket.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
        <span>Project #{ticket.project_id}</span>
        {isViewer ? (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            Read-only
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Drag to move</span>
        )}
      </div>
    </div>
  );
}

/**
 * Draggable Ticket Card on the Kanban Board.
 * Calls useDraggable and passes drag props down to TicketCardView.
 */
function DraggableTicketCard({ ticket, isViewer }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `ticket-${ticket.id}`,
    disabled: isViewer,
    data: { ticket },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <TicketCardView
      ticket={ticket}
      isViewer={isViewer}
      style={style}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
    />
  );
}

/**
 * Droppable Column Container for each Workflow Status.
 */
function KanbanColumn({ column, tickets, isViewer }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { status: column.id },
  });

  return (
    <div className="flex flex-col w-full min-w-0 bg-slate-100/80 rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm">
      {/* Column Header */}
      <div className="p-4 border-b border-slate-200/70 bg-white/70 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {column.title}
          </h3>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${column.badgeClass}`}
          >
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Droppable Card List Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 space-y-3 min-h-[360px] transition-colors rounded-b-2xl ${
          isOver ? column.dropHighlight : ''
        }`}
      >
        {tickets.length === 0 ? (
          <div className="h-full min-h-[140px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
            <span className="text-xs font-medium text-slate-400">
              {column.emptyMsg}
            </span>
          </div>
        ) : (
          tickets.map((ticket) => (
            <DraggableTicketCard
              key={ticket.id}
              ticket={ticket}
              isViewer={isViewer}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Main Kanban Board Page.
 */
export default function KanbanBoardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const isViewer = user?.role === 'Viewer';

  // Configure sensors: require 5px movement before dragging to prevent conflict with clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTicketsApi();
      setTickets(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadTickets() {
      try {
        const data = await getTicketsApi();
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

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDragStart = (event) => {
    if (isViewer) return;
    const ticket = event.active.data.current?.ticket;
    setActiveTicket(ticket || null);
  };

  const handleDragEnd = async (event) => {
    setActiveTicket(null);
    if (isViewer) return;

    const { active, over } = event;
    if (!over) return;

    const ticket = active.data.current?.ticket;
    const targetStatus = over.data.current?.status || over.id;

    if (!ticket || !targetStatus) return;
    if (ticket.status === targetStatus) return;

    const previousTickets = [...tickets];
    const ticketId = ticket.id;

    // 1. Optimistic Update: Move card immediately in UI
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: targetStatus } : t))
    );
    setUpdatingId(ticketId);
    setError(null);

    // 2. Call FastAPI backend PUT /tickets/{ticket_id}
    try {
      await updateTicketStatusApi(ticketId, targetStatus);
    } catch (err) {
      // 3. Rollback on failure
      setTickets(previousTickets);
      setError(`Failed to move ticket #${ticketId}: ${formatApiError(err)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link to="/dashboard" className="hover:text-blue-600 transition">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Kanban Board</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Kanban Board
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Drag and drop tickets across workflow columns to update their status
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50 cursor-pointer"
              title="Refresh tickets from server"
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

        {/* Viewer Role Informational Notice */}
        {isViewer && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold">ℹ Note:</span>
              <span>
                You are logged in as a <strong>Viewer</strong>. You have read-only access and cannot drag tickets between columns.
              </span>
            </div>
          </div>
        )}

        {/* Active Saving / Updating Indicator */}
        {updatingId && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <span className="animate-spin text-sm">↻</span>
            <span>Updating ticket #{updatingId} status on server...</span>
          </div>
        )}

        {/* Error Alert with Retry */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start justify-between shadow-xs">
            <div>
              <span className="font-semibold">Error: </span>
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
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm font-medium text-slate-700">Loading Kanban board...</p>
            <p className="mt-1 text-xs text-slate-400">Fetching accessible tickets from backend</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveTicket(null)}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">
              {COLUMNS.map((col) => {
                const columnTickets = tickets.filter(
                  (t) => t.status === col.id
                );
                return (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    tickets={columnTickets}
                    isViewer={isViewer}
                  />
                );
              })}
            </div>

            {/* Drag Overlay for smooth card movement - uses purely presentational TicketCardView */}
            <DragOverlay>
              {activeTicket ? (
                <TicketCardView
                  ticket={activeTicket}
                  isViewer={isViewer}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
}
