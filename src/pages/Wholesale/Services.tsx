import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { DynamicIcon } from '../../components/DynamicIcon';
import { Search, ChevronRight, Clock, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export function WholesaleServices() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        supabase
          .from('services')
          .select('*, service_categories(name, slug)')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="animate-pulse h-96 bg-white rounded-2xl"></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Wholesale Services</h1>
        <p className="text-slate-500 mt-1">Access B2B pricing and place bulk orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search services..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all sm:w-48"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => {
          const savings = service.retail_price - service.wholesale_price;
          const savingsPercent = Math.round((savings / service.retail_price) * 100);

          return (
            <div key={service.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative">
              
              {savingsPercent > 0 && (
                <div className="absolute top-4 right-4 z-10 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  Save {savingsPercent}%
                </div>
              )}

              <div className="h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                {service.thumbnail_url ? (
                  <img src={service.thumbnail_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">No image</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-semibold text-slate-700 shadow-sm border border-white/20">
                  {service.service_categories?.name}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight flex items-start gap-2">{service.icon && <DynamicIcon name={service.icon} className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}<span>{service.name}</span></h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                  {service.description}
                </p>
                
                <div className="flex flex-col gap-3 mb-5 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Retail Price</span>
                    <span className="text-slate-400 line-through">৳{service.retail_price}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-emerald-800 font-medium text-sm">
                      <Tag className="w-4 h-4 mr-1.5" />
                      Wholesale Price
                    </div>
                    <span className="text-xl font-bold text-emerald-700">
                      ৳{service.wholesale_price}
                    </span>
                  </div>
                  {savings > 0 && (
                    <div className="pt-2 mt-1 border-t border-emerald-100 flex items-center justify-between text-xs font-medium text-emerald-600">
                      <span>Your Profit Margin</span>
                      <span>৳{savings} per unit</span>
                    </div>
                  )}
                </div>
                
                <Link 
                  to={`/wholesale/services/${service.slug}`} 
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors mt-auto shadow-sm"
                >
                  Configure Bulk Order
                  <ChevronRight className="w-4 h-4 ml-1.5 opacity-70" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
