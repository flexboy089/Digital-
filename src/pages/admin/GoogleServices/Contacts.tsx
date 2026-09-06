import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { RefreshCw, Search, Users, User, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contacts() {
  const { connectionId } = useOutletContext<{ connectionId: string }>();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [pageToken, setPageToken] = useState<string | null>(null);

  useEffect(() => {
    if (connectionId) {
      fetchContacts();
    }
  }, [connectionId]);

  const fetchContacts = async (token?: string, searchQuery?: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = new URL(window.location.origin + '/api/google/contacts');
      url.searchParams.append('connectionId', connectionId);
      if (token) url.searchParams.append('pageToken', token);
      if (searchQuery) url.searchParams.append('q', searchQuery);
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch contacts');
      
      if (token && !searchQuery) { // Search API doesn't use pageToken the same way in this basic impl
        setContacts(prev => [...prev, ...(data.contacts || [])]);
      } else {
        setContacts(data.contacts || []);
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
    fetchContacts(undefined, query);
  };

  const getPrimaryValue = (arr: any[]) => {
    if (!arr || arr.length === 0) return null;
    return arr.find(item => item.metadata?.primary)?.value || arr[0].value;
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </form>
        <button onClick={() => fetchContacts()} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg ml-2">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        {loading && contacts.length === 0 ? (
           <div className="flex-1 flex justify-center items-center"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : contacts.length === 0 ? (
           <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
             <Users className="w-12 h-12 mb-2 opacity-20" />
             <p>No contacts found</p>
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact, idx) => {
                const name = getPrimaryValue(contact.names) || contact.names?.[0]?.displayName || 'Unknown Contact';
                const email = getPrimaryValue(contact.emailAddresses);
                const phone = getPrimaryValue(contact.phoneNumbers);
                const photoUrl = contact.photos?.[0]?.url;

                return (
                  <div key={contact.resourceName || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:bg-white hover:shadow-sm transition-all">
                    {photoUrl && !photoUrl.includes('default') ? (
                      <img src={photoUrl} alt="" className="w-12 h-12 rounded-full border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 truncate">{name}</h4>
                      {email && (
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <Mail className="w-3 h-3 mr-1.5 shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <Phone className="w-3 h-3 mr-1.5 shrink-0" />
                          <span className="truncate">{phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {pageToken && !query && (
              <div className="p-4 text-center mt-4">
                <button 
                  onClick={() => fetchContacts(pageToken)} 
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
    </div>
  );
}
