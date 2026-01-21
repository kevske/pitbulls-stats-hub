import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number | React.ReactNode;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, className }) => (
    <div className={`bg-accent p-4 rounded-lg text-center transition-elegant hover:bg-accent/70 ${className || ''}`}>
        <div className="text-sm text-muted-foreground mb-1">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
    </div>
);
