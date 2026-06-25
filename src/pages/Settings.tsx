import { useLibrary } from '@/contexts/LibraryContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings as SettingsIcon,
  Database,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { currentUser } = useLibrary();

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This will restore the demo data.')) {
      localStorage.removeItem('lms_initialized');
      localStorage.removeItem('lms_books');
      localStorage.removeItem('lms_categories');
      localStorage.removeItem('lms_donations');
      localStorage.removeItem('lms_users');
      localStorage.removeItem('lms_borrow_records');
      localStorage.removeItem('lms_current_user');
      
      toast.success('Data reset successfully. Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      localStorage.clear();
      toast.success('All data cleared. Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your library management system</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Current system status and version</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0 (Demo)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-medium">localStorage</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Current Role</span>
              <span className="font-medium capitalize">{currentUser?.role || 'Unknown'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">User</span>
              <span className="font-medium">{currentUser?.name || 'Unknown'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Manage your local data storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                All data is stored locally in your browser. This data will persist until you clear 
                your browser data or use the reset options below.
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleResetData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Demo Data
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleClearData}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Demo Features
            </CardTitle>
            <CardDescription>Features available in this demo version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-green-600">✓ Available Features</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Dashboard with statistics</li>
                  <li>• Book catalog management (CRUD)</li>
                  <li>• Category management</li>
                  <li>• Donation tracking</li>
                  <li>• Borrowing system</li>
                  <li>• Role-based access simulation</li>
                  <li>• Search and filtering</li>
                  <li>• Local data persistence</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">✓ Backend</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Real user authentication</li>
                  <li>• Multi-user collaboration</li>
                  <li>• File uploads to cloud</li>
                  <li>• Email notifications</li>
                  <li>• Advanced reporting</li>
                  <li>• Data backup and sync</li>
                  <li>• API integrations</li>
                  <li>• Audit logging</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
