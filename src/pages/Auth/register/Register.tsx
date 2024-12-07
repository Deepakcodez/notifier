import axios from "axios"
import { useState } from "react"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

const Register = () => {
    const navigate = useNavigate()
    const [userData, serUserData] = useState({
        name:"",
        email: "",
        password: ""
    })


    const submitHandler = async () => {
        try {
            const response = await axios.post(
                'http://localhost:8000/api/v1/user/register',
                { ...userData }
            );

            const data = response.data;

            // Check for a successful response
            if (response.status === 201) {
                toast.success(data.message || "User registered successfully");
                console.log("Token:", data.token);
                localStorage.setItem("authToken", data.token);
                navigate('/')
            }
        } catch (err) {

            toast.error("Something went wrong");
            console.error("Error during registration:", err);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col gap-5 justify-center items-center bg-violet-100">
            <div className="flex flex-col items-center border-2 rounded-2xl shadow-2xl shadow-violet-300  gap-6  p-12  border-b-[.5rem] border-b-violet-400" >
                <h1 className="text-2xl text-violet-800 font-bold">Register</h1>

                <div className="flex flex-col gap-4 ">

                <input
                        value={userData.name}
                        onChange={(e) => serUserData({ ...userData, name: e.target.value })}
                        type="text"
                        placeholder="Name"
                        className="border-2 rounded-lg ps-2 bg-violet-200/70 focus:outline-none" />

                    <input
                        value={userData.email}
                        onChange={(e) => serUserData({ ...userData, email: e.target.value })}
                        type="text"
                        placeholder="Email"
                        className="border-2 rounded-lg ps-2 bg-violet-200/70 focus:outline-none" />

                    <input
                        value={userData.password}
                        onChange={(e) => serUserData({ ...userData, password: e.target.value })}
                        type="password"
                        placeholder="Password"
                        className="border-2 rounded-lg ps-2  bg-violet-200/70 focus:outline-none" />

                    <button
                        onClick={submitHandler}
                        className="bg-violet-500 text-white rounded-lg py-1 hover:shadow-xl hover:shadow-violet-300 hover:bg-violet-500/80">
                        Submit
                    </button>
                </div>
            </div>
            <h1 className="text-gray-500">Already have an Account?
                <span onClick={() => navigate("/login")} className="text-violet-700">Login</span >
            </h1>
        </div>
    )
}
export default Register