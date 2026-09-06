import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { RefreshCw, Search, HardDrive, FileText, FileSpreadsheet, FileIcon, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Drive() {
  const { connectionId } = useOutletContext<{ connectionId: string }>();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [pageToken, setPageToken] = useState<string | null>(null);

  useEffect(() => {
    if (connectionId) {
      fetchFiles();
    }
  }, [connectionId]);

  const fetchFiles = async (token?: string, searchQuery?: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = new URL(window.location.origin + '/api/google/drive/files');
      url.searchParams.append('connectionId', connectionId);
      if (token) url.searchParams.append('pageToken', token);
      if (searchQuery) url.searchParams.append('q', `name contains '${searchQuery}' and trashed = false`);
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch files');
      
      if (token) {
        setFiles(prev => [...prev, ...(data.files || [])]);
      } else {
        setFiles(data.files || []);
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
    fetchFiles(undefined, query);
  };

  const getFileIcon = (mimeType: string, iconLink?: string) => {
    if (iconLink) return <img src={iconLink} alt="" className="w-5 h-5" />;
    if (mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    return <FileIcon className="w-5 h-5 text-slate-400" />;
  };

  const formatSize = (bytes?: string) => {
    if (!bytes) return '--';
    const b = parseInt(bytes, 10);
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB';
    return (b / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </form>
        <button onClick={() => fetchFiles()} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg ml-2">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        {loading && files.length === 0 ? (
           <div className="flex-1 flex justify-center items-center"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : files.length === 0 ? (
           <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
             <HardDrive className="w-12 h-12 mb-2 opacity-20" />
             <p>No files found</p>
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium w-32 hidden sm:table-cell">Size</th>
                  <th className="px-4 py-3 font-medium w-48 hidden md:table-cell">Last Modified</th>
                  <th className="px-4 py-3 font-medium w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map(file => (
                  <tr key={file.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.mimeType, file.iconLink)}
                        <span className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{formatSize(file.size)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{new Date(file.modifiedTime).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {file.webViewLink && (
                        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-800 p-1">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageToken && (
              <div className="p-4 text-center border-t border-slate-100">
                <button 
                  onClick={() => fetchFiles(pageToken, query)} 
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
