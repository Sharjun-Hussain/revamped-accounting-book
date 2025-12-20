'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const ENTITY_TYPES = [
    'All',
    'Member',
    'Invoice',
    'Payment',
    'Expense',
    'Income',
    'Category',
    'BankAccount',
    'Donation',
    'User',
];

const ACTIONS = ['All', 'CREATE', 'UPDATE', 'DELETE'];

export default function AuditLogFilters({ filters, onFilterChange }) {
    const handleClearFilters = () => {
        onFilterChange({
            entityType: '',
            action: '',
            userId: '',
            search: '',
            startDate: '',
            endDate: '',
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label htmlFor="entity-type">Entity Type</Label>
                <Select
                    value={filters.entityType || 'All'}
                    onValueChange={(value) =>
                        onFilterChange({
                            entityType: value === 'All' ? '' : value,
                        })
                    }
                >
                    <SelectTrigger id="entity-type">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        {ENTITY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select
                    value={filters.action || 'All'}
                    onValueChange={(value) =>
                        onFilterChange({
                            action: value === 'All' ? '' : value,
                        })
                    }
                >
                    <SelectTrigger id="action">
                        <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                        {ACTIONS.map((action) => (
                            <SelectItem key={action} value={action}>
                                {action}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                    id="search"
                    placeholder="Entity name, ID, or user..."
                    value={filters.search}
                    onChange={(e) => onFilterChange({ search: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                    id="start-date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                        onFilterChange({ startDate: e.target.value })
                    }
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                    id="end-date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => onFilterChange({ endDate: e.target.value })}
                />
            </div>

            <div className="flex items-end">
                <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="w-full"
                >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                </Button>
            </div>
        </div>
    );
}
