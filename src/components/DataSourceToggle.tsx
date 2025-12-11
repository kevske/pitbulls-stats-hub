import React from 'react';
import { Database, Sheet } from 'lucide-react';

interface DataSourceToggleProps {
  dataSource: 'google-sheets' | 'supabase';
  onDataSourceChange: (source: 'google-sheets' | 'supabase') => void;
  disabled?: boolean;
}

const DataSourceToggle: React.FC<DataSourceToggleProps> = ({
  dataSource,
  onDataSourceChange,
  disabled = false
}) => {
  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 p-1.5 max-w-max mx-auto mb-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onDataSourceChange('google-sheets')}
          disabled={disabled}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
            dataSource === 'google-sheets'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Google Sheets Datenquelle"
        >
          <Sheet size={14} />
          Google Sheets
        </button>
        <div className="h-6 w-px bg-border"></div>
        <button
          onClick={() => onDataSourceChange('supabase')}
          disabled={disabled}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
            dataSource === 'supabase'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Supabase Datenquelle"
        >
          <Database size={14} />
          Supabase
        </button>
      </div>
    </div>
  );
};

export default DataSourceToggle;
