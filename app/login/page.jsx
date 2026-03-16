"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { useLoginMutation } from "@/store/services/authApi";
import { setCredentials } from "@/store/slices/authSlice";

// 1. Zod Validation Schema
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  // 2. Setup React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // 3. Submit Handler
  const onSubmit = async (data) => {
    // if (data.email === "test@example.com" && data.password === "password123") {
    //     document.cookie = "refreshToken=dummy_token_for_testing; path=/"
    //   dispatch(setCredentials({ 
    //     user: { 
    //       _id: "dummy123", 
    //       username: "testuser", 
    //       email: "test@example.com",
    //       avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=testuser",
    //       videos: []
    //     }, 
    //     accessToken: "mock_jwt_token_12345" 
    //   }));
    //   toast.success("Logged in successfully! (Mock)");
    //   router.push("/"); 
    //   return;
    // }
    try {
      const response = await login(data).unwrap();
      
      // Assuming your backend returns { data: { user, accessToken } }
      // Adjust the response.data mapping based on your exact backend structure
      dispatch(setCredentials({ 
        user: response.data.user, 
        accessToken: response.data.accessToken 
      }));
      
      toast.success("Logged in successfully!");
      router.push("/"); // Redirect to home feed
    } catch (err) {
      toast.error(err?.data?.message || "Failed to login. Please check your credentials.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-[var(--text-muted)]">Log in to your StreamTime account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                {...register("email")} 
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                {...register("password")} 
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[var(--text-muted)]">Don't have an account? </span>
            <Link href="/register" className="font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}