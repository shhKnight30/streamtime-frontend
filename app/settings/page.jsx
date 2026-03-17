"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Camera, Save, Lock, User as UserIcon } from "lucide-react";
import {
  useUpdateAccountDetailsMutation,
  useUpdateAvatarMutation,
  useChangePasswordMutation
} from "@/store/services/userApi";
import { setCredentials } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(50, "Name is too long"),
  email: z.string().email("Invalid email address"),
});



const passwordSchema = z.object({
  oldPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});



export default function SettingsPage() {

  const dispatch = useDispatch();

  const { user, accessToken } = useSelector((state) => state.auth);



  const [updateAccount, { isLoading: isUpdatingProfile }] = useUpdateAccountDetailsMutation();

  const [updateAvatar, { isLoading: isUpdatingAvatar }] = useUpdateAvatarMutation();

  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();



  const [avatarFile, setAvatarFile] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");



  // Profile Form Setup

  const {

    register: registerProfile,

    handleSubmit: handleSubmitProfile,

    reset: resetProfile,

    formState: { errors: profileErrors }

  } = useForm({

    resolver: zodResolver(profileSchema),

    defaultValues: {

      fullName: user?.fullname || "",

      email: user?.email || "",

    }

  });



  // Password Form Setup

  const {

    register: registerPassword,

    handleSubmit: handleSubmitPassword,

    reset: resetPassword,

    formState: { errors: passwordErrors }

  } = useForm({

    resolver: zodResolver(passwordSchema),

  });



  // Sync form defaults if user state changes (e.g., after hydration)

  useEffect(() => {

    if (user) {

      resetProfile({ fullName: user.fullname || "", email: user.email || "" });

      if (!avatarFile) setAvatarPreview(user.avatar || "");

    }

  }, [user, resetProfile, avatarFile]);



  const handleAvatarChange = async (e) => {

    const file = e.target.files?.[0];

    if (!file) return;



    setAvatarFile(file);

    setAvatarPreview(URL.createObjectURL(file));



    // Optional: Auto-upload avatar immediately upon selection

    const formData = new FormData();

    formData.append("avatar", file);



    try {

      const response = await updateAvatar(formData).unwrap();

      // Update Redux state with the new avatar URL returned from the backend

      if (response.data?.avatar) {

        dispatch(setCredentials({

          user: { ...user, avatar: response.data.avatar },

          accessToken

        }));

      }

      toast.success("Avatar updated successfully");

    } catch (err) {

      toast.error("Failed to update avatar");

      setAvatarPreview(user?.avatar || ""); // Revert on failure

      setAvatarFile(null);

    }

  };



  const onProfileSubmit = async (data) => {

    try {

      const response = await updateAccount({
        fullname: data.fullName,
        email: data.email
      }).unwrap();

      // Update local Redux state so the Navbar and other components reflect the new name instantly

      dispatch(setCredentials({

        user: { ...user, fullname: data.fullName, email: data.email },

        accessToken
      }));

      toast.success("Profile updated successfully");

    } catch (err) {

      toast.error(err?.data?.message || "Failed to update profile");

    }

  };



  const onPasswordSubmit = async (data) => {

    try {

      await changePassword({

        oldPassword: data.oldPassword,

        newPassword: data.newPassword

      }).unwrap();



      resetPassword();

      toast.success("Password changed successfully");

    } catch (err) {

      toast.error(err?.data?.message || "Failed to change password");

    }

  };



  if (!user) return null; // Wait for hydration



  return (

    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">

      <div className="mb-8">

        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

        <p className="text-sm text-[var(--text-muted)]">Manage your account settings and preferences.</p>

      </div>



      <Tabs defaultValue="profile" className="w-full">

        <TabsList className="mb-6 w-full justify-start rounded-none border-b border-[var(--border)] bg-transparent p-0">

          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent px-6 py-2 data-[state=active]:border-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none">

            <UserIcon className="mr-2 h-4 w-4" />

            Profile

          </TabsTrigger>

          <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent px-6 py-2 data-[state=active]:border-[var(--text-primary)] data-[state=active]:bg-transparent data-[state=active]:shadow-none">

            <Lock className="mr-2 h-4 w-4" />

            Security

          </TabsTrigger>

        </TabsList>



        {/* PROFILE TAB */}

        <TabsContent value="profile" className="space-y-6">

          <Card>

            <CardHeader>

              <CardTitle>Profile Picture</CardTitle>

              <CardDescription>Update your avatar. Click on the image to upload a new one.</CardDescription>

            </CardHeader>

            <CardContent className="flex items-center gap-6">

              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-raised)] group cursor-pointer">

                <img

                  src={avatarPreview || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"}

                  alt="Avatar preview"

                  className="h-full w-full object-cover"

                />

                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">

                  <Camera className="h-6 w-6 text-white" />

                </div>

                <input

                  type="file"

                  accept="image/*"

                  onChange={handleAvatarChange}

                  disabled={isUpdatingAvatar}

                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"

                />

              </div>

              <div className="text-sm text-[var(--text-muted)]">

                <p>Recommended: Square image, at least 400x400px.</p>

                <p>JPG, PNG, or WebP (Max 2MB).</p>

                {isUpdatingAvatar && <p className="text-blue-500 mt-1 animate-pulse">Uploading...</p>}

              </div>

            </CardContent>

          </Card>



          <Card>

            <CardHeader>

              <CardTitle>Personal Information</CardTitle>

              <CardDescription>Update your basic profile details.</CardDescription>

            </CardHeader>

            <CardContent>

              <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">

                <div className="space-y-2">

                  <label className="text-sm font-medium">Full Name</label>

                  <Input

                    {...registerProfile("fullName")}

                    disabled={isUpdatingProfile}

                    className="max-w-md"

                  />

                  {profileErrors.fullName && <p className="text-xs text-red-500">{profileErrors.fullName.message}</p>}

                </div>



                <div className="space-y-2">

                  <label className="text-sm font-medium">Email Address</label>

                  <Input

                    {...registerProfile("email")}

                    type="email"

                    disabled={isUpdatingProfile}

                    className="max-w-md"

                  />

                  {profileErrors.email && <p className="text-xs text-red-500">{profileErrors.email.message}</p>}

                </div>



                <Button type="submit" disabled={isUpdatingProfile} className="mt-2">

                  <Save className="mr-2 h-4 w-4" />

                  {isUpdatingProfile ? "Saving..." : "Save Changes"}

                </Button>

              </form>

            </CardContent>

          </Card>

        </TabsContent>



        {/* SECURITY TAB */}

        <TabsContent value="security" className="space-y-6">

          <Card>

            <CardHeader>

              <CardTitle>Change Password</CardTitle>

              <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>

            </CardHeader>

            <CardContent>

              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">

                <div className="space-y-2">

                  <label className="text-sm font-medium">Current Password</label>

                  <Input

                    type="password"

                    {...registerPassword("oldPassword")}

                    disabled={isChangingPassword}

                    className="max-w-md"

                  />

                  {passwordErrors.oldPassword && <p className="text-xs text-red-500">{passwordErrors.oldPassword.message}</p>}

                </div>



                <div className="space-y-2">

                  <label className="text-sm font-medium">New Password</label>

                  <Input

                    type="password"

                    {...registerPassword("newPassword")}

                    disabled={isChangingPassword}

                    className="max-w-md"

                  />

                  {passwordErrors.newPassword && <p className="text-xs text-red-500">{passwordErrors.newPassword.message}</p>}

                </div>



                <div className="space-y-2">

                  <label className="text-sm font-medium">Confirm New Password</label>

                  <Input

                    type="password"

                    {...registerPassword("confirmPassword")}

                    disabled={isChangingPassword}

                    className="max-w-md"

                  />

                  {passwordErrors.confirmPassword && <p className="text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>}

                </div>



                <Button type="submit" disabled={isChangingPassword} className="mt-2">

                  <Lock className="mr-2 h-4 w-4" />

                  {isChangingPassword ? "Updating..." : "Update Password"}

                </Button>

              </form>

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>

    </div>

  );

}