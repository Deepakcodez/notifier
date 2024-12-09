import { GithubIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Navbar = () => {

  const navigate = useNavigate()
  return (
    <div className="h-12 w-full bg-violet-500 flex justify-between items-center md:px-12 px-4">
      <h1 onClick={(() => navigate('/'))} className="text-lg  font-bold  ">Chatter</h1>

      <div className="flex items-center md:gap-8 gap-4">
        <h1 onClick={(() => navigate('/register'))} className="bg-white rounded-full px-4 py-1  border-gray-500 border-2 shadow-inner">Register</h1>
        <div onClick={()=> window.open("https://github.com/Deepakcodez/notifier", "_blank")} className="bg-white rounded-full p-2 border-gray-500 border-2 shadow-inner">
          <GithubIcon size={18} />
        </div>
      </div>
    </div>
  )
}
export default Navbar