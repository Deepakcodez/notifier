import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from "../pages"
import Navbar from "../pages/HomePage/components/Navbar"
import { SocketProvider } from "../context/Socketcontext"
const Router = () => {
    return (
        <BrowserRouter>
            <Navbar />
            <SocketProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </SocketProvider>

        </BrowserRouter>
    )
}
export default Router