import { useState } from 'react';
import { useLibrary } from '@/contexts/LibraryContext';
import { Category } from '@/types/library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FolderTree,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

const colorOptions = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', 
  '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#84CC16'
];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, books, currentUser } = useLibrary();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'librarian';

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addCategory({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      color: selectedColor,
    });
    toast.success('Category added successfully');
    setIsAddDialogOpen(false);
    setSelectedColor(colorOptions[0]);
  };

  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    const formData = new FormData(e.currentTarget);
    await updateCategory(editingCategory.id, {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      color: selectedColor,
    });
    toast.success('Category updated successfully');
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const booksInCategory = books.filter(b => b.categoryId === id).length;
    if (booksInCategory > 0) {
      toast.error(`Cannot delete category with ${booksInCategory} books. Please move or delete the books first.`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
    }
  };

  const CategoryForm = ({ category, onSubmit }: { category?: Category | null; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={category?.name} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={category?.description} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">
        {category ? 'Update Category' : 'Add Category'}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Organize your book collection</p>
        </div>
        
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>Create a new category to organize books</DialogDescription>
              </DialogHeader>
              <CategoryForm onSubmit={handleAddCategory} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const bookCount = books.filter(b => b.categoryId === category.id).length;
          return (
            <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2" style={{ backgroundColor: category.color }} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      <FolderTree className="h-5 w-5" style={{ color: category.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {bookCount} {bookCount === 1 ? 'book' : 'books'}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {category.description || 'No description'}
                </p>

                {canEdit && (
                  <div className="flex justify-end gap-1 mt-4 pt-4 border-t">
                    <Dialog open={editingCategory?.id === category.id} onOpenChange={(open) => {
                      if (!open) setEditingCategory(null);
                      else {
                        setEditingCategory(category);
                        setSelectedColor(category.color);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Category</DialogTitle>
                          <DialogDescription>Update the category details</DialogDescription>
                        </DialogHeader>
                        <CategoryForm category={editingCategory} onSubmit={handleUpdateCategory} />
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {categories.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No categories yet</h3>
            <p className="text-muted-foreground mt-1">
              Add your first category to organize your books
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
