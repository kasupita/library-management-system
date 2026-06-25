export type UserRole = 'admin' | 'librarian' | 'hod' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  bookCount: number;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  categoryId: string;
  description: string;
  publishedYear: number;
  publisher: string;
  copies: number;
  availableCopies: number;
  coverImage?: string;
  digitalFile?: string;
  isDonated: boolean;
  donorName?: string;
  donorContact?: string;
  donationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  bookId: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  donorAddress?: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle?: string;
  userId: string;
  userName?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  fine?: number;
  estimatedFine?: number;
}

export interface BookRequest {
  id: string;
  bookId: string;
  bookTitle?: string;
  userId: string;
  userName?: string;
  requestType: 'borrow' | 'reserve';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  borrowRecordId?: string;
}

export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  totalCategories: number;
  totalDonations: number;
  pendingDonations: number;
  totalUsers: number;
  overdueBooks: number;
  pendingBookRequests?: number;
}
