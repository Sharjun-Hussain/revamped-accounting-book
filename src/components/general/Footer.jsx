'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Footer() {
    const { data: settings, error } = useSWR('/api/settings/app', fetcher);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay to avoid flash
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Don't show footer if showFooter is false
    if (!settings?.showFooter || error) {
        return null;
    }

    return (
        <footer
            className={`
                w-full border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60
                transition-opacity duration-300
                ${isVisible ? 'opacity-100' : 'opacity-0'}
            `}
        >
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="font-normal text-sm text-gray-800">
                            {settings.appName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            v{settings.appVersion}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-center md:text-left">
                        {settings.footerText && (
                            <span>{settings.footerText}</span>
                        )}
                        {settings.footerCopyright && (
                            <span className="hidden md:inline">|</span>
                        )}
                        {settings.footerCopyright && (
                            <span>{settings.footerCopyright}</span>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
