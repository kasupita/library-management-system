import { useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/contexts/LibraryContext";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/books": "Books",
  "/categories": "Categories",
  "/donations": "Donations",
  "/borrowing": "Borrowing",
  "/users": "Users",
  "/settings": "Settings",
};

export function Topbar({ onOpenMobileSidebar }: { onOpenMobileSidebar: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useLibrary();
  const { theme, setTheme } = useTheme();

  const title = pageTitles[location.pathname] ?? "LMS";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 min-w-0">
          <img
            src="https://siba.edu.lk/publication/iris.journal/images/SIBALOGO.png"
            alt="LMS"
            className="h-9 w-auto object-contain"
            loading="eager"
            decoding="async"
          />
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground leading-tight">Library Management System</p>
            <h1 className="text-base font-semibold text-foreground leading-tight truncate">{title}</h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground leading-tight">{currentUser?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground leading-tight capitalize">{currentUser?.role ?? ""}</p>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

