import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Book, Category, Donation, User, BorrowRecord, BookRequest, DashboardStats } from '@/types/library';
import { api } from '@/lib/api';

interface LibraryContextType {
  books: Book[];
  categories: Category[];
  donations: Donation[];
  users: User[];
  borrowRecords: BorrowRecord[];
  bookRequests: BookRequest[];
  currentUser: User | null;
  sessionUser: User | null;
  canSwitchRole: boolean;
  stats: DashboardStats;
  isLoading: boolean;
  refetchData: () => Promise<void>;

  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  createBook: (formData: FormData) => Promise<boolean>;
  updateBook: (id: string, book: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;

  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'bookCount'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addDonation: (donation: Omit<Donation, 'id' | 'createdAt'>) => Promise<void>;
  processDonation: (id: string, status: 'accepted' | 'rejected') => Promise<void>;

  borrowBook: (bookId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  returnBook: (borrowId: string) => Promise<void>;
  requestBook: (bookId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  cancelBookRequest: (id: string) => Promise<{ success: boolean; error?: string }>;
  approveBookRequest: (id: string) => Promise<{ success: boolean; error?: string }>;
  rejectBookRequest: (id: string) => Promise<{ success: boolean; error?: string }>;

  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  createUser: (user: {
    name: string;
    email: string;
    password: string;
    role: User['role'];
    department?: string;
    studentId?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  setCurrentUser: (user: User | null, options?: { establishSession?: boolean }) => void;
  switchRole: (role: User['role']) => void;
  logout: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const emptyStats: DashboardStats = {
  totalBooks: 0,
  availableBooks: 0,
  borrowedBooks: 0,
  totalCategories: 0,
  totalDonations: 0,
  pendingDonations: 0,
  totalUsers: 0,
  overdueBooks: 0,
  pendingBookRequests: 0,
};

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [bookRequests, setBookRequests] = useState<BookRequest[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [sessionUser, setSessionUserState] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);

  const canSwitchRole = sessionUser?.role === 'admin';

  const setCurrentUser = useCallback((user: User | null, options?: { establishSession?: boolean }) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('lms_current_user', JSON.stringify(user));
      if (options?.establishSession) {
        setSessionUserState(user);
        localStorage.setItem('lms_session_user', JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('lms_current_user');
      localStorage.removeItem('lms_session_user');
      localStorage.removeItem('lms_token');
      setSessionUserState(null);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setBooks([]);
    setCategories([]);
    setDonations([]);
    setUsers([]);
    setBorrowRecords([]);
    setBookRequests([]);
    setStats(emptyStats);
  }, [setCurrentUser]);

  const refetchData = useCallback(async () => {
    const token = localStorage.getItem('lms_token');
    setIsLoading(true);

    try {
      const [booksRes, categoriesRes] = await Promise.all([
        api.getBooks(),
        api.getCategories(),
      ]);

      if (booksRes.success && booksRes.data) setBooks(booksRes.data);
      if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);

      if (token) {
        const role = sessionUser?.role ?? (() => {
          try {
            return JSON.parse(localStorage.getItem('lms_session_user') || localStorage.getItem('lms_current_user') || '{}')?.role;
          } catch {
            return undefined;
          }
        })();
        const isStaff = role === 'admin' || role === 'librarian';

        const [donationsRes, borrowRes, requestsRes, usersRes, statsRes] = await Promise.all([
          api.getDonations(),
          api.getBorrowRecords(),
          api.getBookRequests(),
          isStaff ? api.getUsers() : Promise.resolve({ success: true, data: [] as User[] }),
          api.getStats(),
        ]);
        if (donationsRes.success && donationsRes.data) setDonations(donationsRes.data);
        if (borrowRes.success && borrowRes.data) setBorrowRecords(borrowRes.data);
        if (requestsRes.success && requestsRes.data) setBookRequests(requestsRes.data);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        if (statsRes.success && statsRes.data) setStats(statsRes.data as DashboardStats);
      } else {
        setDonations([]);
        setBorrowRecords([]);
        setBookRequests([]);
        setUsers([]);
        setStats(emptyStats);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  }, [sessionUser?.role]);

  useEffect(() => {
    const savedUser = localStorage.getItem('lms_current_user');
    const savedSession = localStorage.getItem('lms_session_user');
    const token = localStorage.getItem('lms_token');
    if (!token) return;

    try {
      if (savedSession) {
        setSessionUserState(JSON.parse(savedSession));
      } else if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setSessionUserState(parsed);
        localStorage.setItem('lms_session_user', savedUser);
      }
      if (savedUser) {
        setCurrentUserState(JSON.parse(savedUser));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refetchData();
  }, [refetchData]);

  const switchRole = useCallback((role: User['role']) => {
    if (sessionUser?.role !== 'admin') return;
    const userWithRole = users.find((u) => u.role === role);
    if (userWithRole) setCurrentUser(userWithRole);
  }, [users, setCurrentUser, sessionUser?.role]);

  const createBook = useCallback(async (formData: FormData): Promise<boolean> => {
    const res = await api.createBook(formData);
    if (res.success) {
      await refetchData();
      return true;
    }
    return false;
  }, [refetchData]);

  const addBook = useCallback(async (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => {
    const formData = new FormData();
    formData.append('title', book.title);
    formData.append('author', book.author);
    formData.append('isbn', book.isbn);
    formData.append('categoryId', book.categoryId);
    formData.append('description', book.description || '');
    formData.append('publishedYear', String(book.publishedYear || 0));
    formData.append('publisher', book.publisher || '');
    formData.append('copies', String(book.copies));
    formData.append('availableCopies', String(book.availableCopies));
    formData.append('isDonated', String(book.isDonated || false));
    await createBook(formData);
  }, [createBook]);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    const res = await api.updateBook(id, updates as Record<string, unknown>);
    if (res.success && res.data) {
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...res.data, updatedAt: new Date().toISOString() } : b))
      );
    }
    await refetchData();
  }, [refetchData]);

  const deleteBook = useCallback(async (id: string) => {
    const book = books.find((b) => b.id === id);
    const res = await api.deleteBook(id);
    if (res.success) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
      if (book?.categoryId) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === book.categoryId ? { ...c, bookCount: Math.max(0, c.bookCount - 1) } : c
          )
        );
      }
    }
    await refetchData();
  }, [books, refetchData]);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'createdAt' | 'bookCount'>) => {
    const res = await api.createCategory(category);
    if (res.success && res.data) {
      setCategories((prev) => [...prev, { ...res.data, bookCount: 0 } as Category]);
    }
    await refetchData();
  }, [refetchData]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const res = await api.updateCategory(id, updates);
    if (res.success && res.data) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...res.data } : c))
      );
    }
    await refetchData();
  }, [refetchData]);

  const deleteCategory = useCallback(async (id: string) => {
    const res = await api.deleteCategory(id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    await refetchData();
  }, [refetchData]);

  const addDonation = useCallback(async (donation: Omit<Donation, 'id' | 'createdAt'>) => {
    const res = await api.createDonation(donation);
    if (res.success && res.data) {
      setDonations((prev) => [{ ...donation, ...res.data } as Donation, ...prev]);
    }
    await refetchData();
  }, [refetchData]);

  const processDonation = useCallback(async (id: string, status: 'accepted' | 'rejected') => {
    const res = await api.processDonation(id, status);
    if (res.success && res.data) {
      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...res.data } : d))
      );
    }
    await refetchData();
  }, [refetchData]);

  const borrowBook = useCallback(async (bookId: string, userId: string) => {
    const res = await api.borrowBook(bookId, userId);
    if (res.success && res.data) {
      setBorrowRecords((prev) => [res.data as BorrowRecord, ...prev]);
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId ? { ...b, availableCopies: b.availableCopies - 1 } : b
        )
      );
      await refetchData();
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to issue loan' };
  }, [refetchData]);

  const requestBook = useCallback(async (bookId: string) => {
    const res = await api.createBookRequest(bookId);
    if (res.success) {
      if (res.data) {
        setBookRequests((prev) => [res.data as BookRequest, ...prev]);
      }
      await refetchData();
      return {
        success: true,
        message: res.message || 'Request submitted successfully',
      };
    }
    return { success: false, error: res.error || 'Request failed' };
  }, [refetchData]);

  const cancelBookRequest = useCallback(async (id: string) => {
    const res = await api.cancelBookRequest(id);
    if (res.success) {
      await refetchData();
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to cancel' };
  }, [refetchData]);

  const approveBookRequest = useCallback(async (id: string) => {
    const res = await api.approveBookRequest(id);
    if (res.success) {
      await refetchData();
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to approve' };
  }, [refetchData]);

  const rejectBookRequest = useCallback(async (id: string) => {
    const res = await api.rejectBookRequest(id);
    if (res.success) {
      await refetchData();
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to reject' };
  }, [refetchData]);

  const returnBook = useCallback(async (borrowId: string) => {
    const record = borrowRecords.find((r) => r.id === borrowId);
    const res = await api.returnBook(borrowId);
    if (res.success && record) {
      setBorrowRecords((prev) =>
        prev.map((r) =>
          r.id === borrowId ? { ...r, returnDate: new Date().toISOString(), status: 'returned' } : r
        )
      );
      setBooks((prev) =>
        prev.map((b) =>
          b.id === record.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b
        )
      );
    }
    await refetchData();
  }, [borrowRecords, refetchData]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const res = await api.updateUser(id, updates);
    if (res.success && res.data) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...res.data } : u))
      );
      setCurrentUserState((prev) =>
        prev?.id === id ? { ...prev, ...res.data } : prev
      );
    }
    await refetchData();
  }, [refetchData]);

  const createUser = useCallback(async (user: {
    name: string;
    email: string;
    password: string;
    role: User['role'];
    department?: string;
    studentId?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const res = await api.createUser(user as any);
    if (res.success) {
      await refetchData();
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to create user' };
  }, [refetchData]);

  const deleteUser = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await api.deleteUser(id);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      await refetchData();
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to delete user' };
  }, [refetchData]);

  return (
    <LibraryContext.Provider
      value={{
        books,
        categories,
        donations,
        users,
        borrowRecords,
        bookRequests,
        currentUser,
        sessionUser,
        canSwitchRole,
        stats,
        isLoading,
        refetchData,
        addBook,
        createBook,
        updateBook,
        deleteBook,
        addCategory,
        updateCategory,
        deleteCategory,
        addDonation,
        processDonation,
        borrowBook,
        returnBook,
        requestBook,
        cancelBookRequest,
        approveBookRequest,
        rejectBookRequest,
        updateUser,
        deleteUser,
        createUser,
        setCurrentUser,
        switchRole,
        logout,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
