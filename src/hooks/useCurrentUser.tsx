import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";


interface userType {
    email: string;
    password: string;
    name: string;
}
const useCurrentUser = () => {
    const [currentUser, setCurrentUser] = useState<userType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            const token = localStorage.getItem("authToken");

            if (!token) {
                setLoading(false);
                return; // No token, user is not logged in
            }

            try {
                const response = await axios.get("https://notifierbackend.onrender.com/api/v1/user/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setCurrentUser(response.data.user);
            } catch (err: any) {
                console.log("Error fetching current user:    axios error hai bhai", err);
                setError(err.response?.data?.error || "Failed to fetch user.");
                toast.error(err.response?.data?.error || "Failed to fetch user.");
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

    return { currentUser, loading, error };
};

export default useCurrentUser;
