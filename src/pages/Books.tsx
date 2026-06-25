import { useState } from 'react';
import { useLibrary } from '@/contexts/LibraryContext';
import { Book } from '@/types/library';
import { api } from '@/lib/api';
import { resolveUploadUrl } from '@/lib/uploads';
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
  Search, 
  BookOpen, 
  Edit, 
  Trash2, 
  Filter,
  Gift,
  FileText,
  BookmarkPlus,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Books() {
  const {
    books,
    categories,
    createBook,
    updateBook,
    deleteBook,
    currentUser,
    requestBook,
    bookRequests,
    borrowRecords,
  } = useLibrary();
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isExcelDialogOpen, setIsExcelDialogOpen] = useState(false);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'librarian';
  const canRequest =
    currentUser?.role === 'student' || currentUser?.role === 'hod';

  const handleRequestBook = async (bookId: string) => {
    if (!bookId) return;
    setRequestingId(bookId);
    try {
      const res = await requestBook(bookId);
      if (res.success) {
        toast.success(res.message || 'Request submitted — check My Library');
      } else {
        toast.error(res.error || 'Request failed');
      }
    } catch {
      toast.error('Could not reach server. Is the backend running on port 3001?');
    } finally {
      setRequestingId(null);
    }
  };

  const bookRequestState = (bookId: string) => {
    if (
      borrowRecords.some(
        (r) =>
          r.bookId === bookId &&
          (r.status === 'borrowed' || r.status === 'overdue')
      )
    ) {
      return 'on_loan' as const;
    }
    if (bookRequests.some((r) => r.bookId === bookId && r.status === 'pending')) {
      return 'pending' as const;
    }
    return 'none' as const;
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.isbn.includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || book.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Create FormData for API call
    const apiFormData = new FormData();
    apiFormData.append('title', formData.get('title') as string);
    apiFormData.append('author', formData.get('author') as string);
    apiFormData.append('isbn', formData.get('isbn') as string);
    apiFormData.append('categoryId', formData.get('categoryId') as string);
    apiFormData.append('description', formData.get('description') as string);
    apiFormData.append('publishedYear', formData.get('publishedYear') as string);
    apiFormData.append('publisher', formData.get('publisher') as string);
    apiFormData.append('copies', formData.get('copies') as string);
    apiFormData.append('availableCopies', formData.get('copies') as string);
    apiFormData.append('isDonated', 'false');
    
    // Add file if present
    const file = formData.get('pdfFile') as File;
    if (file && file.size > 0) {
      apiFormData.append('pdfFile', file);
    }

    try {
      const ok = await createBook(apiFormData);
      if (ok) {
        toast.success('Book added successfully');
        setIsAddDialogOpen(false);
      } else {
        toast.error('Failed to add book');
      }
    } catch (error) {
      toast.error('Failed to add book');
      console.error(error);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBook) return;

    const formData = new FormData(e.currentTarget);
    await updateBook(editingBook.id, {
      title: formData.get('title') as string,
      author: formData.get('author') as string,
      isbn: formData.get('isbn') as string,
      categoryId: formData.get('categoryId') as string,
      description: formData.get('description') as string,
      publishedYear: parseInt(formData.get('publishedYear') as string),
      publisher: formData.get('publisher') as string,
      copies: parseInt(formData.get('copies') as string),
    });
    toast.success('Book updated successfully');
    setEditingBook(null);
  };

  const handleDeleteBook = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteBook(id);
      toast.success('Book deleted successfully');
    }
  };

  const BookForm = ({ book, onSubmit }: { book?: Book | null; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={book?.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input id="author" name="author" defaultValue={book?.author} required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input id="isbn" name="isbn" defaultValue={book?.isbn} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select name="categoryId" defaultValue={book?.categoryId || categories[0]?.id}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="publishedYear">Year</Label>
          <Input id="publishedYear" name="publishedYear" type="number" defaultValue={book?.publishedYear || 2024} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="publisher">Publisher</Label>
          <Input id="publisher" name="publisher" defaultValue={book?.publisher} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="copies">Copies</Label>
          <Input id="copies" name="copies" type="number" min="1" defaultValue={book?.copies || 1} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={book?.description} rows={3} />
      </div>

      {!book && (
        <div className="space-y-2">
          <Label htmlFor="pdfFile">PDF File (Optional)</Label>
          <Input id="pdfFile" name="pdfFile" type="file" accept=".pdf" />
          <p className="text-sm text-muted-foreground">Upload a PDF version of the book (max 5MB)</p>
        </div>
      )}

      <Button type="submit" className="w-full">
        {book ? 'Update Book' : 'Add Book'}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Books</h1>
          <p className="text-muted-foreground mt-1">Manage your library collection</p>
        </div>
        
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Dialog open={isExcelDialogOpen} onOpenChange={setIsExcelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Book Excel Import/Export
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Book Excel Import / Export</DialogTitle>
                  <DialogDescription>
                    Export current books to Excel, or import new books from an Excel file.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const resp = await api.exportBooksExcel();
                      if (!resp.success || !resp.data) {
                        toast.error(resp.error || 'Export failed');
                        return;
                      }
                      const url = URL.createObjectURL(resp.data);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'books.xlsx';
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Exported books.xlsx');
                    }}
                  >
                    Export Excel
                  </Button>

                  <div className="space-y-2">
                    <Label htmlFor="excelFile">Import Excel</Label>
                    <Input
                      id="excelFile"
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Columns: title, author, isbn, category, publishedYear, publisher, copies, description
                    </p>
                  </div>

                  <Button
                    type="button"
                    disabled={!excelFile}
                    onClick={async () => {
                      if (!excelFile) return;
                      const resp = await api.importBooksExcel(excelFile);
                      if (!resp.success || !resp.data) {
                        toast.error(resp.error || 'Import failed');
                        return;
                      }
                      toast.success(`Imported ${resp.data.created} books`);
                      if (resp.data.errors?.length) {
                        toast.error(`Some rows failed: ${resp.data.errors.length}`);
                      }
                      setExcelFile(null);
                      setIsExcelDialogOpen(false);
                      window.location.reload();
                    }}
                  >
                    Import Excel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>Fill in the details to add a new book to the library</DialogDescription>
                </DialogHeader>
                <BookForm onSubmit={handleAddBook} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Books Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBooks.map((book) => {
          const category = categories.find(c => c.id === book.categoryId);
          return (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1">{book.title}</CardTitle>
                      <CardDescription className="line-clamp-1">{book.author}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {book.isDonated && (
                      <Gift className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    )}
                    {book.digitalFile && (
                      <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <Badge 
                    variant="secondary" 
                    style={{ backgroundColor: category?.color + '20', color: category?.color }}
                  >
                    {category?.name || 'Uncategorized'}
                  </Badge>
                  <span className="text-muted-foreground">{book.publishedYear}</span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {book.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    <span className={book.availableCopies > 0 ? 'text-green-600' : 'text-destructive'}>
                      {book.availableCopies} available
                    </span>
                    <span className="text-muted-foreground"> / {book.copies} total</span>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-end">
                  {canRequest && (() => {
                    const state = bookRequestState(book.id);
                    if (state === 'on_loan') {
                      return (
                        <Badge variant="secondary" className="text-xs">
                          On loan
                        </Badge>
                      );
                    }
                    if (state === 'pending') {
                      return (
                        <Badge variant="outline" className="text-xs">
                          Request pending
                        </Badge>
                      );
                    }
                    return (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={requestingId === book.id}
                        onClick={() => handleRequestBook(book.id)}
                      >
                        <BookmarkPlus className="h-4 w-4 mr-1" />
                        {book.availableCopies > 0 ? 'Request' : 'Reserve'}
                      </Button>
                    );
                  })()}
                  {book.digitalFile && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={resolveUploadUrl(book.digitalFile)}
                        target="_blank"
                        rel="noreferrer"
                        download={`${book.title.replace(/[^\w.-]+/g, '_')}.pdf`}
                      >
                        PDF
                      </a>
                    </Button>
                  )}
                  
                  {canEdit && (
                    <div className="flex gap-1">
                      <Dialog open={editingBook?.id === book.id} onOpenChange={(open) => !open && setEditingBook(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingBook(book)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Book</DialogTitle>
                            <DialogDescription>Update the book details</DialogDescription>
                          </DialogHeader>
                          <BookForm book={editingBook} onSubmit={handleUpdateBook} />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteBook(book.id, book.title)}
                      >
                        <Trash2 className="h-4 w-4" />
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

      {filteredBooks.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No books found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filter' 
                : 'Add your first book to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
