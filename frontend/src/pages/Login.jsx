import { useState } from "react";
import {Link, useNavigate} from 'react-router-dom';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

import { Mail, ShieldCheck } from "lucide-react";
import {toast} from 'sonner';

export default function LoginUser() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(import.meta.env.VITE_SERVER_URL + "/api/v1/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Login failed");

      toast.success("Logged in successfully");
      localStorage.setItem('role', 'user')
        window.location.href = '/';
      // later → redirect to dashboard
    } catch (err) {
      console.error(err);
      toast.error(err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-[var(--border)] shadow-xl animate-[fadeUp_0.6s_ease-out]">

        {/* LEFT PANEL (DESKTOP ONLY) */}
        <div className="hidden lg:block relative bg-[var(--accent-cyan-lighter)]">
          <img
            src="/images/userauth.png"
            alt="Community support"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* RIGHT PANEL */}
        <Card className="rounded-none border-0 p-8">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Log in to your account
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Access your dashboard and manage your activity
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">

            {/* EMAIL */}
            <div>
              <Label>
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  type="email"
                  required
                  className="pl-9"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <Label>
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  type="password"
                  required
                  className="pl-9"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>

            {/* SIGNUP LINK */}
            <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
              Don’t have an account?{" "}
              <Link
                to="/signup/user"
                className="text-[var(--primary)] hover:underline font-medium"
              >
                Create one
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}