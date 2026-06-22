'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import { Mail, CheckCircle, Clock, Search, Trash2 } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  aiScreeningPassed: boolean;
  createdAt: string;
}

export default function AdminInboxPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await apiRequest<{ data: ContactMessage[] }>({ method: 'GET', path: '/api/admin/inbox' });
      setMessages(res.data);
    } catch (err) {
      toast.error('Failed to load inbox messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkAsRead = async (id: string, currentStatus: boolean) => {
    try {
      await apiRequest({ method: 'PATCH', path: `/api/admin/inbox/${id}`, body: { isRead: !currentStatus } });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, isRead: !currentStatus } : msg))
      );
      toast.success('Message status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await apiRequest({ method: 'DELETE', path: `/api/admin/inbox/${id}` });
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#05050a]">
        <div className="w-8 h-8 border-4 border-[#6c5ce7] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(108,92,231,0.25)] pb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6 text-[#6c5ce7]" />
              Secure Inbox
            </h1>
            <p className="text-sm text-[#8a99ad] mt-1">
              Manage secure support inquiries and contact requests.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[#0c0f1d] px-4 py-2 rounded-lg border border-[rgba(108,92,231,0.25)]">
            <Search className="w-4 h-4 text-[#8a99ad]" />
            <input
              type="text"
              placeholder="Search messages..."
              className="bg-transparent border-none outline-none text-sm w-48 text-white placeholder-[#8a99ad]"
            />
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Mail className="w-12 h-12 text-[#8a99ad]/50 mb-4" />
            <h3 className="text-lg font-medium text-white">No messages yet</h3>
            <p className="text-sm text-[#8a99ad]">Your secure inbox is currently empty.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-[#0c0f1d] border rounded-xl p-5 transition-all ${msg.isRead ? 'border-[rgba(255,255,255,0.1)] opacity-75' : 'border-[#6c5ce7]/50 shadow-[0_0_15px_rgba(108,92,231,0.15)]'
                  }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-lg">{msg.name}</span>
                      <span className="text-sm text-[#8a99ad] bg-[rgba(15,23,42,0.6)] px-2 py-1 rounded-md border border-[rgba(255,255,255,0.05)]">
                        {msg.email}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#8a99ad]">
                        <Clock className="w-3 h-3" />
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                      {msg.aiScreeningPassed && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full font-medium">
                          AI Verified
                        </span>
                      )}
                    </div>
                    <div className="p-4 bg-[rgba(15,23,42,0.6)] rounded-lg border border-[rgba(255,255,255,0.05)] text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 pt-2 md:pt-0">
                    <button
                      onClick={() => handleMarkAsRead(msg.id, msg.isRead)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${msg.isRead
                          ? 'bg-[rgba(255,255,255,0.05)] text-[#8a99ad] border-[rgba(255,255,255,0.1)] hover:text-white'
                          : 'bg-[#6c5ce7]/10 text-[#6c5ce7] border-[#6c5ce7]/20 hover:bg-[#6c5ce7]/20'
                        }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {msg.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
