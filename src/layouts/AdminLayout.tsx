import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NotificationDropdown } from '../components/notifications/NotificationDropdown';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { 
  MessageSquare, LayoutDashboard, Users, UserCheck, Briefcase, 
  Package, Tags, ShoppingCart, CreditCard, 
  Wallet, ArrowRightLeft, Ticket, HeadphonesIcon, 
  Bell, FileBarChart, Shield, Settings, LogOut, 
  Menu, X, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const navItems = [
  { name: 'অ্যাডমিন ড্যাশবোর্ড', path: '/admin', icon: LayoutDashboard },
  { name: 'অ্যানালিটিক্স', path: '/admin/analytics', icon: FileBarChart },
  { name: 'ব্যবহারকারী', path: '/admin/users', icon: Users },
  { name: 'Google Services', path: '/admin/google', icon: Briefcase },
  { name: 'হোলসেল আবেদন', path: '/admin/wholesale', icon: Briefcase },
  { name: 'সেবাসমূহ পরিচালনা', path: '/admin/services', icon: Package },
  { name: 'ক্যাটাগরি পরিচালনা', path: '/admin/categories', icon: Tags },
  { name: 'অর্ডার ম্যানেজমেন্ট', path: '/admin/orders', icon: ShoppingCart },
  { name: 'পেমেন্ট ম্যানেজমেন্ট', path: '/admin/payments', icon: CreditCard },
  { name: 'পেমেন্ট মেথডস', path: '/admin/payment-methods', icon: Settings },
  { name: 'রিকনসিলিয়েশন', path: '/admin/reconciliation', icon: FileBarChart },
  { name: 'ওয়ালেট পরিচালনা', path: '/admin/wallets', icon: Wallet },
  { name: 'ট্রানজেকশন', path: '/admin/transactions', icon: ArrowRightLeft },
  { name: 'সাপোর্ট ম্যানেজমেন্ট', path: '/admin/support', icon: HeadphonesIcon },
  { name: 'সরাসরি চ্যাট', path: '/admin/messages', icon: MessageSquare },
  { name: 'নোটিশ বোর্ড', path: '/admin/announcements', icon: Bell },
  { name: 'ওয়েবসাইট সেটিংস', path: '/admin/footer', icon: Settings },
  { name: 'সার্ভিস এনালাইসিস', path: '/admin/stats', icon: FileBarChart },
];

export default function AdminLayout() {
  const { unreadCount, fetchUnreadCount, subscribeToMessages } = useChatStore();
  const { user } = useAuthStore();

  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  React.useEffect(() => {
    if (user && profile) {
      fetchUnreadCount(user.id, profile.role);
      subscribeToMessages(user.id, profile.role);
    }
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast.success('সফলভাবে লগআউট হয়েছে');
    } catch (error) {
      toast.error('লগআউট করতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gray-900 text-gray-300 transition-transform duration-200 ease-in-out
        flex flex-col shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-20 flex items-center justify-between px-6 bg-gray-950 border-b-4 border-primary">
          <Link to="/admin" className="flex items-center space-x-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Government_Seal_of_Bangladesh.svg" alt="BD Gov Logo" className="w-8 h-8 opacity-90" />
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm tracking-tight leading-tight">ডিজিটাল সেবা</span>
              <span className="text-xs text-primary">অ্যাডমিন প্যানেল</span>
            </div>
          </Link>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  flex items-center px-3 py-2.5 rounded-sm text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'hover:bg-gray-800 hover:text-white'}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 bg-gray-950">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold border border-white/20">
              {profile?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-primary truncate capitalize">সিস্টেম অ্যাডমিন</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-sm transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            লগআউট করুন
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input 
                type="text" 
                placeholder="খুঁজুন..." 
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
