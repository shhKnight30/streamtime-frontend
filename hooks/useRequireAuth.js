import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useRequireAuth() {
    const { isAuthenticated } = useSelector((state) => state.auth);
    const router = useRouter();

    const requireAuth = (callback) => {
        if (!isAuthenticated) {
            toast.error("Please log in to continue");
            router.push('/login');
            return;
        }
        callback();
    };

    return { requireAuth, isAuthenticated };
}