"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Save, Lock, User as UserIcon } from "lucide-react";

// API & Redux
import {
  useUpdateAccountDetailsMutation,
  useChangePasswordMutation
} from "@/store/services/userApi";
import { setCredentials } from "@/store/slices/authSlice";

// Components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProfileImageSettings } from "@/components/dashboard/ProfileImageSettings"; // ✅ Imported the new component

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
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

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
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data) => {
    try {
      await updateAccount({
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
          
          {/* ✅ The newly integrated Avatar & Cover Image component */}
          <ProfileImageSettings />

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