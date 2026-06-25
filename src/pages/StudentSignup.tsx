import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useLibrary } from "@/contexts/LibraryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function normalizeStudentId(value: string) {
  return value.trim().toLowerCase();
}

// Example: bscwd234008 (5 letters + 6 digits)
function isValidSibaStudentId(value: string) {
  return /^[a-z]{5}\d{6}$/.test(normalizeStudentId(value));
}

export default function StudentSignup() {
  const navigate = useNavigate();
  const { setCurrentUser, refetchData } = useLibrary();
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const studentIdNormalized = useMemo(() => normalizeStudentId(studentId), [studentId]);
  const studentIdValid = useMemo(() => isValidSibaStudentId(studentId), [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!studentIdValid) {
      setError("Student ID format is invalid. Example: bscwd234008");
      return;
    }

    setIsLoading(true);
    const response = await api.register(name, email, password, department || undefined, studentIdNormalized);
    setIsLoading(false);

    if (response.success && response.data) {
      localStorage.setItem("lms_token", response.data.token);
      setCurrentUser(response.data.user, { establishSession: true });
      await refetchData();
      navigate("/dashboard");
      return;
    }

    setError(response.error || "Registration failed. Please try again.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-purple-300 to-purple-400">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-4">
        <div className="w-full overflow-hidden rounded-2xl border border-purple-300 bg-white shadow-xl">
          <div className="p-8 md:p-10 bg-purple-50">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-purple-800">Student Sign Up</h1>
              <p className="text-sm text-purple-600">
                Create your student account using your SIBA Student ID (index number).
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <label htmlFor="studentId" className="text-sm font-medium text-purple-800">
                  Student ID / Index
                </label>
                <Input
                  id="studentId"
                  placeholder="bscwd234008"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  autoFocus
                  className="border-purple-300 focus-visible:ring-purple-500"
                />
                {!studentIdValid && studentId.length > 0 && (
                  <p className="text-xs text-purple-700">Format must be like: bscwd234008</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-purple-800">
                  Full name
                </label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-purple-300 focus-visible:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-purple-800">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@student.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-purple-300 focus-visible:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-purple-800">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-purple-300 focus-visible:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium text-purple-800">
                  Department (optional)
                </label>
                <Input
                  id="department"
                  placeholder="e.g. Computing"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="border-purple-300 focus-visible:ring-purple-500"
                />
              </div>

              {error && (
                <div className="rounded-md bg-purple-100 p-3 text-sm text-purple-700 border border-purple-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white transition-all duration-200"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="mt-6 text-sm text-purple-700">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-purple-800 underline underline-offset-4">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

