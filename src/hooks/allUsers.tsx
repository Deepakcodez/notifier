import { useState, useEffect } from "react";
import axios from "axios";


interface userType{
    email:string,
    name:string,
    _id:string

}
const useAllUsers = () => {
  const [users, setUsers] = useState<userType[] | []>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get("https://notifierbackend.onrender.com/api/v1/user/all");
        setUsers(response.data.users); // Assuming the API response has a `users` array
      } catch (err:any) {
        console.error("Error fetching users:", err);
        setError(err.response?.data?.error || "Failed to fetch users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array to fetch users only on mount

  return { users, loading, error };
};

export default useAllUsers;
