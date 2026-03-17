import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useRequireAuth() {
    const { isAuthenticated } = useSelector((state) => state.auth);
    const router = useRouter();

    // ← Returns a WRAPPER FUNCTION, does not call callback immediately
    const requireAuth = (callback) => (...args) => {
        if (!isAuthenticated) {
            toast.error("Please log in to continue");
            router.push('/login');
            return;
        }
        return callback(...args);  // ← passes form data through
    };

    return requireAuth;  // ← return the function directly, not an object
}