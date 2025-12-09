import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useJsonBinStorage, useJsonBinManager } from '@/hooks/useJsonBinStorage';
import { Loader2, Save, Download, Trash2, RefreshCw, Plus, Folder } from 'lucide-react';

interface DemoData {
  title: string;
  description: string;
  items: string[];
  lastUpdated: string;
}

export function JsonBinDemo() {
  const [newItem, setNewItem] = useState('');
  const [binName, setBinName] = useState('pitbulls-demo-data');
  
  const {
    data,
    binId,
    loading,
    error,
    save,
    load,
    create,
    remove,
    listBins,
    reset
  } = useJsonBinStorage<DemoData>({
    defaultData: {
      title: 'Sample Data',
      description: 'This is a sample JSON file stored on JSONBin.io',
      items: ['Item 1', 'Item 2', 'Item 3'],
      lastUpdated: new Date().toISOString()
    }
  });

  const { bins, loading: binsLoading, refresh } = useJsonBinManager();

  const handleCreate = async () => {
    const newBinId = await create(data || {
      title: 'Sample Data',
      description: 'This is a sample JSON file stored on JSONBin.io',
      items: ['Item 1', 'Item 2', 'Item 3'],
      lastUpdated: new Date().toISOString()
    }, binName);
    
    if (newBinId) {
      console.log('Created bin:', newBinId);
    }
  };

  const handleSave = async () => {
    if (data) {
      const updatedData = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      await save(updatedData);
    }
  };

  const handleLoadFromBin = async (targetBinId: string) => {
    await load(targetBinId);
  };

  const handleAddItem = async () => {
    if (data && newItem.trim()) {
      const updatedData = {
        ...data,
        items: [...data.items, newItem.trim()],
        lastUpdated: new Date().toISOString()
      };
      await save(updatedData);
      setNewItem('');
    }
  };

  const handleRemoveItem = async (index: number) => {
    if (data) {
      const updatedData = {
        ...data,
        items: data.items.filter((_, i) => i !== index),
        lastUpdated: new Date().toISOString()
      };
      await save(updatedData);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this bin?')) {
      await remove();
      reset();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>JSONBin.io Storage Demo</CardTitle>
          <CardDescription>
            Test reading and writing JSON files using JSONBin.io service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bin Management */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="binName">Bin Name</Label>
              <Input
                id="binName"
                value={binName}
                onChange={(e) => setBinName(e.target.value)}
                placeholder="Enter bin name"
              />
            </div>
            <div className="space-y-2">
              <Label>Current Bin ID</Label>
              <div className="flex gap-2">
                <Input value={binId || 'No bin selected'} readOnly className="font-mono text-sm" />
                <Button onClick={handleCreate} disabled={loading} variant="outline">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </Button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Data Display */}
          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={data.title}
                    onChange={(e) => {
                      const updated = { ...data, title: e.target.value };
                      save(updated);
                    }}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={data.description}
                    onChange={(e) => {
                      const updated = { ...data, description: e.target.value };
                      save(updated);
                    }}
                    rows={3}
                  />
                </div>
              </div>

              {/* Items List */}
              <div>
                <Label>Items</Label>
                <div className="space-y-2 mt-2">
                  {data.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={item} readOnly className="flex-1" />
                      <Button
                        onClick={() => handleRemoveItem(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Item */}
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add new item..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                />
                <Button onClick={handleAddItem} disabled={!newItem.trim()}>
                  Add Item
                </Button>
              </div>

              {/* Last Updated */}
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(data.lastUpdated).toLocaleString()}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading || !binId}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save to JSONBin
            </Button>
            <Button onClick={() => refresh()} disabled={binsLoading} variant="outline">
              {binsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh Bins
            </Button>
            <Button onClick={handleDelete} disabled={loading || !binId} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Bin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Bins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Available Bins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bins.length === 0 ? (
            <p className="text-muted-foreground">No bins found. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {bins.map((bin) => (
                <div key={bin.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{bin.name || 'Unnamed Bin'}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {bin.id} • Created: {new Date(bin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleLoadFromBin(bin.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Load
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Create a JSONBin.io account at <a href="https://jsonbin.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">jsonbin.io</a></p>
            <p>2. Get your API key from the dashboard</p>
            <p>3. Add it to your environment variables: <code>VITE_JSONBIN_API_KEY=your_api_key_here</code></p>
            <p>4. The API key should be stored in your <code>.env</code> file (not committed to git)</p>
            <p>5. Free tier allows up to 3 bins and 1MB storage per bin</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
