import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { RefreshCw, Search, Mail, Send, PenSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Gmail() {
  const { connectionId } = useOutletContext<{ connectionId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [pageToken, setPageToken] = useState<string | null>(null);
  
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (connectionId) {
      fetchEmails();
    }
  }, [connectionId]);

  const fetchEmails = async (token?: string, searchQuery?: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = new URL(window.location.origin + '/api/google/gmail/inbox');
      url.searchParams.append('connectionId', connectionId);
      if (token) url.searchParams.append('pageToken', token);
      if (searchQuery) url.searchParams.append('q', searchQuery);
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch emails');
      
      if (token) {
        setMessages(prev => [...prev, ...(data.messages || [])]);
      } else {
        setMessages(data.messages || []);
      }
      setPageToken(data.nextPageToken || null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmails(undefined, query);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Send this email?')) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/google/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ connectionId, to: composeTo, subject: composeSubject, body: composeBody })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      toast.success('Email sent successfully');
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search emails..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </form>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchEmails()} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsComposing(true)} className="gov-button inline-flex items-center text-sm py-2">
            <PenSquare className="w-4 h-4 mr-2" /> Compose
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        {loading && messages.length === 0 ? (
           <div className="flex-1 flex justify-center items-center"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : messages.length === 0 ? (
           <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
             <Mail className="w-12 h-12 mb-2 opacity-20" />
             <p>No emails found</p>
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {messages.map(msg => (
                <li key={msg.id} className={`p-4 hover:bg-slate-50 cursor-pointer ${msg.unread ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm truncate pr-4 ${msg.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {msg.from.split('<')[0].trim()}
                    </span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(msg.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`text-sm truncate mb-1 ${msg.unread ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
                    {msg.subject}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {msg.snippet}
                  </div>
                </li>
              ))}
            </ul>
            {pageToken && (
              <div className="p-4 text-center border-t border-slate-100">
                <button 
                  onClick={() => fetchEmails(pageToken, query)} 
                  disabled={loading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isComposing && (
        <div className="absolute bottom-4 right-4 w-96 bg-white rounded-t-lg rounded-b-sm shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10">
          <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-medium">New Message</span>
            <button onClick={() => setIsComposing(false)} className="text-slate-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSend} className="flex flex-col flex-1">
            <input 
              type="email" 
              required
              placeholder="To" 
              value={composeTo}
              onChange={e => setComposeTo(e.target.value)}
              className="border-b border-slate-100 px-4 py-2 text-sm focus:outline-none" 
            />
            <input 
              type="text" 
              required
              placeholder="Subject" 
              value={composeSubject}
              onChange={e => setComposeSubject(e.target.value)}
              className="border-b border-slate-100 px-4 py-2 text-sm focus:outline-none font-medium" 
            />
            <textarea 
              required
              placeholder="Message" 
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              className="flex-1 p-4 text-sm focus:outline-none resize-none h-48"
            />
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button disabled={sending} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium inline-flex items-center">
                {sending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
