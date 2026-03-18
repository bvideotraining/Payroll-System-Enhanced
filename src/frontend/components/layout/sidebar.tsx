'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Banknote, 
  Settings, 
  X,
  Building2,
  Gift,
  FileText,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { useOrganization } from '@/src/frontend/hooks/use-organization';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
  { name: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
  { name: 'Leaves', href: '/dashboard/leaves', icon: FileText },
  { name: 'Payroll', href: '/dashboard/payroll', icon: Banknote },
  { name: 'Bonuses', href: '/dashboard/bonuses', icon: Gift },
  { name: 'Social Insurance', href: '/dashboard/social-insurance', icon: ShieldCheck },
  { name: 'Medical Insurance', href: '/dashboard/medical-insurance', icon: HeartPulse },
  { name: 'Organization', href: '/dashboard/organization', icon: Building2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { branding } = useOrganization();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80 transition-opacity" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out bg-white">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              
              {/* Mobile Sidebar content */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 bg-slate-900">
                <div className="flex h-16 shrink-0 items-center gap-3">
                  {branding.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={branding.logoUrl} alt="Logo" className="h-8 w-8 object-contain bg-white rounded" />
                  )}
                  <span className="text-xl font-bold text-white">{branding.appName}</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => {
                          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                          return (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                  group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                                  ${isActive 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800'}
                                `}
                              >
                                <item.icon
                                  className={`h-6 w-6 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-44 lg:flex-col">
        <div className="flex grow flex-col gap-y-2 overflow-y-auto border-r border-slate-800 bg-slate-900 px-3 pb-3">
          <div className="flex h-10 shrink-0 items-center gap-2">
            {branding.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoUrl} alt="Logo" className="h-5 w-5 object-contain bg-white rounded" />
            )}
            <span className="text-base font-bold text-white tracking-tight">{branding.appName}</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-3">
              <li>
                <ul role="list" className="-mx-1 space-y-0.5">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`
                            group flex gap-x-2 rounded-md p-1.5 text-[10px] leading-4 font-semibold transition-colors
                            ${isActive 
                              ? 'bg-blue-600 text-white' 
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'}
                          `}
                        >
                          <item.icon
                            className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
