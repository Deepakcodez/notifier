import { Check, Phone, X } from "lucide-react";
import React from "react";


interface callCardProps {
    socket: any;
    Peer: any;
    from: string;
    setShowCallCard: React.Dispatch<React.SetStateAction<boolean>>,
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    setDeclineCall: React.Dispatch<React.SetStateAction<boolean>>,
    setAcceptCall: React.Dispatch<React.SetStateAction<boolean>>,
    offer: RTCSessionDescriptionInit | null;
    setMyVideoStream: React.Dispatch<any>;
    setcallingStarted: React.Dispatch<React.SetStateAction<boolean>>,
}


const CallCard: React.FC<callCardProps> = ({
    socket,
    Peer,
    from,
    setShowCallCard,
    audioRef,
    setDeclineCall,
    setAcceptCall,
    offer,
    setMyVideoStream,
    setcallingStarted
}) => {


    const onDecline = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setShowCallCard(false)
        setDeclineCall(true)


        socket.emit('call-declined', { from: from })
        setDeclineCall(false)

    }

    const onAccept = async () => {
        console.log('>>>>>>>>>>>trying to accept call with offer', offer)
        setcallingStarted(true)
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setShowCallCard(false)
        setAcceptCall(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            console.log('Stream obtained from receiver:', stream);
            setMyVideoStream((prev: any) => {
                console.log('>>>>>>>>>>>', prev)
                return stream
            });

            const ans = await Peer.getAnswer(offer);
            
                socket.emit('call-accepted', { emailId: from, ans });
            

            for (const track of stream.getTracks()) {
                Peer.peer?.addTrack(track, stream);
            }

        } catch (error) {
            console.error('Error getting user media:', error);
        }




    }

    return (
        <div className=" absolute top-0 right-6 min-w-auto w-[12rem] bg-violet-200 border-2 border-violet-300 rounded-lg p-2 shadow-2xl shadow-violet-300 ">
            <h1 className="text-center text-violet-800 font-bold text-xl opacity-20 mb-2">Incomming call</h1>
            <div className="flex justify-center ">
                <Phone size={40} />
            </div>
            <h1 className="text-center text-violet-800 font-bold text-xl opacity-20 mb-2">{from}</h1>

            <div className="flex">
                <div
                    onClick={onDecline}
                    className="bg-red-500  w-fit  rounded-full p-2 border-2 border-red-600 mx-auto my-2">
                    <X color="white" />
                </div>

                <div
                    onClick={onAccept}
                    className="bg-green-500  w-fit  rounded-full p-2 border-2 border-green-600 mx-auto my-2">
                    <Check color="white" />
                </div>
            </div>
        </div>
    )
}
export default CallCard