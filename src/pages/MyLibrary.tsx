import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '@/contexts/LibraryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookCopy,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  DollarSign,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyLibrary() {
  const { borrowRecords, bookRequests, cancelBookRequest, currentUser } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');

  const myLoans = useMemo(
    () => borrowRecords.filter((r) => r.userId === currentUser?.id),
    [borrowRecords, currentUser?.id]
  );

  const myRequests = useMemo(
    () => bookRequests.filter((r) => r.userId === currentUser?.id),
    [bookRequests, currentUser?.id]
  );

  const activeLoans = myLoans.filter((r) => r.status === 'borrowed' || r.status === 'overdue');
  const overdueLoans = myLoans.filter((r) => r.status === 'overdue');
  const pendingRequests = myRequests.filter((r) => r.status === 'pending');

  const totalEstimatedFines = activeLoans.reduce(
    (sum, r) => sum + (Number(r.estimatedFine) || 0),
    0
  );
  const totalPaidFines = myLoans
    .filter((r) => r.status === 'returned')
    .reduce((sum, r) => sum + (Number(r.fine) || 0), 0);

  const filteredLoans = myLoans.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (r.bookTitle || '').toLowerCase().includes(q);
  });

  const statusConfig = {
    borrowed: { icon: Clock, color: 'bg-blue-500/20 text-blue-600 border-blue-500', label: 'Borrowed' },
    returned: { icon: CheckCircle, color: 'bg-green-500/20 text-green-600 border-green-500', label: 'Returned' },
    overdue: { icon: AlertTriangle, color: 'bg-red-500/20 text-red-600 border-red-500', label: 'Overdue' },
  };

  const handleCancel = async (id: string) => {
    const res = await cancelBookRequest(id);
    if (res.success) toast.success('Request cancelled');
    else toast.error(res.error || 'Could not cancel');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Library</h1>
          <p className="text-muted-foreground mt-1">Your loans, fines, and book requests</p>
        </div>
        <Button asChild>
          <Link to="/books">Browse books to request</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{activeLoans.length}</p>
            <p className="text-sm text-muted-foreground">Active loans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-destructive">{overdueLoans.length}</p>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{pendingRequests.length}</p>
            <p className="text-sm text-muted-foreground">Pending requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">${totalEstimatedFines.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                Est. fines due · ${totalPaidFines.toFixed(2)} paid on return
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="loans">
        <TabsList>
          <TabsTrigger value="loans">My loans</TabsTrigger>
          <TabsTrigger value="requests">My requests ({pendingRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your loans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {filteredLoans.map((record) => {
            const config = statusConfig[record.status];
            const StatusIcon = config.icon;
            const est = Number(record.estimatedFine) || 0;

            return (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{record.bookTitle || 'Book'}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Borrowed {new Date(record.borrowDate).toLocaleDateString()} · Due{' '}
                        <span className={record.status === 'overdue' ? 'text-destructive font-medium' : ''}>
                          {new Date(record.dueDate).toLocaleDateString()}
                        </span>
                      </p>
                      {record.returnDate && (
                        <p className="text-sm text-green-600 mt-1">
                          Returned {new Date(record.returnDate).toLocaleDateString()}
                          {Number(record.fine) > 0 && ` · Fine paid: $${Number(record.fine).toFixed(2)}`}
                        </p>
                      )}
                      {(record.status === 'overdue' || est > 0) && record.status !== 'returned' && (
                        <p className="text-sm text-destructive mt-1 font-medium">
                          Estimated fine: ${est.toFixed(2)} ($1/day overdue)
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredLoans.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <BookCopy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No loans yet</h3>
                <p className="text-muted-foreground mt-1">
                  Request a book from the catalog — a librarian will approve your loan.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 mt-4">
          {myRequests.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No requests</h3>
                <p className="text-muted-foreground mt-1">
                  Use &quot;Request&quot; or &quot;Reserve&quot; on a book in the catalog.
                </p>
              </CardContent>
            </Card>
          ) : (
            myRequests.map((req) => (
              <Card key={req.id}>
                <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{req.bookTitle || 'Book'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {req.requestType === 'borrow' ? 'Borrow request' : 'Reservation'} ·{' '}
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{req.status}</Badge>
                    {req.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleCancel(req.id)}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
