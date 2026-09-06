import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Phone, Mail, FileText, CheckCircle, ArrowRight, ShieldAlert, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function WholesaleProgram() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const [benefits, setBenefits] = useState<string[]>([
    'সেবার মূল্যে বিশেষ ছাড় (Up to 40%)',
    'অগ্রাধিকার ভিত্তিতে দ্রুত সার্ভিস প্রসেসিং',
    'হোলসেল পার্টনারদের জন্য ডেডিকেটেড হেল্পডেস্ক',
    'সহজ ওয়ালেট সিস্টেম ও লেনদেনের পূর্ণাঙ্গ হিসাব'
  ]);
  const [conditions, setConditions] = useState<string>('সঠিক তথ্য প্রদান করে আবেদন করুন। কর্তৃপক্ষ যাচাই শেষে অনুমোদন প্রদান করবেন। ভুয়া তথ্যের প্রমাণ পেলে আবেদন বাতিল করা হবে।');

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: "key=eq.wholesale_content" },
        (payload) => {
          let val = (payload.new as any).value;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) {}
          }
          if (val && val.benefits) setBenefits(val.benefits);
          if (val && val.conditions) setConditions(val.conditions);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'wholesale_content')
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.value) {
        let val = data.value;
        if (typeof val === 'string') {
          try { val = JSON.parse(val); } catch (e) {}
        }
        if (val.benefits && Array.isArray(val.benefits)) setBenefits(val.benefits);
        if (val.conditions) setConditions(val.conditions);
      }
    } catch (error) {
      console.error('Failed to load wholesale settings:', error);
    }
  };

  if (profile?.role === 'wholesale') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">আপনি ইতিমধ্যে একজন হোলসেল পার্টনার</h1>
          <p className="text-gray-600 mb-8">আপনার হোলসেল স্ট্যাটাস: <span className="font-bold uppercase">{profile.wholesale_status}</span></p>
          <button onClick={() => navigate('/wholesale')} className="gov-button inline-flex items-center">
            হোলসেল পোর্টালে যান <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="gov-card p-6 border-l-4 border-l-primary">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">হোলসেল সুবিধা</h3>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 text-sm text-gray-600 flex items-start">
            <ShieldAlert className="w-5 h-5 text-gov-red mr-2 flex-shrink-0" />
            <p className="whitespace-pre-wrap">{conditions}</p>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: any) => {
    if (!user) {
      navigate('/login');
      toast.error('হোলসেল আবেদন করতে প্রথমে লগইন করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'wholesale',
          wholesale_status: 'pending',
          business_name: data.businessName,
          business_address: data.businessAddress,
          trade_license: data.tradeLicense
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('আপনার হোলসেল আবেদন সফলভাবে জমা হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'আবেদন জমা দিতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-[calc(100vh-140px)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-primary mb-4">হোলসেল পার্টনারশিপ প্রোগ্রাম</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            আপনার সাইবার ক্যাফে বা ডিজিটাল সেন্টারের সেবার মান বাড়াতে আমাদের সাথে যুক্ত হোন। আকর্ষণীয় কমিশনে ডিজিটাল সেবাসমূহ প্রদান করুন।
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="gov-card p-6 border-l-4 border-l-primary">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">হোলসেল সুবিধা</h3>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 text-sm text-gray-600 flex items-start">
              <ShieldAlert className="w-5 h-5 text-gov-red mr-2 flex-shrink-0" />
              <p className="whitespace-pre-wrap">{conditions}</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="gov-card p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">আবেদন ফর্ম</h2>
              
              {!user ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">লগইন প্রয়োজন</h3>
                  <p className="text-gray-500 mb-6">হোলসেল আবেদন করতে আপনার অ্যাকাউন্টে লগইন করুন</p>
                  <button onClick={() => navigate('/login')} className="gov-button">লগইন করুন</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">প্রতিষ্ঠানের নাম <span className="text-gov-red">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          {...register('businessName', { required: 'প্রতিষ্ঠানের নাম আবশ্যক' })}
                          className="gov-input pl-10"
                          placeholder="যেমন: মায়ের দোয়া সাইবার ক্যাফে"
                        />
                      </div>
                      {errors.businessName && <p className="mt-1 text-sm text-gov-red">{errors.businessName.message as string}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ট্রেড লাইসেন্স নম্বর (ঐচ্ছিক)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          {...register('tradeLicense')}
                          className="gov-input pl-10"
                          placeholder="ট্রেড লাইসেন্স নম্বর দিন"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">প্রতিষ্ঠানের সম্পূর্ণ ঠিকানা <span className="text-gov-red">*</span></label>
                    <textarea
                      {...register('businessAddress', { required: 'ঠিকানা আবশ্যক' })}
                      rows={3}
                      className="gov-input"
                      placeholder="বিস্তারিত ঠিকানা লিখুন (দোকান নম্বর, রাস্তা, বাজার, থানা, জেলা)"
                    ></textarea>
                    {errors.businessAddress && <p className="mt-1 text-sm text-gov-red">{errors.businessAddress.message as string}</p>}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-sm p-4 flex items-start text-sm text-blue-800">
                    <Upload className="w-5 h-5 mr-2 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="font-semibold mb-1">ডকুমেন্ট আপলোড</p>
                      <p>ভবিষ্যতে আপনার এনআইডি এবং ট্রেড লাইসেন্সের স্ক্যান কপি প্রয়োজন হতে পারে। আপাতত শুধু তথ্য দিয়ে আবেদন করুন।</p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="gov-button"
                    >
                      {isSubmitting ? 'আবেদন জমা হচ্ছে...' : 'আবেদন জমা দিন'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
