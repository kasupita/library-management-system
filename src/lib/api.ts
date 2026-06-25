// In dev, prefer Vite proxy via relative `/api` (more stable across localhost/127.0.0.1/LAN IP).
// You can override with VITE_API_URL, e.g. http://localhost:3001/api
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...getAuthHeaders(), ...(options.headers as Record<string, string>) },
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return {
          success: false,
          error: text?.slice(0, 200) || 'Invalid response from server',
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `Request failed (${response.status})`,
        };
      }

      return { success: true, data: data.data ?? data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Auth
  async login(identifier: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  async register(
    name: string,
    email: string,
    password: string,
    department?: string,
    studentId?: string
  ): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, department, studentId }),
    });
  }

  // Books
  async getBooks(): Promise<ApiResponse<any[]>> {
    return this.request('/books');
  }

  async exportBooksExcel(): Promise<ApiResponse<Blob>> {
    try {
      const response = await fetch(`${API_BASE_URL}/books/export`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: (data as any).error || 'Export failed' };
      }
      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async importBooksExcel(file: File): Promise<ApiResponse<{ created: number; errors: any[] }>> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const fd = new FormData();
      fd.append('file', file);

      const response = await fetch(`${API_BASE_URL}/books/import`, {
        method: 'POST',
        body: fd,
        headers,
      });

      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || 'Import failed' };
      return { success: true, data: data.data ?? data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Exam papers
  async getExamPapers(all = false): Promise<ApiResponse<any[]>> {
    const q = all ? '?all=1' : '';
    return this.request(`/exam-papers${q}`);
  }

  async uploadExamPaper(formData: FormData): Promise<ApiResponse<any>> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/exam-papers`, {
        method: 'POST',
        body: formData,
        headers,
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || 'Request failed' };
      return { success: true, data: data.data ?? data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async approveExamPaper(id: string, approved: boolean): Promise<ApiResponse<any>> {
    return this.request(`/exam-papers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    });
  }

  async createBook(formData: FormData): Promise<ApiResponse<any>> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/books`, {
        method: 'POST',
        body: formData,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }
      return { success: true, data: data.data ?? data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateBook(id: string, book: Record<string, unknown>): Promise<ApiResponse<any>> {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(book),
    });
  }

  async deleteBook(id: string): Promise<ApiResponse<null>> {
    return this.request(`/books/${id}`, { method: 'DELETE' });
  }

  // Categories
  async getCategories(): Promise<ApiResponse<any[]>> {
    return this.request('/categories');
  }

  async createCategory(category: { name: string; description: string; color: string }): Promise<ApiResponse<any>> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: Partial<{ name: string; description: string; color: string }>): Promise<ApiResponse<any>> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<null>> {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // Donations
  async getDonations(): Promise<ApiResponse<any[]>> {
    return this.request('/donations');
  }

  async createDonation(donation: { bookId?: string; donorName: string; donorEmail: string; donorPhone?: string; donorAddress?: string; quantity: number; notes?: string }): Promise<ApiResponse<any>> {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(donation),
    });
  }

  async processDonation(id: string, status: 'accepted' | 'rejected'): Promise<ApiResponse<any>> {
    return this.request(`/donations/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Borrow
  async getBorrowRecords(): Promise<ApiResponse<any[]>> {
    return this.request('/borrow-records');
  }

  async borrowBook(bookId: string, userId?: string): Promise<ApiResponse<any>> {
    return this.request('/borrow-records', {
      method: 'POST',
      body: JSON.stringify({ bookId, userId }),
    });
  }

  async returnBook(borrowId: string): Promise<ApiResponse<any>> {
    return this.request(`/borrow-records/${borrowId}/return`, {
      method: 'POST',
    });
  }

  // Book requests (student self-service)
  async getBookRequests(status?: string): Promise<ApiResponse<any[]>> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/book-requests${q}`);
  }

  async createBookRequest(bookId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/book-requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bookId }),
      });
      const text = await response.text();
      if (text.trimStart().startsWith('<')) {
        return {
          success: false,
          error:
            'Server returned an error page. Restart the backend and run: cd backend && node src/config/migrate.js',
        };
      }
      let body: any = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        return { success: false, error: text?.slice(0, 200) || 'Invalid response from server' };
      }
      if (!response.ok) {
        return {
          success: false,
          error:
            body.error ||
            (response.status === 404
              ? 'Book requests API not found — restart the backend server'
              : `Request failed (${response.status})`),
        };
      }
      return { success: true, data: body.data, message: body.message };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message.includes('fetch')
              ? 'Cannot connect to API. Start backend: cd backend && npm run dev'
              : error.message
            : 'Unknown error',
      };
    }
  }

  async cancelBookRequest(id: string): Promise<ApiResponse<any>> {
    return this.request(`/book-requests/${id}/cancel`, { method: 'POST' });
  }

  async approveBookRequest(id: string): Promise<ApiResponse<any>> {
    return this.request(`/book-requests/${id}/approve`, { method: 'POST' });
  }

  async rejectBookRequest(id: string): Promise<ApiResponse<any>> {
    return this.request(`/book-requests/${id}/reject`, { method: 'POST' });
  }

  // Users
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/users');
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'librarian' | 'hod' | 'student';
    department?: string;
    studentId?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateUser(id: string, user: Partial<{ name: string; email: string; department: string; role: string }>): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<null>> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Stats
  async getStats(): Promise<ApiResponse<any>> {
    return this.request('/stats/dashboard');
  }
}

export const api = new ApiService();
