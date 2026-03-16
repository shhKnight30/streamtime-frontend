"use client";



import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import * as z from "zod";

import { useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { toast } from "sonner";



import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/Input";

import { Card, CardContent } from "@/components/ui/Card";

import { useRegisterMutation } from "@/store/services/authApi";



const registerSchema = z.object({

  fullName: z.string().min(2, "Full name is required"),

  username: z.string().min(3, "Username must be at least 3 characters"),

  email: z.string().email("Invalid email address"),

  password: z.string().min(6, "Password must be at least 6 characters"),

  avatar: z.instanceof(File), 

});



export default function RegisterPage() {

  const router = useRouter();

  const [registerUser, { isLoading }] = useRegisterMutation();

  const [avatarFile, setAvatarFile] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState(null);



  const { register, handleSubmit, formState: { errors } } = useForm({

    resolver: zodResolver(registerSchema),

  });



  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };



  const onSubmit = async (data) => {

    try {

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('password', data.password);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await registerUser(formData).unwrap();

      toast.success("Account created successfully! Please log in.");

      router.push("/login");

    } catch (err) {

      toast.error(err?.data?.message || "Failed to register account.");

    }

  };



  return (

    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">

      <Card className="w-full max-w-md">

        <CardContent className="pt-6">

          <div className="mb-8 text-center">

            <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>

            <p className="text-sm text-[var(--text-muted)]">Join StreamTime today</p>

          </div>



          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="space-y-2">

              <label className="text-sm font-medium">Full Name</label>

              <Input placeholder="John Doe" {...register("fullName")} />

              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}

            </div>



            <div className="space-y-2">

              <label className="text-sm font-medium">Username</label>

              <Input placeholder="johndoe123" {...register("username")} />

              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}

            </div>



            <div className="space-y-2">

              <label className="text-sm font-medium">Email</label>

              <Input type="email" placeholder="you@example.com" {...register("email")} />

              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}

            </div>



            <div className="space-y-2">

              <label className="text-sm font-medium">Password</label>

              <Input type="password" placeholder="••••••••" {...register("password")} />

              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}

            </div>



            {/* Avatar Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Avatar (Optional)</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="file:mr-4 file:rounded-full file:border-0 file:bg-[var(--surface)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--text-primary)] hover:file:bg-[var(--surface-hover)]"
                  />
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Upload a profile picture (JPEG, PNG, WebP - Max 5MB)
                  </p>
                </div>
              </div>
            </div>



            <Button type="submit" className="w-full" disabled={isLoading}>

              {isLoading ? "Creating account..." : "Sign up"}

            </Button>

          </form>



          <div className="mt-6 text-center text-sm">

            <span className="text-[var(--text-muted)]">Already have an account? </span>

            <Link href="/login" className="font-medium hover:underline">

              Log in

            </Link>

          </div>

        </CardContent>

      </Card>

    </div>

  );

}