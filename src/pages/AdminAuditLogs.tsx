import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types/supabase';
import { AuditService } from '@/services/auditService';
import AuthGuard from '../components/AuthGuard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { useToast } from '../hooks/use-toast';
import {
  History,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search
} from 'lucide-react';

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterUser, filterTable]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      let allLogs = await AuditService.getAllAuditLogs(200);

      // Apply filters
      if (filterAction !== 'all') {
        allLogs = allLogs.filter(log => log.action === filterAction);
      }
      if (filterUser) {
        allLogs = allLogs.filter(log => log.user_email === filterUser);
      }
      if (filterTable !== 'all') {
        allLogs = allLogs.filter(log => log.table_name === filterTable);
      }
      if (searchTerm) {
        allLogs = allLogs.filter(log =>
          log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.record_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: 'Error',
        description: 'Änderungsprotokolle konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-600" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatData = (data: any) => {
    if (!data) return 'N/A';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getUniqueUsers = () => {
    const users = [...new Set(logs.map(log => log.user_email))];
    return users.sort();
  };

  const getUniqueTables = () => {
    const tables = [...new Set(logs.map(log => log.table_name))];
    return tables.sort();
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-gray-400" />
              <p>Lade Änderungsprotokolle...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Änderungsprotokolle
          </h1>
          <p className="text-gray-600">Verfolge alle Änderungen an Spielerinformationen</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">Suche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Protokolle durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="action">Aktion</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nach Aktion filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Aktionen</SelectItem>
                    <SelectItem value="CREATE">Erstellen</SelectItem>
                    <SelectItem value="UPDATE">Aktualisieren</SelectItem>
                    <SelectItem value="DELETE">Löschen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="user">Benutzer</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nach Benutzer filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Benutzer</SelectItem>
                    {getUniqueUsers().map(user => (
                      <SelectItem key={user} value={user}>{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="table">Tabelle</Label>
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nach Tabelle filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Tabellen</SelectItem>
                    {getUniqueTables().map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={loadLogs} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aktualisieren
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="grid gap-4">
          {logs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionIcon(log.action)}
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="font-medium">{log.table_name}</span>
                      <span className="text-gray-500 text-sm">ID: {log.record_id}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {log.user_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {(log.old_data || log.new_data) && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details anzeigen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {logs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Keine Protokolle gefunden</h3>
                <p className="text-gray-600">
                  Es wurden noch keine Änderungen aufgezeichnet, oder die Filter passen zu keinen Einträgen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getActionIcon(selectedLog.action)}
                    {selectedLog.action} Details
                  </span>
                  <Button variant="outline" onClick={() => setSelectedLog(null)}>
                    Schließen
                  </Button>
                </CardTitle>
                <CardDescription>
                  {selectedLog.table_name} - {selectedLog.record_id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedLog.old_data && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Vorher:</h4>
                      <ScrollArea className="h-64 w-full border rounded p-3">
                        <pre className="text-xs whitespace-pre-wrap">
                          {formatData(selectedLog.old_data)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}

                  {selectedLog.new_data && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-600">Nachher:</h4>
                      <ScrollArea className="h-64 w-full border rounded p-3">
                        <pre className="text-xs whitespace-pre-wrap">
                          {formatData(selectedLog.new_data)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Benutzer:</span> {selectedLog.user_email}
                    </div>
                    <div>
                      <span className="font-medium">Zeit:</span> {new Date(selectedLog.timestamp).toLocaleString()}
                    </div>
                    {selectedLog.ip_address && (
                      <div>
                        <span className="font-medium">IP:</span> {selectedLog.ip_address}
                      </div>
                    )}
                    {selectedLog.user_agent && (
                      <div>
                        <span className="font-medium">User Agent:</span> {selectedLog.user_agent}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

export default AdminAuditLogs;
