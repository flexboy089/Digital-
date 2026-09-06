import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReconciliation() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data: events, error } = await supabase
        .from('payment_events')
        .select('id, event_type, provider_reference, processed, created_at, provider, payment_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const paymentsData: any[] = events || [];
      
      // Fetch associated payments manually since foreign key might not be exposed to PostgREST
      if (paymentsData.length > 0) {
        const paymentIds = paymentsData.map(e => e.payment_id).filter(Boolean);
        if (paymentIds.length > 0) {
          const { data: pData } = await supabase
            .from('payments')
            .select('id, amount, transaction_reference, status')
            .in('id', paymentIds);
            
          if (pData) {
            paymentsData.forEach(event => {
              if (event.payment_id) {
                event.payment = pData.find(p => p.id === event.payment_id);
              }
            });
          }
        }
      }
      
      setPayments(paymentsData);
    } catch (error) {
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const getReconciliationStatus = (event: any) => {
    if (event.event_type === 'REJECTED') return { label: 'Failed', color: 'bg-red-100 text-red-800' };
    if (event.event_type === 'VERIFIED') {
      if (event.payment?.status === 'verified') return { label: 'Matched', color: 'bg-emerald-100 text-emerald-800' };
      return { label: 'Mismatch', color: 'bg-amber-100 text-amber-800' };
    }
    return { label: 'Pending', color: 'bg-slate-100 text-slate-800' };
  };

  if (loading) return <div className="flex justify-center items-center h-64"><RefreshCw className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reconciliation</h1>
        <p className="text-slate-500 mt-1">Audit payment events against final wallet balances and order statuses</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Event ID</th>
                <th className="px-6 py-4 font-semibold">Payment Amount</th>
                <th className="px-6 py-4 font-semibold">Provider / Event</th>
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((event) => {
                const status = getReconciliationStatus(event);
                return (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{event.id.split('-')[0]}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">৳{event.payment?.amount || 0}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{event.provider || 'Manual'}</div>
                      <div className="text-xs text-slate-500">{event.event_type}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{event.provider_reference}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(event.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No payment events logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
