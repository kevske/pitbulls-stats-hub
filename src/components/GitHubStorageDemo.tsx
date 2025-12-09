import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGitHubStorage } from '@/hooks/useGitHubStorage';
import { Loader2, Save, Download, Trash2, RefreshCw } from 'lucide-react';

interface DemoData {
  title: string;
  description: string;
  items: string[];
  lastUpdated: string;
}

export function GitHubStorageDemo() {
  const [filename, setFilename] = useState('demo-data.json');
  const [newItem, setNewItem] = useState('');
  
  const {
    data,
    loading,
    error,
    save,
    load,
    remove,
    exists,
    reset
  } = useGitHubStorage<DemoData>(filename, {
    autoLoad: true,
    defaultData: {
      title: 'Sample Data',
      description: 'This is a sample JSON file stored on GitHub',
      items: ['Item 1', 'Item 2', 'Item 3'],
      lastUpdated: new Date().toISOString()
    }
  });

  const handleSave = async () => {
    if (data) {
      const updatedData = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      await save(updatedData, `Update ${filename} via demo`);
    }
  };

  const handleAddItem = async () => {
    if (data && newItem.trim()) {
      const updatedData = {
        ...data,
        items: [...data.items, newItem.trim()],
        lastUpdated: new Date().toISOString()
      };
      await save(updatedData, `Add item to ${filename}`);
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
      await save(updatedData, `Remove item from ${filename}`);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete ${filename}?`);
    if (confirmed) {
      await remove(`Delete ${filename} via demo`);
      reset();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>GitHub JSON Storage Demo</CardTitle>
          <CardDescription>
            Test reading and writing JSON files directly to your GitHub repository
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <div className="flex gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename (e.g., demo-data.json)"
              />
              <Button onClick={load} disabled={loading} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Load
              </Button>
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
                      save(updated, 'Update title');
                    }}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={data.description}
                    onChange={(e) => {
                      const updated = { ...data, description: e.target.value };
                      save(updated, 'Update description');
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
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save to GitHub
            </Button>
            <Button onClick={load} disabled={loading} variant="outline">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Reload from GitHub
            </Button>
            <Button onClick={handleDelete} disabled={loading} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Create a GitHub Personal Access Token with <code>repo</code> permissions</p>
            <p>2. Add it to your environment variables: <code>VITE_GITHUB_TOKEN=your_token_here</code></p>
            <p>3. The token should be stored in your <code>.env</code> file (not committed to git)</p>
            <p>4. Make sure your repository exists and you have write access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
