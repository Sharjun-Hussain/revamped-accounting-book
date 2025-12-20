'use client';

import { useState } from 'react';
import useSWR from 'swr';
import AuditLogTable from '@/components/audit-logs/AuditLogTable';
import AuditLogFilters from '@/components/audit-logs/AuditLogFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AuditLogsPage() {
    const [filters, setFilters] = useState({
        entityType: '',
        action: '',
        userId: '',
        search: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 50,
    });

    // Build query string from filters
    const buildQueryString = () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.append(key, value);
            }
        });
        return params.toString();
    };

    const queryString = buildQueryString();
    const { data, error, isLoading, mutate } = useSWR(
        `/api/audit-logs?${queryString}`,
        fetcher
    );

    const handleFilterChange = (newFilters) => {
        setFilters({ ...filters, ...newFilters, page: 1 });
    };

    const handlePageChange = (newPage) => {
        setFilters({ ...filters, page: newPage });
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground mt-2">
                    Track all changes and activities in the system
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>
                        Filter audit logs by entity type, action, user, or date range
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AuditLogFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>
                        {data?.pagination?.total || 0} total entries
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AuditLogTable
                        data={data?.data || []}
                        isLoading={isLoading}
                        error={error}
                        pagination={data?.pagination}
                        onPageChange={handlePageChange}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
