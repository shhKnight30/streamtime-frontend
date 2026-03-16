"use client"

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, logoutUser } from "@/store/slices/authSlice";
import { useGetCurrentUserQuery } from "@/store/services/userApi";

export function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  
  // 1. Ask the backend if we have a valid session
  const { data, isSuccess, isError, isLoading } = useGetCurrentUserQuery();

  useEffect(() => {
    // 2. If backend says yes, log the user in
    if (isSuccess && data?.data) {
      dispatch(setCredentials({
        user: data.data,
        accessToken: "persisted",
      }));
    } 
    // 3. If backend says no (401), ensure they are logged out
    else if (isError) {
      dispatch(logoutUser());
    }
  }, [isSuccess, isError, data, dispatch]);

  // 4. Don't flash the logged-out UI while checking
  if (isLoading) return null; 

  return <>{children}</>;
}