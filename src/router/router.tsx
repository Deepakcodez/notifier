import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from "../pages"
import Navbar from "../pages/HomePage/components/Navbar"
import { SocketProvider } from "../context/Socketcontext"
import Register from "../pages/Auth/register/Register"
import Login from "../pages/Auth/login/Login"
import { PeerProvider } from "../context/Peer"
const Router = () => {
    return (
        <BrowserRouter>
            <Navbar />
            <PeerProvider>
                <SocketProvider>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </SocketProvider>
            </PeerProvider>
        </BrowserRouter>
    )
}
export default Router