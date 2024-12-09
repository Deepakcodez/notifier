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
  const [isCallingStart, setIsCallingStart] = useState<boolean>(false)

  console.log('>>>>>>>>>>>', declineCall, acceptCall)

  // Get user media stream
  const getUserMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyVideoStream((prev: any) => {
        console.log('>>>>>>>>>>>prev', prev)
        return stream
      });
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
      setIsCallingStart(true)
      setMyVideoStream(stream);
      const offer = await Peer.getOffer();
      socket?.emit('call-user', { offer, emailId: 'currentUser?.email', to: toEmail });
      setcalling(true);
      setCallTo(toEmail);

    } catch (error) {
      console.error("Error in handleCallUser:", error);
      setIsCallingStart(false)
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
    setIsCallingStart(false)
    try {
      Peer.setLocalDescription(ans)
    } catch (error) {
      console.log('>>>>>>>>>>> Error in set in local description ', error)
    }
    const stream = await getUserMediaStream();
    if (stream) {
      // setMyVideoStream(stream);
      for (const track of stream.getTracks()) {
        Peer.peer?.addTrack(track, stream);
      }
      // peer.addEventListener('track', handleTrackEvent);
    } else {
      console.log('>>>>>>>>>>>not stream')
    }
  }


  const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
    console.log('Track event received:', event);
    if (event.streams) {
      setRemoteVideoStream(event.streams[0]);

    } else {
      console.warn('No streams in track event');
      toast.error('TRY AGAIN')
      setIsCallingStart(false)
    }
  }, []);

  const handleCallDeclined = async ({ from }: { from: string, }) => {
    // console.log("call declined from", from, "to you",);
    setIsCallingStart(false)
    toast.error(`${from} declined your call`)
    setDeclineCall(false)
    setcalling(false)
    setCallTo("")
  }


  // Handle ICE candidate event
  // const handleIceCandidate = useCallback((event: RTCPeerConnectionIceEvent) => {
  //   if (event.candidate) {
  //     socket.emit('ice-candidate', { candidate: event.candidate, to: callTo });
  //   }
  // }, [socket, callTo]);


  // Handle negotiation needed event
  const handleNegotiationNeeded = useCallback(async () => {
    try {

      const offer = await Peer.getOffer();
      socket.emit('negotiation-needed', { offer, to: callTo });
    } catch (err) {
      console.error('Error during negotiation:', err);
    }
  }, [, socket, callTo,]);

  const handleNegotiationDone = useCallback(async ({ from, answer }: { from: string, answer: RTCSessionDescriptionInit }) => {
    console.log('>>>>>>>>>>>handleNegotiationDone from ', from, answer)
    try {
      if (Peer.peer?.signalingState === "stable") {
        console.warn("Signaling state is stable; skipping setLocalDescription.");
        return;
      }

      console.log("Setting local description with answer:", answer);
      await Peer.setLocalDescription(answer);
    } catch (error) {
      console.error("Failed to set local description:", error);
    }
  }, [socket])

  useEffect(() => {
    socket.on('user-joined', handleNewUserJoin);
    socket.on('joined-room', handleJoinedRoom)
    socket.on('user-joined', handleUserJoined)
    socket.on('incoming-call', handleIncommingCall)
    socket.on('call-accepted', handleCallAccepted)
    socket.on('call-declined', handleCallDeclined)

    socket.on('negotiation-needed', async ({ offer, from }) => {

      const answer = await Peer.getAnswer(offer);

      socket.emit('negotiation-done', { answer, to: from });
    });
    socket.on('negotiation-done', handleNegotiationDone);

    Peer.peer?.addEventListener('track', handleTrackEvent);
    Peer.peer?.addEventListener('negotiationneeded', handleNegotiationNeeded);




    return () => {
      socket.off('user-joined', handleNewUserJoin);
      socket.off('joined-room', handleJoinedRoom)
      socket.off('user-joined', handleUserJoined)
      socket.off('incoming-call', handleIncommingCall)
      socket.off('call-declined', handleCallDeclined)
      socket.off('negotiation-needed');
      socket.off('negotiation-done');


      Peer.peer?.removeEventListener('track', handleTrackEvent);
      Peer.peer?.removeEventListener("negotiationneeded", handleNegotiationNeeded);

    };
  }, [socket, handleNewUserJoin, handleJoinedRoom, handleUserJoined, handleIncommingCall, handleCallAccepted, handleCallDeclined, handleTrackEvent, handleNegotiationNeeded]);

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
    console.log('>>>>>>>>>>>my video stream', myVideoStream)
    console.log('>>>>>>>>>>>remote video stream', remoteVideoStream)
  }, [myVideoStream, remoteVideoStream])



  return (
    <div className="relative w-full min-h-screen h-auto flex  flex-wrap  bg-violet-100">
      <div className="relative w-full h-full flex  gap-1 md:gap-6 flex-wrap md:p-12 p-4">

        {
          users.filter((user) => user.email !== currentUser?.email)
            .map((user, index) => {
              return <div key={index} className="flex md:flex-col md:justify-center justify-between items-center bg-white p-4 rounded-lg shadow-lg md:h-[12rem] h-fit   md:w-[15rem] w-full  gap-4">
                <div>
                  <h1 className="md:text-2xl  font-bold md:text-center">{user.name}</h1>
                  <p className="text-gray-500 md:text-sm text-xs">{user.email}</p>
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
        isCallingStart &&
        <div className="absolute bg-violet-100 h-screen w-fit flex ">
          {myVideoStream && (
            <div className="w-1/12 h-1/12 absolute top-0">
              <ReactPlayer
                url={myVideoStream}
                playing
                muted
                width="100%"
                height="100%"
                style={{ backgroundColor: 'red' }}
              />
            </div>
          )}
          {remoteVideoStream && (
            <div className="relative ">
              <ReactPlayer
                url={remoteVideoStream}
                playing
                width="100%"
                height="100%"
                style={{ backgroundColor: '#9a5fff' }}
              />

              <div className="w-4/12 h-4/12 absolute top-0">
                <ReactPlayer
                  url={myVideoStream}
                  playing
                  muted
                  width="100%"
                  height="100%"
                  style={{ backgroundColor: 'red' }}
                />
              </div>
            </div>
          )}
        </div>
      }

    </div>

  )
}

export default Home