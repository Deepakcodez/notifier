import { useCallback, useEffect, useRef, useState } from "react"
import { useSocket } from "../../context/Socketcontext"
import CallButons from "./components/CallButons"
import useCurrentUser from "../../hooks/useCurrentUser"
import toast from "react-hot-toast"
import useAllUsers from "../../hooks/allUsers"
import tune from '../../assets/music/tune.mp3'
import CallCard from "./components/CallCard"
import CallingCard from "./components/CallingCard"
import { usePeer } from "../../context/Peer"
import ReactPlayer from "react-player"


const Home = () => {
  const socket = useSocket()
  const { currentUser, } = useCurrentUser();
  const { peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream } = usePeer();
  const { users, } = useAllUsers();
  const [showCallCard, setShowCallCard] = useState(false)
  const [incommingCallFrom, setIncommingCallFrom] = useState("")
  const [declineCall, setDeclineCall] = useState<boolean>(false)
  const [acceptCall, setAcceptCall] = useState<boolean>(false)
  const [callTo, setCallTo] = useState<string>("")
  const [calling, setcalling] = useState<boolean>(false)
  const [myVideoStream, setMyVideoStream] = useState<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [incommingOffer, setIncommingOffer] = useState<RTCSessionDescriptionInit | null>(null)


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

  const handleCallUser = async (toEmail: string) => {
    const offer = await createOffer();
    socket.emit('call-user', { offer, emailId: currentUser?.email, to: toEmail })
    setcalling(true)
    setCallTo(toEmail);
  }

  const handleIncommingCall = async ({ from, to, offer }: { from: string, to: string, offer: any }) => {
    console.log("incomming call from", from, "to you", to, "with offer", offer);
    setShowCallCard(true)
    setIncommingCallFrom(from)
    setIncommingOffer(offer)
    try {
      audioRef?.current?.play().catch((err) => {
        console.error("Audio playback failed:", err);
      });
    } catch (error) {
      console.warn("Audio autoplay blocked. User interaction needed.");
    }
    setCallTo(from)
  }

  const handleCallAccepted = async ({ ans }: { ans: RTCSessionDescriptionInit }) => {
    console.log('Call accepted with answer', ans);
    let stream = await getUserMediaStream();
    await setRemoteAnswer(ans);
    if (stream) {
      await sendStream(stream);
    }
  }

  const handleCallDeclined = async ({ from }: { from: string, }) => {
    console.log("call declined from", from, "to you",);
    toast.error(`${from} declined your call`)
    setDeclineCall(false)
    setcalling(false)
    setCallTo("")
  }


  // Handle ICE candidate event
  const handleIceCandidate = useCallback((event: any) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { candidate: event.candidate, to: callTo });
    }
  }, [socket, callTo]);


  // Handle negotiation needed event
  const handleNegotiationNeeded = useCallback(async () => {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('call-user', { offer: peer.localDescription, emailId: callTo });
    } catch (err) {
      console.error('Error during negotiation:', err);
    }
  }, [peer, socket, callTo]);


  // Get user media stream
  const getUserMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setMyVideoStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };




  useEffect(() => {
    socket.on('user-joined', handleNewUserJoin);
    socket.on('joined-room', handleJoinedRoom)
    socket.on('user-joined', handleUserJoined)
    socket.on('incoming-call', handleIncommingCall)
    socket.on('call-accepted', handleCallAccepted)
    socket.on('call-declined', handleCallDeclined)
    socket.on('ice-candidate', ({ candidate }) => {
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    });

    peer.addEventListener('icecandidate', handleIceCandidate);
    peer.addEventListener('negotiationneeded', handleNegotiationNeeded);



    return () => {
      socket.off('user-joined', handleNewUserJoin);
      socket.off('joined-room', handleJoinedRoom)
      socket.off('user-joined', handleUserJoined)
      socket.off('incoming-call', handleIncommingCall)
      socket.off('call-declined', handleCallDeclined)

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
        <CallCard
          socket={socket}
          from={incommingCallFrom}
          setShowCallCard={setShowCallCard}
          audioRef={audioRef}
          setDeclineCall={setDeclineCall}
          setAcceptCall={setAcceptCall}
          createAnswer={createAnswer}
          offer={incommingOffer}
        />
      }

      {
        calling &&
        <CallingCard callingTo={callTo} />
      }

      {
        myVideoStream &&
        <ReactPlayer url={myVideoStream} playing muted width="400px" height="300px" />
      }

      {
        remoteStream &&
        <ReactPlayer url={remoteStream} playing width="400px" height="300px" />

      }


    </div>
  )
}
export default Home