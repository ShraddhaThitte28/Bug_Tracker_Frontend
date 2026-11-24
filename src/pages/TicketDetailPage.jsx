import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { TypeBadge, StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { useAuth } from '../context/useAuth';

import {
  getTicketByIdApi,
  updateTicketApi,
  deleteTicketApi,
  getTicketAttachmentApi,
  uploadTicketAttachmentApi,
} from '../api/tickets';
import { getProjectsApi, getProjectMembersApi } from '../api/projects';
import { getCommentsApi, createCommentApi } from '../api/comments';
import { formatApiError } from '../api/axios';

// Turns an API error into a readable message, with explicit 403 / 404 handling.
function describeActionError(err, action) {
  const base = formatApiError(err);
  const httpStatus = err?.response?.status;
  if (httpStatus === 403) {
    return `You do not have permission to ${action} this ticket. (${base})`;
  }
  if (httpStatus === 404) {
    return `This ticket no longer exists. (${base})`;
  }
  return base;
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editMembers, setEditMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('Bug');
  const [editStatus, setEditStatus] = useState('To Do');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Main comment form state
  const [newCommentBody, setNewCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // Reply form state
  const [activeReplyParentId, setActiveReplyParentId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);

  // Attachment state
  const [attachmentBlobUrl, setAttachmentBlobUrl] = useState(null);
  const [loadingAttachment, setLoadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentUploadError, setAttachmentUploadError] = useState(null);
  const [attachmentUploadSuccess, setAttachmentUploadSuccess] = useState(null);

  const isViewer = user?.role === 'Viewer';

  useEffect(() => {
    let isMounted = true;

    async function fetchTicketAndComments() {
      try {
        setLoading(true);
        setError(null);

        const [ticketData, commentsData, projectsData] = await Promise.all([
          getTicketByIdApi(id),
          getCommentsApi(id),
          getProjectsApi().catch(() => []),
        ]);

        if (isMounted) {
          setTicket(ticketData);
          setComments(commentsData);
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

    if (id) {
      fetchTicketAndComments();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketData, commentsData, projectsData] = await Promise.all([
        getTicketByIdApi(id),
        getCommentsApi(id),
        getProjectsApi().catch(() => []),
      ]);
      setTicket(ticketData);
      setComments(commentsData);
      setProjects(projectsData);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newCommentBody.trim() || isViewer) return;

    try {
      setSubmittingComment(true);
      setCommentError(null);

      await createCommentApi(id, {
        body: newCommentBody.trim(),
        parent_id: null,
      });

      // Reload fresh comments list
      const updatedComments = await getCommentsApi(id);
      setComments(updatedComments);
      setNewCommentBody('');
    } catch (err) {
      setCommentError(formatApiError(err));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreateReply = async (parentId) => {
    if (!replyBody.trim() || isViewer) return;

    try {
      setSubmittingReply(true);
      setReplyError(null);

      await createCommentApi(id, {
        body: replyBody.trim(),
        parent_id: parentId,
      });

      // Reload fresh comments list
      const updatedComments = await getCommentsApi(id);
      setComments(updatedComments);
      setReplyBody('');
      setActiveReplyParentId(null);
    } catch (err) {
      setReplyError(formatApiError(err));
    } finally {
      setSubmittingReply(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Attachment Preview & Upload
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    async function fetchAttachmentBlob() {
      if (!ticket?.attachment_url || !id) {
        setAttachmentBlobUrl(null);
        setAttachmentError(null);
        return;
      }

      try {
        setLoadingAttachment(true);
        setAttachmentError(null);
        const blob = await getTicketAttachmentApi(id);
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setAttachmentBlobUrl(objectUrl);
        }
      } catch (err) {
        if (isMounted) {
          setAttachmentError(formatApiError(err) || 'Failed to load screenshot attachment.');
        }
      } finally {
        if (isMounted) {
          setLoadingAttachment(false);
        }
      }
    }

    fetchAttachmentBlob();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, ticket?.attachment_url]);

  const canUploadAttachment =
    Boolean(ticket && user) &&
    !isViewer &&
    (user.role === 'Admin' || user.role === 'Developer');

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentUploadError(null);
    setAttachmentUploadSuccess(null);

    // Validate size (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setAttachmentUploadError('File size exceeds the 5 MB limit. Please select a smaller image.');
      e.target.value = '';
      return;
    }
    if (file.size === 0) {
      setAttachmentUploadError('Selected file is empty.');
      e.target.value = '';
      return;
    }

    // Validate format (PNG, JPG, JPEG, WEBP)
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const validMimes = ['image/png', 'image/jpeg', 'image/webp'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    const hasValidMime = validMimes.includes(file.type);

    if (!hasValidExt || !hasValidMime) {
      setAttachmentUploadError('Invalid image format. Allowed formats: PNG, JPG, JPEG, and WEBP.');
      e.target.value = '';
      return;
    }

    try {
      setUploadingAttachment(true);
      const updatedTicket = await uploadTicketAttachmentApi(id, file);
      setTicket(updatedTicket);
      setAttachmentUploadSuccess('Screenshot attachment uploaded successfully!');
    } catch (err) {
      setAttachmentUploadError(describeActionError(err, 'upload attachment for'));
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // Edit / Delete authorization (mirrors backend rules; the server is the final
  // authority and still returns 403 if a request is not permitted).
  //  - Edit:   any non-Viewer user (backend additionally requires project access,
  //            which is already proven because this ticket was loaded via GET).
  //  - Delete: non-Viewer AND (Admin OR project owner OR ticket creator).
  // ---------------------------------------------------------------------------
  const ticketProject = ticket ? projects.find((p) => p.id === ticket.project_id) : null;
  const canEdit = Boolean(ticket) && !isViewer;
  const canDelete =
    Boolean(ticket && user) &&
    !isViewer &&
    (user.role === 'Admin' ||
      ticketProject?.owner_id === user.id ||
      ticket.created_by === user.id);

  const handleStartEdit = async () => {
    if (!ticket || isViewer) return;

    setEditTitle(ticket.title);
    setEditDescription(ticket.description || '');
    setEditType(ticket.type);
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditAssigneeId(ticket.assignee_id ? String(ticket.assignee_id) : '');
    setEditError(null);
    setSuccessMessage(null);
    setIsEditing(true);

    setEditMembers([]);
    setLoadingMembers(true);
    try {
      const data = await getProjectMembersApi(ticket.project_id);
      // Only active members can be assigned (backend rule)
      setEditMembers(data.filter((m) => m.is_active));
    } catch {
      setEditMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!ticket || isViewer || saving) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError('Ticket title is required.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setEditError('Ticket title cannot exceed 200 characters.');
      return;
    }

    // Build a partial payload containing ONLY changed fields.
    // project_id / created_by are never sent. An unchanged assignee is never sent
    // (the existing assignee may no longer be an active project member).
    const payload = {};
    if (trimmedTitle !== ticket.title) {
      payload.title = trimmedTitle;
    }
    const newDescription = editDescription.trim() ? editDescription.trim() : null;
    if (newDescription !== (ticket.description ?? null)) {
      payload.description = newDescription;
    }
    if (editType !== ticket.type) {
      payload.type = editType;
    }
    if (editStatus !== ticket.status) {
      payload.status = editStatus;
    }
    if (editPriority !== ticket.priority) {
      payload.priority = editPriority;
    }
    const newAssignee = editAssigneeId ? Number(editAssigneeId) : null;
    if (newAssignee !== (ticket.assignee_id ?? null)) {
      payload.assignee_id = newAssignee;
    }

    if (Object.keys(payload).length === 0) {
      setEditError('No changes to save.');
      return;
    }

    try {
      setSaving(true);
      setEditError(null);
      const updated = await updateTicketApi(ticket.id, payload);
      setTicket(updated);
      try {
        // Refresh ticket details from the server (falls back to the PUT response)
        setTicket(await getTicketByIdApi(id));
      } catch {
        // keep the updated ticket returned by the PUT request
      }
      setSuccessMessage('Ticket updated successfully.');
      setIsEditing(false);
    } catch (err) {
      // Keep the form open so the user does not lose entered data
      setEditError(describeActionError(err, 'update'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!ticket || !canDelete || deleting) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteTicketApi(ticket.id);
      navigate('/tickets');
    } catch (err) {
      setDeleteError(describeActionError(err, 'delete'));
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Calculate total comments including replies
  const totalCommentsCount = comments.reduce(
    (acc, curr) => acc + 1 + (curr.replies?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link to="/dashboard" className="hover:text-blue-600 transition">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/tickets" className="hover:text-blue-600 transition">
              Tickets
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">#{id}</span>
          </div>

          <Link
            to="/tickets"
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs"
          >
            ← Back to Tickets
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm font-medium text-slate-700">Loading ticket details...</p>
            <p className="mt-1 text-xs text-slate-400">Fetching ticket and threaded discussion</p>
          </div>
        )}

        {/* Global Error Banner */}
        {error && !loading && (
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

        {/* Content: Ticket Details + Comments */}
        {!loading && ticket && (
          <div className="space-y-6">
            {/* Update success message */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-start justify-between">
                <span>{successMessage}</span>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="text-xs font-bold ml-4 cursor-pointer"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Edit Ticket Form */}
            {isEditing && canEdit && (
              <form
                onSubmit={handleSaveEdit}
                className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 sm:p-8 space-y-5"
              >
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Edit Ticket #{ticket.id}</h2>

                {editError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <span className="font-semibold">Error: </span>
                    {editError}
                  </div>
                )}

                <div>
                  <label htmlFor="edit-title" className="block text-sm font-semibold text-slate-800">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    maxLength={200}
                    disabled={saving}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-semibold text-slate-800">
                    Description <span className="text-xs font-normal text-slate-500">(clear to remove)</span>
                  </label>
                  <textarea
                    id="edit-description"
                    rows={4}
                    disabled={saving}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="edit-assignee" className="block text-sm font-semibold text-slate-800">
                      Assignee
                    </label>
                    <select
                      id="edit-assignee"
                      disabled={saving || loadingMembers}
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                      className="mt-1.5 block w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 disabled:bg-slate-50"
                    >
                      <option value="">Unassigned</option>
                      {/* Keep the current assignee selectable/visible even if no longer an active member */}
                      {ticket.assignee_id &&
                        !editMembers.some((m) => m.id === ticket.assignee_id) && (
                          <option value={String(ticket.assignee_id)}>
                            User #{ticket.assignee_id} (current)
                          </option>
                        )}
                      {editMembers.map((member) => (
                        <option key={member.id} value={String(member.id)}>
                          {member.username} ({member.role})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">
                      {loadingMembers
                        ? 'Loading project members...'
                        : 'Only active members of this project can be assigned'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="edit-type" className="block text-sm font-semibold text-slate-800">
                        Type
                      </label>
                      <select
                        id="edit-type"
                        disabled={saving}
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="mt-1.5 block w-full px-2.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      >
                        <option value="Bug">Bug</option>
                        <option value="Task">Task</option>
                        <option value="Feature">Feature</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-semibold text-slate-800">
                        Status
                      </label>
                      <select
                        id="edit-status"
                        disabled={saving}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="mt-1.5 block w-full px-2.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-priority" className="block text-sm font-semibold text-slate-800">
                        Priority
                      </label>
                      <select
                        id="edit-priority"
                        disabled={saving}
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="mt-1.5 block w-full px-2.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 transition cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Ticket Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-sm font-bold text-slate-500">
                      #{ticket.id}
                    </span>
                    <TypeBadge type={ticket.type} />
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                    {ticket.title}
                  </h1>
                </div>

                <div className="text-xs text-slate-400 shrink-0 sm:text-right">
                  <div>Project #{ticket.project_id}</div>
                  <div className="mt-1">Created {formatDate(ticket.created_at)}</div>
                  {(canEdit || canDelete) && (
                    <div className="mt-3 flex items-center gap-2 sm:justify-end">
                      {canEdit && !isEditing && (
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setShowDeleteConfirm(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Description
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[72px]">
                  {ticket.description || (
                    <span className="text-slate-400 italic">No description provided for this ticket.</span>
                  )}
                </div>
              </div>

              {/* Screenshot Attachment */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Screenshot Attachment
                    </h3>
                    {ticket.attachment_url && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Attached
                      </span>
                    )}
                  </div>

                  {canUploadAttachment && (
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="screenshot-upload-input"
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${uploadingAttachment
                            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                            : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                      >
                        {uploadingAttachment ? (
                          <>
                            <svg
                              className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                            Uploading...
                          </>
                        ) : ticket.attachment_url ? (
                          'Replace Screenshot'
                        ) : (
                          '+ Upload Screenshot'
                        )}
                      </label>
                      <input
                        id="screenshot-upload-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                        disabled={uploadingAttachment}
                        onChange={handleAttachmentUpload}
                        className="sr-only"
                      />
                    </div>
                  )}
                </div>

                {/* Upload Success Alert */}
                {attachmentUploadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                    <span>{attachmentUploadSuccess}</span>
                    <button
                      type="button"
                      onClick={() => setAttachmentUploadSuccess(null)}
                      className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Upload Error Alert */}
                {attachmentUploadError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                    <span>{attachmentUploadError}</span>
                    <button
                      type="button"
                      onClick={() => setAttachmentUploadError(null)}
                      className="text-red-600 hover:text-red-800 font-bold ml-2 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Attachment Preview Box */}
                {loadingAttachment ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-medium">Loading secure attachment preview...</p>
                  </div>
                ) : attachmentError ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700">
                    <span>{attachmentError}</span>
                  </div>
                ) : attachmentBlobUrl ? (
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 inline-block max-w-full">
                      <img
                        src={attachmentBlobUrl}
                        alt="Ticket Screenshot"
                        className="max-h-80 w-auto rounded-lg object-contain shadow-xs hover:shadow-md transition"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <a
                        href={attachmentBlobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Open Full Size
                      </a>
                      <span className="text-slate-300">•</span>
                      <a
                        href={attachmentBlobUrl}
                        download={`ticket-${ticket.id}-screenshot`}
                        className="font-semibold text-slate-600 hover:text-slate-800 hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 italic">
                    No screenshot attached to this ticket.
                    {canUploadAttachment && ' Supported formats: PNG, JPG, JPEG, WEBP (up to 5 MB).'}
                  </div>
                )}
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Assignee</span>
                  <span className="font-semibold text-slate-800">
                    {ticket.assignee_id ? `User #${ticket.assignee_id}` : 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Reported By</span>
                  <span className="font-semibold text-slate-800">User #{ticket.created_by}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Last Updated</span>
                  <span className="font-semibold text-slate-800">{formatDate(ticket.updated_at)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Project</span>
                  <span className="font-semibold text-slate-800">Project #{ticket.project_id}</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Comments & Activity
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {totalCommentsCount}
                  </span>
                </div>
              </div>

              {/* Viewer Role Notice */}
              {isViewer && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center space-x-2">
                  <span className="font-bold">ℹ Note:</span>
                  <span>
                    You are logged in as a <strong>Viewer</strong>. You can read comments, but posting comments and replying is disabled.
                  </span>
                </div>
              )}

              {/* Comments Thread List */}
              {comments.length === 0 ? (
                <div className="p-10 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-sm font-medium text-slate-600">No comments yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isViewer
                      ? 'No comments have been posted to this ticket yet.'
                      : 'Start the conversation using the comment form below.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-slate-200/90 p-4 sm:p-5 bg-white shadow-xs space-y-3"
                    >
                      {/* Top-level comment header */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs uppercase">
                            {comment.author?.username?.slice(0, 2) || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">
                              {comment.author?.username || `User #${comment.author_id}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-slate-400">{formatDate(comment.created_at)}</span>
                      </div>

                      {/* Top-level comment body */}
                      <div className="text-sm text-slate-800 whitespace-pre-wrap pl-9 leading-relaxed">
                        {comment.body}
                      </div>

                      {/* Reply button action (hidden for Viewers) */}
                      {!isViewer && (
                        <div className="pl-9 pt-1">
                          {activeReplyParentId === comment.id ? (
                            <button
                              onClick={() => {
                                setActiveReplyParentId(null);
                                setReplyBody('');
                                setReplyError(null);
                              }}
                              className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              ✕ Cancel Reply
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveReplyParentId(comment.id);
                                setReplyBody('');
                                setReplyError(null);
                              }}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer inline-flex items-center space-x-1"
                            >
                              <span>↩</span>
                              <span>Reply</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Inline Reply Form under top-level comment */}
                      {!isViewer && activeReplyParentId === comment.id && (
                        <div className="ml-9 mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <label className="block text-xs font-semibold text-slate-700">
                            Replying to {comment.author?.username || 'comment'}:
                          </label>
                          <textarea
                            rows={3}
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Write your reply..."
                            disabled={submittingReply}
                            className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                          {replyError && (
                            <p className="text-xs text-red-600 font-medium">{replyError}</p>
                          )}
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleCreateReply(comment.id)}
                              disabled={submittingReply || !replyBody.trim()}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                              {submittingReply ? 'Posting...' : 'Post Reply'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReplyParentId(null);
                                setReplyBody('');
                                setReplyError(null);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Threaded Replies (one-level deep) */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-6 sm:ml-9 mt-3 pl-4 border-l-2 border-slate-200 space-y-3">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] uppercase">
                                    {reply.author?.username?.slice(0, 2) || 'U'}
                                  </div>
                                  <span className="font-semibold text-slate-900">
                                    {reply.author?.username || `User #${reply.author_id}`}
                                  </span>
                                  <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded">
                                    Reply
                                  </span>
                                </div>
                                <span className="text-slate-400 text-[11px]">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap pl-7 leading-relaxed">
                                {reply.body}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Main New Comment Form */}
              {!isViewer && (
                <form onSubmit={handleCreateComment} className="pt-4 border-t border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Add a Comment
                  </h3>
                  <textarea
                    rows={4}
                    value={newCommentBody}
                    onChange={(e) => setNewCommentBody(e.target.value)}
                    placeholder="Type your comment here..."
                    disabled={submittingComment}
                    className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                  {commentError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                      {commentError}
                    </div>
                  )}
                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !newCommentBody.trim()}
                      className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && ticket && canDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
              <h2 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
                Delete ticket #{ticket.id}?
              </h2>
              <p className="text-sm text-slate-700">
                You are about to permanently delete <strong>{ticket.title}</strong>.
              </p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Warning:</strong> deleting this ticket also deletes all of its comments
                and replies. This action cannot be undone.
              </div>

              {deleteError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-sm disabled:opacity-50 transition cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Delete Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

