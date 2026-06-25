import { useState } from 'react';
import { useLibrary } from '@/contexts/LibraryContext';
import { Donation } from '@/types/library';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Gift,
  Check,
  X,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

export default function Donations() {
  const { donations, addDonation, processDonation, books, currentUser } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const canProcess = currentUser?.role === 'admin' || currentUser?.role === 'librarian';

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          donation.donorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddDonation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bookId = (formData.get('bookId') as string) || '';
    await addDonation({
      bookId: bookId || undefined,
      donorName: formData.get('donorName') as string,
      donorEmail: formData.get('donorEmail') as string,
      donorPhone: (formData.get('donorPhone') as string) || undefined,
      donorAddress: (formData.get('donorAddress') as string) || undefined,
      quantity: parseInt(formData.get('quantity') as string) || 1,
      notes: (formData.get('notes') as string) || undefined,
    });
    toast.success('Donation recorded successfully');
    setIsAddDialogOpen(false);
  };

  const handleProcessDonation = async (id: string, status: 'accepted' | 'rejected') => {
    await processDonation(id, status);
    toast.success(`Donation ${status === 'accepted' ? 'accepted' : 'rejected'}`);
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500',
    accepted: 'bg-green-500/20 text-green-600 border-green-500',
    rejected: 'bg-red-500/20 text-red-600 border-red-500',
  };

  const statusIcons = {
    pending: Clock,
    accepted: Check,
    rejected: X,
  };

  // Stats
  const totalDonations = donations.length;
  const pendingCount = donations.filter(d => d.status === 'pending').length;
  const acceptedCount = donations.filter(d => d.status === 'accepted').length;
  const totalBooksReceived = donations
    .filter(d => d.status === 'accepted')
    .reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Donations</h1>
          <p className="text-muted-foreground mt-1">Track and manage book donations</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Donation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Donation</DialogTitle>
              <DialogDescription>Add details of a new book donation</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDonation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="donorName">Donor Name</Label>
                  <Input id="donorName" name="donorName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donorEmail">Email</Label>
                  <Input id="donorEmail" name="donorEmail" type="email" required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="donorPhone">Phone (optional)</Label>
                  <Input id="donorPhone" name="donorPhone" type="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of Books</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donorAddress">Address (optional)</Label>
                <Input id="donorAddress" name="donorAddress" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Description of donated materials..." rows={3} />
              </div>

              <Button type="submit" className="w-full">
                Record Donation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDonations}</p>
                <p className="text-sm text-muted-foreground">Total Donations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{acceptedCount}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Gift className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBooksReceived}</p>
                <p className="text-sm text-muted-foreground">Books Received</p>
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
                placeholder="Search by donor name or email..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Donations List */}
      <div className="space-y-4">
        {filteredDonations.map((donation) => {
          const StatusIcon = statusIcons[donation.status];
          return (
            <Card key={donation.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{donation.donorName}</h3>
                      <p className="text-sm text-muted-foreground">{donation.donorEmail}</p>
                      {donation.donorPhone && (
                        <p className="text-sm text-muted-foreground">{donation.donorPhone}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-medium">{donation.quantity} {donation.quantity === 1 ? 'book' : 'books'}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {donation.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">"{donation.notes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusColors[donation.status]}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </Badge>
                    
                    {canProcess && donation.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleProcessDonation(donation.id, 'accepted')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleProcessDonation(donation.id, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDonations.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No donations found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter' 
                : 'Record your first donation to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
