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
// import ReactPlayer from "react-player"


const Home = () => {
  const socket = useSocket()
  const { currentUser, } = useCurrentUser();
  const { peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream, setRemoteStream, addIceCandidate } = usePeer();
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
  // const [remoteStreamLocal, setRemoteStreamLocal] = useState<MediaStream | null>(null);

  console.log('>>>>>>>>>>>', declineCall, acceptCall)
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
        await sendStream(stream);
        const offer = await createOffer();
        await peer.setLocalDescription(offer);
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
      await setRemoteAnswer(ans);
    } catch (error) {
      console.log('>>>>>>>>>>> line 93 handleCallAccepted ', error)
    }
    const stream = await getUserMediaStream();
    if (stream) {
      setMyVideoStream(stream);
      await sendStream(stream);
    }

    // Ensure we're listening for tracks after setting the remote description
    peer.addEventListener('track', handleTrackEvent);
  }


  const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
    console.log('Track event received:', event);
    if (event.streams && event.streams[0]) {
      setRemoteStream(event.streams[0]);
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
      await createOffer();
      socket.emit('negotiation-needed', { offer: peer.localDescription, to: callTo });
    } catch (err) {
      console.error('Error during negotiation:', err);
    }
  }, [peer, socket, callTo, createOffer]);


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


  peer.addEventListener("icecandidate", (event) => {
    if (event.candidate) {
      // console.log("New ICE Candidate:", event.candidate);
      socket.emit("ice-candidate", { candidate: event.candidate, to: callTo });
    }
  });



  useEffect(() => {
    socket.on('user-joined', handleNewUserJoin);
    socket.on('joined-room', handleJoinedRoom)
    socket.on('user-joined', handleUserJoined)
    socket.on('incoming-call', handleIncommingCall)
    socket.on('call-accepted', handleCallAccepted)
    socket.on('call-declined', handleCallDeclined)
    socket.on('ice-candidate', ({ candidate }) => {
      // console.log('>>>>>>>>>>>candidate from homne 143', candidate)
      addIceCandidate(new RTCIceCandidate(candidate));
    });
    socket.on('negotiation-needed', async ({ offer, from }) => {
      await peer.setRemoteDescription(offer);
      const answer = await createAnswer(offer);
      socket.emit('negotiation-done', { answer, to: from });
    });
    socket.on('negotiation-done', async ({ answer }) => {
      await setRemoteAnswer(answer);
    });


    peer.addEventListener('icecandidate', handleIceCandidate);
    peer.addEventListener('track', handleTrackEvent);
    peer.addEventListener('negotiationneeded', handleNegotiationNeeded);




    return () => {
      socket.off('user-joined', handleNewUserJoin);
      socket.off('joined-room', handleJoinedRoom)
      socket.off('user-joined', handleUserJoined)
      socket.off('incoming-call', handleIncommingCall)
      socket.off('call-declined', handleCallDeclined)
      socket.off('negotiation-needed');
      socket.off('negotiation-done');

      peer.removeEventListener("icecandidate", handleIceCandidate);
      peer.removeEventListener('track', handleTrackEvent);
      peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);

    };
  }, [socket, peer, handleNewUserJoin, handleJoinedRoom, handleUserJoined, handleIncommingCall, handleCallAccepted, handleCallDeclined, handleIceCandidate, addIceCandidate, handleTrackEvent, handleNegotiationNeeded]);

  useEffect(() => {

    if (!currentUser?.email) return;
    if (currentUser?.email) {
      socket.emit('join-room', { emailId: currentUser?.email })
    }


  }, [currentUser])


  useEffect(() => {
    audioRef.current = new Audio(tune);
  }, []);
  useEffect(() => {
    console.log("My Video Stream:", myVideoStream);
  }, [myVideoStream]);

  useEffect(() => {
    console.log("Remote Stream:", remoteStream);
  }, [remoteStream]);





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
            from={incommingCallFrom}
            setShowCallCard={setShowCallCard}
            audioRef={audioRef}
            setDeclineCall={setDeclineCall}
            setAcceptCall={setAcceptCall}
            createAnswer={createAnswer}
            offer={incommingOffer}
            setMyVideoStream={setMyVideoStream}
            sendStream={sendStream}
          />
        }

        {
          calling &&
          <CallingCard callingTo={callTo} />
        }

      </div>
      {
        (myVideoStream || remoteStream) && (
          <div className="absolute z-50 bg-violet-50 h-screen w-full flex flex-col justify-center items-center gap-4">
            {
              myVideoStream && (
                <video
                  ref={(ref) => {
                    if (ref) ref.srcObject = myVideoStream;
                  }}
                  autoPlay
                  muted
                  width="50"
                  height="50"
                />
              )
            }
            {
              remoteStream && (
                <video
                  ref={(ref) => {
                    if (ref) ref.srcObject = remoteStream;
                  }}
                  autoPlay
                  width="400"
                  height="300"
                />
              )
            }
          </div>
        )
      }
    </div>

  )
}
export default Home