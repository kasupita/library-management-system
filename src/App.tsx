import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LibraryProvider, useLibrary } from "@/contexts/LibraryContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Categories from "./pages/Categories";
import Donations from "./pages/Donations";
import Borrowing from "./pages/Borrowing";
import MyLibrary from "./pages/MyLibrary";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import StudentSignup from "./pages/StudentSignup";
import PastPapers from "./pages/PastPapers";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedLayout() {
  const { currentUser, isLoading } = useLibrary();

  if (isLoading) {
    return null;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <MainLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LibraryProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/student-signup" element={<StudentSignup />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/books" element={<Books />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/donations" element={<Donations />} />
              <Route path="/borrowing" element={<Borrowing />} />
              <Route path="/my-library" element={<MyLibrary />} />
              <Route path="/past-papers" element={<PastPapers />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LibraryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
