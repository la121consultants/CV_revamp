import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const UserAuth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    toast({ title: "Welcome back!", description: "You have successfully logged in." });
    navigate(redirectTo);
    setIsLoading(false);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setMessage("Check your email for a confirmation link to complete your sign-up.");
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setMessage("Check your email for a password reset link.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="LA121 Consultants" className="h-16 w-auto mb-3" />
            <h1 className="text-2xl font-bold text-foreground">
              {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === "login"
                ? "Sign in to access your CV builder"
                : mode === "signup"
                ? "Create an account to get started"
                : "Enter your email to reset your password"}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm"
            >
              {message}
            </motion.div>
          )}

          {mode !== "forgot" && (
            <>
              <Button
                variant="outline"
                className="w-full h-12 gap-3 mb-4"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 mb-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
            </>
          )}

          <form onSubmit={mode === "login" ? handleEmailLogin : mode === "signup" ? handleEmailSignup : handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-12 gradient-primary">
              {isLoading
                ? "Loading..."
                : mode === "login"
                ? "Sign In"
                : mode === "signup"
                ? "Create Account"
                : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {mode === "login" && (
              <>
                <button
                  onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </button>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button
                onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                className="text-sm text-primary hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserAuth;
