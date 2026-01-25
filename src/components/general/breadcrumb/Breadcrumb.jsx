"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Search, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useZoom } from "@/context/ZoomContext";
import { QuickActions } from "@/components/general/QuickActions";

export function SystemBreadcrumb() {
  const pathname = usePathname();
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const { zoomLevel, zoomIn, zoomOut, resetZoom } = useZoom();

  // Format segment names to be more readable
  const formatSegmentName = (segment) => {
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    // Don't render breadcrumb if we're only on home or app page
    if (pathname === "/" || pathname === "/pos") {
      setBreadcrumbItems([]);
      return;
    }

    const pathSegments = pathname
      .split("/")
      .filter((segment) => segment !== "" && segment !== "pos");

    if (pathSegments.length === 0) {
      setBreadcrumbItems([]);
      return;
    }

    const items = [];

    // Add Home breadcrumb
    items.push(
      <BreadcrumbItem key="home">
        <BreadcrumbLink asChild>
          <Link href="/">Home</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );

    // Add separator if there are additional segments
    if (pathSegments.length > 0) {
      items.push(<BreadcrumbSeparator key="sep-home" />);
    }

    // Generate breadcrumb items
    pathSegments.forEach((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      const isLast = index === pathSegments.length - 1;
      const formattedName = formatSegmentName(segment);

      // Add the breadcrumb item
      items.push(
        <BreadcrumbItem key={href}>
          {!isLast ? (
            <BreadcrumbLink asChild>
              <Link href={href}>{formattedName}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{formattedName}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      );

      // Add separator if not the last item
      if (!isLast) {
        items.push(<BreadcrumbSeparator key={`sep-${href}`} />);
      }
    });

    setBreadcrumbItems(items);
  }, [pathname]);

  // Quick Actions Component - Now imported


  // Zoom Controls Component
  const ZoomControls = () => (
    <div className="flex items-center gap-1 ml-2 border-l pl-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={zoomOut}
        disabled={zoomLevel <= 50}
        title="Zoom Out"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs font-mono min-w-[3rem]"
        onClick={resetZoom}
        title="Reset Zoom"
      >
        {zoomLevel}%
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={zoomIn}
        disabled={zoomLevel >= 150}
        title="Zoom In"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // Don't render anything if no breadcrumb items
  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <div className="flex py-2 items-center justify-between w-full">
        <div className="flex gap-3 items-center">
          <SidebarTrigger />
          <BreadcrumbList>{breadcrumbItems}</BreadcrumbList>
        </div>
        
        <div className="flex items-center gap-2">
           <QuickActions className="ml-4" />
           <ZoomControls />
        </div>
      </div>
    </Breadcrumb>
  );
}
