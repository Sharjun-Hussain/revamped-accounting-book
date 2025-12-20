'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import AuditLogDetails from './AuditLogDetails';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const getActionBadgeColor = (action) => {
    switch (action) {
        case 'CREATE':
            return 'bg-green-500/10 text-green-700 dark:text-green-400';
        case 'UPDATE':
            return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
        case 'DELETE':
            return 'bg-red-500/10 text-red-700 dark:text-red-400';
        default:
            return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
};

export default function AuditLogTable({
    data,
    isLoading,
    error,
    pagination,
    onPageChange,
}) {
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const handleViewDetails = (log) => {
        setSelectedLog(log);
        setDetailsOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading audit logs...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-destructive">
                    Error loading audit logs. Please try again.
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">No audit logs found.</div>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity Type</TableHead>
                            <TableHead>Entity Name</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-mono text-sm">
                                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={getActionBadgeColor(log.action)}
                                    >
                                        {log.action}
                                    </Badge>
                                </TableCell>
                                <TableCell>{log.entityType}</TableCell>
                                <TableCell className="font-medium">
                                    {log.entityName || log.entityId}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {log.userName || 'System'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewDetails(log)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} entries
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                            Detailed information about this activity
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && <AuditLogDetails log={selectedLog} />}
                </DialogContent>
            </Dialog>
        </>
    );
}
