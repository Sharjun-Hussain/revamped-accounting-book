'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

function ChangesDiff({ changes }) {
    if (!changes) return null;

    // Handle DELETE action - show full entity data
    if (changes.deleted) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Deleted Entity Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(changes.deleted, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        );
    }

    // Handle UPDATE action - show before/after
    if (changes.before && changes.after) {
        const changedFields = Object.keys(changes.after);

        if (changedFields.length === 0) {
            return <div className="text-sm text-muted-foreground">No changes recorded</div>;
        }

        return (
            <div className="space-y-4">
                {changedFields.map((field) => (
                    <Card key={field}>
                        <CardHeader>
                            <CardTitle className="text-sm font-mono">{field}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                                    Before:
                                </div>
                                <div className="text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900">
                                    {typeof changes.before[field] === 'object'
                                        ? JSON.stringify(changes.before[field], null, 2)
                                        : String(changes.before[field] ?? 'null')}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                                    After:
                                </div>
                                <div className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-900">
                                    {typeof changes.after[field] === 'object'
                                        ? JSON.stringify(changes.after[field], null, 2)
                                        : String(changes.after[field] ?? 'null')}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Fallback for any other format
    return (
        <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
            {JSON.stringify(changes, null, 2)}
        </pre>
    );
}

export default function AuditLogDetails({ log }) {
    return (
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-sm font-semibold text-muted-foreground">Timestamp</div>
                    <div className="text-sm font-mono">
                        {format(new Date(log.timestamp), 'PPpp')}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-semibold text-muted-foreground">Action</div>
                    <Badge
                        variant="outline"
                        className={getActionBadgeColor(log.action)}
                    >
                        {log.action}
                    </Badge>
                </div>
                <div>
                    <div className="text-sm font-semibold text-muted-foreground">Entity Type</div>
                    <div className="text-sm">{log.entityType}</div>
                </div>
                <div>
                    <div className="text-sm font-semibold text-muted-foreground">Entity ID</div>
                    <div className="text-sm font-mono">{log.entityId}</div>
                </div>
                {log.entityName && (
                    <div>
                        <div className="text-sm font-semibold text-muted-foreground">
                            Entity Name
                        </div>
                        <div className="text-sm font-medium">{log.entityName}</div>
                    </div>
                )}
                <div>
                    <div className="text-sm font-semibold text-muted-foreground">User</div>
                    <div className="text-sm">{log.userName || 'System'}</div>
                </div>
                {log.userId && (
                    <div>
                        <div className="text-sm font-semibold text-muted-foreground">User ID</div>
                        <div className="text-sm font-mono">{log.userId}</div>
                    </div>
                )}
                {log.ipAddress && (
                    <div>
                        <div className="text-sm font-semibold text-muted-foreground">
                            IP Address
                        </div>
                        <div className="text-sm font-mono">{log.ipAddress}</div>
                    </div>
                )}
            </div>

            {/* Changes Section */}
            {log.changes && (
                <>
                    <Separator />
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Changes</h3>
                        <ChangesDiff changes={log.changes} />
                    </div>
                </>
            )}

            {/* User Agent */}
            {log.userAgent && (
                <>
                    <Separator />
                    <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-2">
                            User Agent
                        </div>
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                            {log.userAgent}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
