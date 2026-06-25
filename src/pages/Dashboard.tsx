import { Link } from 'react-router-dom';
import { useLibrary } from '@/contexts/LibraryContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  BookCopy, 
  FolderTree, 
  Gift, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Clock,
  BookmarkPlus,
} from 'lucide-react';

export default function Dashboard() {
  const { stats, books, donations, borrowRecords, categories, currentUser } = useLibrary();
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'librarian';
  const pendingRequests = stats.pendingBookRequests ?? 0;

  const recentBooks = books.slice(-5).reverse();
  const pendingDonations = donations.filter(d => d.status === 'pending');
  const activeBorrows = borrowRecords.filter(r => r.status === 'borrowed' || r.status === 'overdue');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to your Library Management System</p>
      </div>

      {isStaff && pendingRequests > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <BookmarkPlus className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {pendingRequests} student book request{pendingRequests === 1 ? '' : 's'} waiting
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and approve on the Borrowing page. No email is sent — check here or the sidebar badge.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/borrowing">Review requests</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.availableBooks} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Borrowed</CardTitle>
            <BookCopy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.borrowedBooks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently on loan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Book categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Donations</CardTitle>
            <Gift className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDonations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{books.length}</CardTitle>
              <CardDescription>Unique Titles</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{stats.totalUsers}</CardTitle>
              <CardDescription>Registered Users</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className={stats.overdueBooks > 0 ? "bg-gradient-to-br from-destructive/10 to-destructive/5" : "bg-gradient-to-br from-green-500/10 to-green-500/5"}>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.overdueBooks > 0 ? 'bg-destructive/20' : 'bg-green-500/20'}`}>
              <AlertTriangle className={`h-5 w-5 ${stats.overdueBooks > 0 ? 'text-destructive' : 'text-green-500'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{stats.overdueBooks}</CardTitle>
              <CardDescription>Overdue Books</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Books */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Books
            </CardTitle>
            <CardDescription>Latest additions to the library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBooks.length > 0 ? recentBooks.map((book) => {
                const category = categories.find(c => c.id === book.categoryId);
                return (
                  <div key={book.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" style={{ backgroundColor: category?.color + '20', color: category?.color }}>
                      {category?.name || 'Uncategorized'}
                    </Badge>
                  </div>
                );
              }) : (
                <p className="text-muted-foreground text-sm">No books added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Donations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Pending Donations
            </CardTitle>
            <CardDescription>Donations awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingDonations.length > 0 ? pendingDonations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <Gift className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{donation.donorName}</p>
                      <p className="text-xs text-muted-foreground">{donation.quantity} books</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    Pending
                  </Badge>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm">No pending donations</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Borrows */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Borrowings
            </CardTitle>
            <CardDescription>Books currently on loan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {activeBorrows.length > 0 ? activeBorrows.map((record) => {
                const book = books.find(b => b.id === record.bookId);
                const isOverdue = record.status === 'overdue';
                return (
                  <div key={record.id} className={`flex items-center justify-between p-3 rounded-lg ${isOverdue ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOverdue ? 'bg-destructive/20' : 'bg-primary/20'}`}>
                        <BookCopy className={`h-5 w-5 ${isOverdue ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{book?.title || 'Unknown Book'}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(record.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                      {isOverdue ? 'Overdue' : 'Borrowed'}
                    </Badge>
                  </div>
                );
              }) : (
                <p className="text-muted-foreground text-sm col-span-2">No active borrowings</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
