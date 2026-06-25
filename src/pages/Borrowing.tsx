import { useState } from 'react';
import { useLibrary } from '@/contexts/LibraryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  BookCopy,
  Search,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function Borrowing() {
  const {
    borrowRecords,
    books,
    users,
    borrowBook,
    returnBook,
    bookRequests,
    approveBookRequest,
    rejectBookRequest,
    currentUser,
  } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'librarian';

  const filteredRecords = borrowRecords.filter(record => {
    const book = books.find(b => b.id === record.bookId);
    const user = users.find(u => u.id === record.userId);
    const matchesSearch = book?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableBooks = books.filter(b => b.availableCopies > 0);

  const handleBorrowBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBook || !selectedUser) {
      toast.error('Please select both a book and a user');
      return;
    }
    const res = await borrowBook(selectedBook, selectedUser);
    if (!res.success) {
      toast.error(res.error || 'Failed to issue loan');
      return;
    }
    toast.success('Book borrowed successfully');
    setIsAddDialogOpen(false);
    setSelectedBook('');
    setSelectedUser('');
  };

  const handleReturnBook = async (borrowId: string) => {
    await returnBook(borrowId);
    toast.success('Book returned successfully');
  };

  const statusConfig = {
    borrowed: { icon: Clock, color: 'bg-blue-500/20 text-blue-600 border-blue-500', label: 'Borrowed' },
    returned: { icon: CheckCircle, color: 'bg-green-500/20 text-green-600 border-green-500', label: 'Returned' },
    overdue: { icon: AlertTriangle, color: 'bg-red-500/20 text-red-600 border-red-500', label: 'Overdue' },
  };

  // Stats
  const pendingRequests = bookRequests.filter((r) => r.status === 'pending');

  const activeBorrows = borrowRecords.filter(r => r.status === 'borrowed').length;
  const overdueCount = borrowRecords.filter(r => r.status === 'overdue').length;
  const returnedCount = borrowRecords.filter(r => r.status === 'returned').length;

  const handleApproveRequest = async (id: string) => {
    const res = await approveBookRequest(id);
    if (res.success) toast.success('Request approved — loan issued');
    else toast.error(res.error || 'Could not approve');
  };

  const handleRejectRequest = async (id: string) => {
    const res = await rejectBookRequest(id);
    if (res.success) toast.success('Request rejected');
    else toast.error(res.error || 'Could not reject');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Borrowing</h1>
          <p className="text-muted-foreground mt-1">Manage book loans and returns</p>
        </div>
        
        {canManage && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Loan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue New Book Loan</DialogTitle>
                <DialogDescription>Select a book and user for the loan</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBorrowBook} className="space-y-4">
                <div className="space-y-2">
                  <Label>Book</Label>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBooks.map(book => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} ({book.availableCopies} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Borrower</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium">Loan Duration: 14 days</p>
                  <p className="text-muted-foreground mt-1">
                    Due date will be automatically calculated
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  Issue Loan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {canManage && pendingRequests.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Pending student requests</CardTitle>
            <CardDescription>Approve to issue a 14-day loan, or reject the request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{req.bookTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.userName} · {req.requestType === 'borrow' ? 'Borrow request' : 'Reservation'} ·{' '}
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApproveRequest(req.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(req.id)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BookCopy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeBorrows}</p>
                <p className="text-sm text-muted-foreground">Active Loans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{returnedCount}</p>
                <p className="text-sm text-muted-foreground">Returned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by book title or borrower..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.map((record) => {
          const book = books.find(b => b.id === record.bookId);
          const user = users.find(u => u.id === record.userId);
          const config = statusConfig[record.status];
          const StatusIcon = config.icon;

          return (
            <Card key={record.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded flex items-center justify-center flex-shrink-0">
                      <BookCopy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{record.bookTitle || book?.title || 'Unknown Book'}</h3>
                      <p className="text-sm text-muted-foreground">by {book?.author || 'Unknown Author'}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>
                          <span className="text-muted-foreground">Borrower:</span> {user?.name || 'Unknown'}
                        </span>
                        <span>
                          <span className="text-muted-foreground">Borrowed:</span> {new Date(record.borrowDate).toLocaleDateString()}
                        </span>
                        <span className={record.status === 'overdue' ? 'text-destructive font-medium' : ''}>
                          <span className="text-muted-foreground">Due:</span> {new Date(record.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      {record.returnDate && (
                        <p className="text-sm text-green-600 mt-1">
                          Returned: {new Date(record.returnDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    
                    {canManage && record.status !== 'returned' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReturnBook(record.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Return
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRecords.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <BookCopy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No borrowing records found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter' 
                : 'Issue a new loan to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
