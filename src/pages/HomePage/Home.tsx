import { useEffect, useState } from "react"
import { useSocket } from "../../context/Socketcontext"
import CallButons from "./components/CallButons"

const Home = () => {
  const socket = useSocket()
  const [myEmail, setMyEmail] = useState<string>("")
  const users = [
    {
      name: "dk",
      email: "dk@gmail.com",
    }, {
      name: "abhi",
      email: "abhi@gmail.com",
    },
    {
      name: "suraj",
      email: "suraj@gmail.com",
    }, {
      name: "karma",
      email: "karan@gmail.com",
    }
  ]


  //socket functions
  const handleNewUserJoin = async ({ roomId, emailId }: { roomId: string, emailId: string }) => {
    console.log("new user joined", roomId, emailId);
    socket.emit('call-user', { emailId })

  }


  //for himself
  const handleJoinedRoom = async ({ roomId, emailId }: { roomId: string, emailId: string }) => {
    console.log(`you ${emailId} joined room ${roomId}`);
  }


  //for other users
  const handleUserJoined = async ({ roomId, emailId }: { roomId: string, emailId: string }) => {
    console.log(`${emailId} just joined room ${roomId}`);
  }

  const handleCallUser=()=>{
    socket.emit('call-user', { emailId: myEmail, to: "dk@gmail.com"})
  }
  
  const handleIncommingCall = async ({ from, to }: { from: string, to: string }) => {
    console.log("incomming call from", from, "to you", to);
  }




  useEffect(() => {
    socket.on('user-joined', handleNewUserJoin);
    socket.on('joined-room', handleJoinedRoom)
    socket.on('user-joined', handleUserJoined)
    socket.on('incoming-call', handleIncommingCall)



    return () => {
      socket.off('user-joined', handleNewUserJoin);

    };
  }, [socket,]);

  useEffect(() => {
    socket.emit('join-room', { emailId: myEmail })

  },[ myEmail])

  return (
    <div className="w-full h-screen flex gap-12  bg-violet-100 px-12 py-12">
    <input
     value={myEmail}
      onChange={(e) => setMyEmail(e.target.value)}
      className="border border-gray-300 rounded-lg p-2"
      placeholder="Enter your email"
    />
      {
        users.map((user, index) => {
          return <div key={index} className="flex flex-col justify-center items-center bg-white p-4 rounded-lg shadow-lg h-[12rem]  w-[15rem] gap-4">
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
            <div onClick={handleCallUser} >
              <CallButons />
            </div>
          </div>

        }
        )
      }
    </div>
  )
}
export default Home