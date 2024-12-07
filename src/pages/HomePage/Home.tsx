import { useEffect, useRef, useState } from "react"
import { useSocket } from "../../context/Socketcontext"
import CallButons from "./components/CallButons"
import useCurrentUser from "../../hooks/useCurrentUser"
import toast from "react-hot-toast"
import useAllUsers from "../../hooks/allUsers"
import tune from '../../assets/music/tune.mp3'
import CallCard from "./components/CallCard"
const Home = () => {
  const socket = useSocket()
  const { currentUser, } = useCurrentUser();
  const { users,  } = useAllUsers();
  const [showCallCard, setShowCallCard] = useState(false)
  const [incommingCallFrom, setIncommingCallFrom] = useState("")
  const audioRef = useRef<HTMLAudioElement | null>(null);


  //socket functions
  const handleNewUserJoin = async ({ roomId, emailId }: { roomId: string, emailId: string }) => {
    console.log("new user joined", roomId, emailId);
    socket.emit('call-user', { emailId })

  }


  //for himself
  const handleJoinedRoom = async ({ roomId, emailId }: { roomId: string, emailId: string }) => {
    console.log(`you ${emailId} joined room ${roomId}`);
    toast.success("you joined room")
  }


  //for other users
  const handleUserJoined = async ({ roomId, emailId }: { roomId: string, emailId: string }) => {
    console.log(`${emailId} just joined room ${roomId}`);
  }

  const handleCallUser = (toEmail: string) => {
    socket.emit('call-user', { emailId: currentUser?.email, to: toEmail })
  }

  const handleIncommingCall = async ({ from, to }: { from: string, to: string }) => {
    // if (to !== currentUser?.email) return;
    console.log("incomming call from", from, "to you", to);
    setShowCallCard(true)
    setIncommingCallFrom(from)
    audioRef?.current?.play()
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

    if (!currentUser?.email) return;
    if (currentUser?.email) {
      socket.emit('join-room', { emailId: currentUser?.email })
    }


  }, [currentUser])


useEffect(() => {
  audioRef.current = new Audio(tune);
}, []);

  return (
    <div className="relative w-full h-screen flex gap-12 flex-wrap  bg-violet-100 px-12 py-12">

      {
        users.filter((user) => user.email !== currentUser?.email)
          .map((user, index) => {
            return <div key={index} className="flex flex-col justify-center items-center bg-white p-4 rounded-lg shadow-lg h-[12rem]  w-[15rem] gap-4">
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
              <div onClick={() => handleCallUser(user?.email)} >
                <CallButons />
              </div>
            </div>

          }
          )
      }
      {
        showCallCard &&
        <CallCard from={incommingCallFrom} setShowCallCard={setShowCallCard} audioRef={audioRef}  />
      }

    </div>
  )
}
export default Home