import { Check, Phone, X } from "lucide-react";
import React from "react";


interface callCardProps {
   
    from: string;
    setShowCallCard: React.Dispatch<React.SetStateAction<boolean>>,
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    setDeclineCall: React.Dispatch<React.SetStateAction<boolean>>,
}


const CallCard: React.FC<callCardProps> = ({
 
    from,
    setShowCallCard,
    audioRef,
    setDeclineCall


}) => {
   

    const onDecline = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setShowCallCard(false)
        setDeclineCall(true)
        


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

                <div className="bg-green-500  w-fit  rounded-full p-2 border-2 border-green-600 mx-auto my-2">
                    <Check color="white" />
                </div>
            </div>
        </div>
    )
}
export default CallCard