import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle } from "lucide-react";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";

export function AccessCodeGate({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery<{ granted: boolean }>({
    queryKey: ["/api/access-code/status"],
  });

  const verifyMutation = useMutation({
    mutationFn: async (accessCode: string) => {
      const res = await apiRequest("POST", "/api/access-code/verify", { code: accessCode });
      return res.json();
    },
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["/api/access-code/status"] });
    },
    onError: () => {
      setError("Invalid access code. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    verifyMutation.mutate(code);
  };

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (data?.granted) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950" data-testid="access-code-gate">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-700 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Required</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Enter the access code to continue to LiJOBS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter access code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                className="h-12 text-center text-lg tracking-widest"
                autoFocus
                data-testid="input-access-code"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm justify-center" data-testid="text-access-error">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={verifyMutation.isPending || !code.trim()}
              data-testid="button-submit-access-code"
            >
              {verifyMutation.isPending ? "Verifying..." : "Enter"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Liberia Jobs Observatory System
          </p>
        </div>
      </div>
    </div>
  );
}
