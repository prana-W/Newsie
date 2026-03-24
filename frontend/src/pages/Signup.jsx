import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";



import {
  User,
  Mail,
  ShieldCheck,
  Phone,
  Hash,
  MapPin,
} from "lucide-react";
import {toast} from 'sonner';

export default function SignupUser() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    pinCode: "",
    address: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(import.meta.env.VITE_SERVER_URL + "/api/v1/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Signup failed");

      toast.success("Account created successfully");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
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
            Create your account
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Join the platform and contribute to verified crisis response efforts
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">

            {/* FULL NAME */}
            <div>
              <Label>
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  required
                  className="pl-9"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
            </div>

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
                  placeholder="Create a secure password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <Label>
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  required
                  className="pl-9"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>

            {/* PIN CODE */}
            <div>
              <Label>
                Pin Code <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  required
                  className="pl-9"
                  placeholder="e.g. 110001"
                  value={form.pinCode}
                  onChange={(e) => handleChange("pinCode", e.target.value)}
                />
              </div>
            </div>

            {/* ADDRESS */}
            <div>
              <Label>Address</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                <Textarea
                  rows={3}
                  className="pl-9"
                  placeholder="Optional address"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            {/* LOGIN LINK */}
            <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
              Already have an account?{" "}
              <Link
                to="/login/user"
                className="text-[var(--primary)] hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}