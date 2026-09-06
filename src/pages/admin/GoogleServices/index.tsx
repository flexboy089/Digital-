import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Mail, HardDrive, Users, Settings, Plus, RefreshCw, AlertCircle, LogOut, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GoogleServicesLayout() {
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchConnections();
    
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        toast.success('Google account connected successfully');
        fetchConnections();
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('google_connections')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) {
         if (error.code === '42P01') {
             toast.error('google_connections table does not exist. Please run migration.');
         } else {
             throw error;
         }
      } else {
          setConnections(data || []);
          if (data && data.length > 0 && !selectedConnectionId) {
            setSelectedConnectionId(data[0].id);
          }
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load Google connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/google/auth/url?token=${session.access_token}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        toast.error('Please allow popups to connect your account.');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!window.confirm('Are you sure you want to completely disconnect this account?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/google/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ connectionId: id })
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      toast.success('Account disconnected');
      if (selectedConnectionId === id) setSelectedConnectionId(null);
      fetchConnections();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke access? This will invalidate the tokens.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/google/auth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ connectionId: id })
      });
      if (!res.ok) throw new Error('Failed to revoke access');
      toast.success('Access revoked');
      fetchConnections();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const selectedConnection = connections.find(c => c.id === selectedConnectionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Google Services</h1>
          <p className="text-slate-500 mt-1">Manage connected Google accounts and APIs</p>
        </div>
        <button onClick={handleConnect} className="gov-button inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Connect Account
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Google Accounts Connected</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Connect a Google account to access Gmail, Google Drive, and Contacts directly from the admin panel.</p>
          <button onClick={handleConnect} className="gov-button">Connect Google Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Connected Accounts</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {connections.map(conn => (
                  <div 
                    key={conn.id} 
                    className={`p-4 cursor-pointer transition-colors ${selectedConnectionId === conn.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                    onClick={() => setSelectedConnectionId(conn.id)}
                  >
                    <div className="flex items-center gap-3">
                      {conn.google_avatar_url ? (
                        <img src={conn.google_avatar_url} alt="" className="w-10 h-10 rounded-full border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-slate-500 font-medium">{conn.google_email.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{conn.google_email}</p>
                        <div className="flex items-center text-xs mt-0.5">
                          {conn.status === 'connected' ? (
                            <><CheckCircle2 className="w-3 h-3 text-emerald-500 mr-1" /><span className="text-emerald-600">Connected</span></>
                          ) : conn.status === 'revoked' ? (
                            <><AlertCircle className="w-3 h-3 text-red-500 mr-1" /><span className="text-red-600">Revoked</span></>
                          ) : (
                            <><AlertCircle className="w-3 h-3 text-amber-500 mr-1" /><span className="text-amber-600">Needs Reconnect</span></>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedConnection && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <h3 className="font-semibold text-slate-900 text-sm">Account Settings</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={handleConnect} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 text-slate-400" /> Reconnect
                  </button>
                  <button onClick={() => handleRevoke(selectedConnection.id)} className="w-full text-left px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center">
                    <LogOut className="w-4 h-4 mr-2 text-amber-500" /> Revoke Access
                  </button>
                  <button onClick={() => handleDisconnect(selectedConnection.id)} className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-red-500" /> Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {selectedConnection ? (
              selectedConnection.status !== 'connected' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Connection Issue</h3>
                  <p className="text-amber-700 mb-6">This account's access token is expired, invalid, or has been revoked. Please reconnect to restore access.</p>
                  <button onClick={handleConnect} className="gov-button bg-amber-600 hover:bg-amber-700">Reconnect Account</button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                  <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
                    <Link to="/admin/google/gmail" className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${location.pathname.includes('/gmail') ? 'border-primary text-primary' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
                      <Mail className="w-4 h-4 inline-block mr-2" /> Gmail
                    </Link>
                    <Link to="/admin/google/drive" className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${location.pathname.includes('/drive') ? 'border-primary text-primary' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
                      <HardDrive className="w-4 h-4 inline-block mr-2" /> Google Drive
                    </Link>
                    <Link to="/admin/google/contacts" className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${location.pathname.includes('/contacts') ? 'border-primary text-primary' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
                      <Users className="w-4 h-4 inline-block mr-2" /> Contacts
                    </Link>
                  </div>
                  <div className="flex-1 p-0 relative bg-slate-50/50">
                    <Outlet context={{ connectionId: selectedConnectionId }} />
                  </div>
                </div>
              )
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
                <p className="text-slate-500">Select an account from the sidebar to view its services.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
