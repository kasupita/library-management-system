import { Book, Category, Donation, User, BorrowRecord } from '@/types/library';

export const seedCategories: Category[] = [
  { id: 'cat-1', name: 'Fiction', description: 'Novels, short stories, and literary works', color: '#8B5CF6', bookCount: 0, createdAt: '2024-01-01' },
  { id: 'cat-2', name: 'Non-Fiction', description: 'Biographies, essays, and factual works', color: '#3B82F6', bookCount: 0, createdAt: '2024-01-01' },
  { id: 'cat-3', name: 'Science & Technology', description: 'Scientific research and technical books', color: '#10B981', bookCount: 0, createdAt: '2024-01-01' },
  { id: 'cat-4', name: 'History', description: 'Historical accounts and analysis', color: '#F59E0B', bookCount: 0, createdAt: '2024-01-01' },
  { id: 'cat-5', name: 'Philosophy', description: 'Philosophical texts and discussions', color: '#EC4899', bookCount: 0, createdAt: '2024-01-01' },
  { id: 'cat-6', name: 'Reference', description: 'Dictionaries, encyclopedias, and guides', color: '#6366F1', bookCount: 0, createdAt: '2024-01-01' },
];

export const seedBooks: Book[] = [
  {
    id: 'book-1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565',
    categoryId: 'cat-1', description: 'A story of the mysteriously wealthy Jay Gatsby and his love for Daisy Buchanan.',
    publishedYear: 1925, publisher: 'Scribner', copies: 5, availableCopies: 3,
    isDonated: false, createdAt: '2024-01-15', updatedAt: '2024-01-15'
  },
  {
    id: 'book-2', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '978-0062316097',
    categoryId: 'cat-2', description: 'A groundbreaking narrative of humanity\'s creation and evolution.',
    publishedYear: 2014, publisher: 'Harper', copies: 3, availableCopies: 2,
    isDonated: true, donorName: 'John Smith', donationDate: '2024-02-10', createdAt: '2024-02-10', updatedAt: '2024-02-10'
  },
  {
    id: 'book-3', title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0553380163',
    categoryId: 'cat-3', description: 'Landmark volume in science writing about cosmology.',
    publishedYear: 1988, publisher: 'Bantam', copies: 4, availableCopies: 4,
    isDonated: false, createdAt: '2024-01-20', updatedAt: '2024-01-20'
  },
  {
    id: 'book-4', title: 'The Art of War', author: 'Sun Tzu', isbn: '978-1590302255',
    categoryId: 'cat-4', description: 'Ancient Chinese military treatise on warfare and strategy.',
    publishedYear: -500, publisher: 'Shambhala', copies: 6, availableCopies: 5,
    isDonated: false, createdAt: '2024-01-10', updatedAt: '2024-01-10'
  },
  {
    id: 'book-5', title: 'Meditations', author: 'Marcus Aurelius', isbn: '978-0140449334',
    categoryId: 'cat-5', description: 'Personal writings of the Roman Emperor on Stoic philosophy.',
    publishedYear: 180, publisher: 'Penguin Classics', copies: 3, availableCopies: 2,
    isDonated: true, donorName: 'Philosophy Dept', donationDate: '2024-03-01', createdAt: '2024-03-01', updatedAt: '2024-03-01'
  },
  {
    id: 'book-6', title: '1984', author: 'George Orwell', isbn: '978-0451524935',
    categoryId: 'cat-1', description: 'Dystopian social science fiction novel about totalitarianism.',
    publishedYear: 1949, publisher: 'Signet Classic', copies: 8, availableCopies: 6,
    isDonated: false, createdAt: '2024-01-05', updatedAt: '2024-01-05'
  },
  {
    id: 'book-7', title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884',
    categoryId: 'cat-3', description: 'A handbook of agile software craftsmanship.',
    publishedYear: 2008, publisher: 'Prentice Hall', copies: 4, availableCopies: 1,
    isDonated: false, createdAt: '2024-02-01', updatedAt: '2024-02-01'
  },
  {
    id: 'book-8', title: 'The Republic', author: 'Plato', isbn: '978-0140455113',
    categoryId: 'cat-5', description: 'Socratic dialogue on justice and the ideal state.',
    publishedYear: -375, publisher: 'Penguin Classics', copies: 2, availableCopies: 2,
    isDonated: true, donorName: 'Ancient Studies Club', donationDate: '2024-02-20', createdAt: '2024-02-20', updatedAt: '2024-02-20'
  },
];

export const seedDonations: Donation[] = [
  {
    id: 'don-1', bookId: 'book-2', donorName: 'John Smith', donorEmail: 'john@email.com',
    quantity: 3, status: 'accepted', createdAt: '2024-02-10', processedAt: '2024-02-11'
  },
  {
    id: 'don-2', bookId: 'book-5', donorName: 'Philosophy Dept', donorEmail: 'philosophy@university.edu',
    quantity: 3, status: 'accepted', createdAt: '2024-03-01', processedAt: '2024-03-02'
  },
  {
    id: 'don-3', bookId: 'book-8', donorName: 'Ancient Studies Club', donorEmail: 'ancientstudies@university.edu',
    quantity: 2, notes: 'Part of classics collection expansion', status: 'accepted', createdAt: '2024-02-20', processedAt: '2024-02-21'
  },
  {
    id: 'don-4', bookId: '', donorName: 'Sarah Johnson', donorEmail: 'sarah.j@email.com',
    quantity: 10, notes: 'Collection of classic literature', status: 'pending', createdAt: '2024-03-15'
  },
];

export const seedUsers: User[] = [
  { id: 'user-1', name: 'Admin User', email: 'admin@library.edu', role: 'admin', createdAt: '2024-01-01' },
  { id: 'user-2', name: 'Jane Librarian', email: 'jane@library.edu', role: 'librarian', createdAt: '2024-01-01' },
  { id: 'user-3', name: 'Dr. Smith', email: 'drsmith@university.edu', role: 'hod', department: 'Computer Science', createdAt: '2024-01-05' },
  { id: 'user-4', name: 'Alex Student', email: 'alex@student.edu', role: 'student', department: 'Engineering', createdAt: '2024-02-01' },
];

export const seedBorrowRecords: BorrowRecord[] = [
  { id: 'borrow-1', bookId: 'book-1', userId: 'user-4', borrowDate: '2024-03-01', dueDate: '2024-03-15', status: 'borrowed' },
  { id: 'borrow-2', bookId: 'book-7', userId: 'user-3', borrowDate: '2024-02-20', dueDate: '2024-03-05', returnDate: '2024-03-04', status: 'returned' },
  { id: 'borrow-3', bookId: 'book-6', userId: 'user-4', borrowDate: '2024-02-15', dueDate: '2024-03-01', status: 'overdue' },
];

export function initializeData() {
  const isInitialized = localStorage.getItem('lms_initialized');
  
  if (!isInitialized) {
    // Update category book counts
    const categoriesWithCounts = seedCategories.map(cat => ({
      ...cat,
      bookCount: seedBooks.filter(book => book.categoryId === cat.id).length
    }));

    localStorage.setItem('lms_categories', JSON.stringify(categoriesWithCounts));
    localStorage.setItem('lms_books', JSON.stringify(seedBooks));
    localStorage.setItem('lms_donations', JSON.stringify(seedDonations));
    localStorage.setItem('lms_users', JSON.stringify(seedUsers));
    localStorage.setItem('lms_borrow_records', JSON.stringify(seedBorrowRecords));
    localStorage.setItem('lms_current_user', JSON.stringify(seedUsers[0])); // Default to admin
    localStorage.setItem('lms_initialized', 'true');
  }
}
