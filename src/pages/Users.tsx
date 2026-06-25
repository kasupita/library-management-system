import { useState } from 'react';
import { useLibrary } from '@/contexts/LibraryContext';
import { User } from '@/types/library';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users as UsersIcon,
  Shield,
  BookOpen,
  GraduationCap,
  Building,
  Edit,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const roleConfig = {
  admin: { 
    icon: Shield, 
    color: 'bg-red-500', 
    bgColor: 'bg-red-500/20',
    label: 'Administrator',
    description: 'Full system access'
  },
  librarian: { 
    icon: BookOpen, 
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-500/20',
    label: 'Librarian',
    description: 'Manage books and loans'
  },
  hod: { 
    icon: Building, 
    color: 'bg-purple-500', 
    bgColor: 'bg-purple-500/20',
    label: 'Head of Department',
    description: 'Department oversight'
  },
  student: { 
    icon: GraduationCap, 
    color: 'bg-green-500', 
    bgColor: 'bg-green-500/20',
    label: 'Student',
    description: 'Borrow books'
  },
};

export default function Users() {
  const { users, borrowRecords, currentUser, sessionUser, updateUser, createUser, deleteUser } = useLibrary();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editRole, setEditRole] = useState<User['role']>('student');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addRole, setAddRole] = useState<User['role']>('student');

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Access Denied</h3>
            <p className="text-muted-foreground mt-1">
              Only administrators can view user management
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stats by role
  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    librarian: users.filter(u => u.role === 'librarian').length,
    hod: users.filter(u => u.role === 'hod').length,
    student: users.filter(u => u.role === 'student').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage system users and roles</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>Create a new Student or HOD account (admin-only)</DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const result = await createUser({
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  password: formData.get('password') as string,
                  department: (formData.get('department') as string) || undefined,
                  role: addRole,
                  studentId: (formData.get('studentId') as string) || undefined,
                });
                if (result.success) {
                  toast.success('User created');
                  setIsAddDialogOpen(false);
                } else {
                  toast.error(result.error || 'Failed to create user');
                }
              }}
            >
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={addRole} onValueChange={(v) => setAddRole(v as User['role'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="hod">Head of Department</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-name">Name</Label>
                <Input id="add-name" name="name" placeholder="Full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" name="email" type="email" placeholder="user@email.com" required />
              </div>

              {addRole === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="add-studentId">Student ID / Index</Label>
                  <Input id="add-studentId" name="studentId" placeholder="bscwd234008" required />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="add-department">Department</Label>
                <Input id="add-department" name="department" placeholder="e.g. Computing" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-password">Password</Label>
                <Input id="add-password" name="password" type="password" placeholder="Set a password" required />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {(Object.entries(roleConfig) as [keyof typeof roleConfig, typeof roleConfig.admin][]).map(([role, config]) => {
          const Icon = config.icon;
          return (
            <Card key={role}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config.bgColor)}>
                    <Icon className={cn('h-5 w-5', `text-${role === 'admin' ? 'red' : role === 'librarian' ? 'blue' : role === 'hod' ? 'purple' : 'green'}-600`)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{roleStats[role]}</p>
                    <p className="text-sm text-muted-foreground">{config.label}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>
            {users.length} registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => {
              const config = roleConfig[user.role];
              const Icon = config.icon;
              const userBorrows = borrowRecords.filter(r => r.userId === user.id && r.status === 'borrowed').length;
              const isSelf = user.id === (sessionUser?.id ?? currentUser?.id);

              return (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-medium', config.color)}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.department && (
                        <p className="text-xs text-muted-foreground">Dept: {user.department}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {userBorrows > 0 && (
                      <Badge variant="secondary">
                        {userBorrows} active {userBorrows === 1 ? 'loan' : 'loans'}
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn('gap-1', config.bgColor)}>
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingUser(user);
                        setEditRole(user.role);
                      }}
                      aria-label="Edit user"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      disabled={isSelf}
                      onClick={() => setUserToDelete(user)}
                      aria-label="Delete user"
                      title={isSelf ? 'You cannot delete your own account' : 'Delete user'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and role</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await updateUser(editingUser.id, {
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  department: (formData.get('department') as string) || undefined,
                  role: editRole,
                });
                toast.success('User updated successfully');
                setEditingUser(null);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingUser.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" type="email" defaultValue={editingUser.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input id="edit-department" name="department" defaultValue={editingUser.department || ''} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as User['role'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="hod">Head of Department</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{' '}
              <span className="font-medium text-foreground">{userToDelete?.name}</span>{' '}
              ({userToDelete?.email}). This action cannot be undone.
              {userToDelete && borrowRecords.some(
                (r) => r.userId === userToDelete.id && (r.status === 'borrowed' || r.status === 'overdue')
              ) && (
                <span className="block mt-2 text-destructive">
                  This user has active loans and cannot be deleted until books are returned.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                if (!userToDelete) return;
                setIsDeleting(true);
                const result = await deleteUser(userToDelete.id);
                setIsDeleting(false);
                if (result.success) {
                  toast.success('User deleted');
                  setUserToDelete(null);
                  if (editingUser?.id === userToDelete.id) setEditingUser(null);
                } else {
                  toast.error(result.error || 'Failed to delete user');
                }
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demo Note */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Use the edit or delete icons next to each user. You cannot delete your own account or users with active loans.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
