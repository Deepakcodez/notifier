import { useCallback, useEffect, useRef, useState } from "react"
import { useSocket } from "../../context/Socketcontext"
import CallButons from "./components/CallButons"
import useCurrentUser from "../../hooks/useCurrentUser"
import toast from "react-hot-toast"
import useAllUsers from "../../hooks/allUsers"
import tune from '../../assets/music/tune.mp3'
import CallCard from "./components/CallCard"
import CallingCard from "./components/CallingCard"
import ReactPlayer from "react-player"
import Peer from "../../utils/Peer"


const Home = () => {
  const socket = useSocket()
  const { currentUser, } = useCurrentUser();
  const { users, } = useAllUsers();
  const [showCallCard, setShowCallCard] = useState(false)
  const [incommingCallFrom, setIncommingCallFrom] = useState("")
  const [declineCall, setDeclineCall] = useState<boolean>(false)
  const [acceptCall, setAcceptCall] = useState<boolean>(false)
  const [callTo, setCallTo] = useState<string>("")
  const [calling, setcalling] = useState<boolean>(false)
  const [myVideoStream, setMyVideoStream] = useState<any>(null)
  const [remoteVideoStream, setRemoteVideoStream] = useState<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [incommingOffer, setIncommingOffer] = useState<RTCSessionDescriptionInit | null>(null)
  // const [remoteStreamLocal, setRemoteStreamLocal] = useState<MediaStream | null>(null);

  console.log('>>>>>>>>>>>', declineCall, acceptCall)

  // Get user media stream
  const getUserMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyVideoStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

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
    try {
      const stream = await getUserMediaStream();
      if (stream) {
        setMyVideoStream(stream);
        const offer = await Peer.getOffer();
        // await sendStream(stream);
        // const offer = await createOffer();
        // await peer.setLocalDescription(offer);
        socket?.emit('call-user', { offer, emailId: 'currentUser?.email', to: toEmail });
        setcalling(true);
        setCallTo(toEmail);
      }
    } catch (error) {
      console.error("Error in handleCallUser:", error);
    }
  }


  // from-->  from where the call is coming
  //to -->  user itself
  const handleIncommingCall = async ({ from, to, offer }:
    { from: string, to: string, offer: RTCSessionDescriptionInit }) => {
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
    console.log('Call accepted with answer now try to set remote answer', ans);
    setcalling(false)
    try {
      // await setRemoteAnswer(ans);
      Peer.setLocalDescription(ans)
    } catch (error) {
      console.log('>>>>>>>>>>> Error in set in local description ', error)
    }
    const stream = await getUserMediaStream();
    if (stream) {
      setMyVideoStream(stream);

      for(const track of stream.getTracks()) {
        Peer.peer?.addTrack(track, stream);
      
    }

    
    // peer.addEventListener('track', handleTrackEvent);
  }}


  const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
    console.log('Track event received:', event);
    if (event.streams && event.streams[0]) {
        setRemoteVideoStream(event.streams[0]);
      // setRemoteStream(event.streams[0]);
    } else {
      console.warn('No streams in track event');
    }
  }, []);

  const handleCallDeclined = async ({ from }: { from: string, }) => {
    // console.log("call declined from", from, "to you",);
    toast.error(`${from} declined your call`)
    setDeclineCall(false)
    setcalling(false)
    setCallTo("")
  }


  // Handle ICE candidate event
  const handleIceCandidate = useCallback((event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { candidate: event.candidate, to: callTo });
    }
  }, [socket, callTo]);


  // Handle negotiation needed event
  const handleNegotiationNeeded = useCallback(async () => {
    try {
      
      const offer = await Peer.getOffer();
      socket.emit('negotiation-needed', { offer, to: callTo });
    } catch (err) {
      console.error('Error during negotiation:', err);
    }
  }, [, socket, callTo, ]);


  


  // peer.addEventListener("icecandidate", (event) => {
  //   if (event.candidate) {
  //     // console.log("New ICE Candidate:", event.candidate);
  //     socket.emit("ice-candidate", { candidate: event.candidate, to: callTo });
  //   }
  // });



  useEffect(() => {
    socket.on('user-joined', handleNewUserJoin);
    socket.on('joined-room', handleJoinedRoom)
    socket.on('user-joined', handleUserJoined)
    socket.on('incoming-call', handleIncommingCall)
    socket.on('call-accepted', handleCallAccepted)
    socket.on('call-declined', handleCallDeclined)
    // socket.on('ice-candidate', ({ candidate }) => {
      // console.log('>>>>>>>>>>>candidate from homne 143', candidate)
      // addIceCandidate(new RTCIceCandidate(candidate));
    // });
    socket.on('negotiation-needed', async ({ offer, from }) => {
      // await peer.setRemoteDescription(offer);
      // const answer = await createAnswer(offer);
      const answer = await Peer.getAnswer(offer);

      socket.emit('negotiation-done', { answer, to: from });
    });
    socket.on('negotiation-done', async ({from, answer }) => {
      // await setRemoteAnswer(answer);
      console.log('>>>>>>>>>>> negotiation done from ',from,"with ans", answer)
      await Peer.setLocalDescription(answer)
    });

    Peer.peer?.addEventListener('track', handleTrackEvent);
    // peer.addEventListener('icecandidate', handleIceCandidate);
    Peer.peer?.addEventListener('negotiationneeded', handleNegotiationNeeded);




    return () => {
      socket.off('user-joined', handleNewUserJoin);
      socket.off('joined-room', handleJoinedRoom)
      socket.off('user-joined', handleUserJoined)
      socket.off('incoming-call', handleIncommingCall)
      socket.off('call-declined', handleCallDeclined)
      socket.off('negotiation-needed');
      socket.off('negotiation-done');

      // peer.removeEventListener("icecandidate", handleIceCandidate);  
      Peer.peer?.removeEventListener('track', handleTrackEvent);
      Peer.peer?.removeEventListener("negotiationneeded", handleNegotiationNeeded);

    };
  }, [socket,  handleNewUserJoin, handleJoinedRoom, handleUserJoined, handleIncommingCall, handleCallAccepted, handleCallDeclined, handleIceCandidate,  handleTrackEvent, handleNegotiationNeeded]);

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
    <div className="relative w-full min-h-screen h-auto flex gap-12 flex-wrap  bg-violet-100 px-12 py-12">
      <div className="relative w-full h-full flex gap-12 flex-wrap ">

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
            Peer={Peer}
            from={incommingCallFrom}
            setShowCallCard={setShowCallCard}
            audioRef={audioRef}
            setDeclineCall={setDeclineCall}
            setAcceptCall={setAcceptCall}
            offer={incommingOffer}
            setMyVideoStream={setMyVideoStream}
            
          />
          
        }

        {
          calling &&
          <CallingCard callingTo={callTo} />
        }

      </div>
      {
        (myVideoStream ) && (
          <div className="absolute z-50 bg-violet-50 h-screen w-full flex flex-col justify-center items-center gap-4">
            <ReactPlayer url={myVideoStream} playing muted />
           
          </div>
        )
      }
      {
        (remoteVideoStream ) && (
          <div className="absolute z-50 bg-violet-50 h-screen w-full flex flex-col justify-center items-center gap-4">
            <ReactPlayer url={remoteVideoStream} playing muted />
           
          </div>
        )
      }
    </div>

  )
}

export default Home