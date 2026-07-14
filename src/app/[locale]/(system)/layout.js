
'use client';
import { useSession } from 'next-auth/react';
import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DashboardLayoutSkeleton } from '../../skeletons/Dashboard-skeleton';
import { SystemBreadcrumb } from '@/components/general/breadcrumb/Breadcrumb';
import Footer from '@/components/general/Footer';

import { ZoomProvider, useZoom } from "@/context/ZoomContext";

function ZoomWrapper({ children }) {
  const { zoomLevel } = useZoom();
  return (
    <div style={{ zoom: `${zoomLevel}%` }} className="flex flex-col min-h-screen">
      {children}
    </div>
  );
}

export default function AppLayout({ children }) {

  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <DashboardLayoutSkeleton />
      </div>
    );
  }

  return (
    <ZoomProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full flex-col">
          <div className="flex flex-1">
            <div className="no-print">
              <AppSidebar variant="inset" />
            </div>
            <div className="flex-1 overflow-x-auto"> {/* Container for scrolling */}
              <SidebarInset>
                <div className='no-print fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:left-(--sidebar-width) md:peer-data-[state=collapsed]:left-0'>
                  <SystemBreadcrumb />
                </div>
                <div className="pt-14">
                  <ZoomWrapper>
                    <div className='flex-1'>
                      {children}
                    </div>
                    <div className='no-print'>
                      <Footer />
                    </div>
                  </ZoomWrapper>
                </div>
              </SidebarInset>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ZoomProvider>
  );
}