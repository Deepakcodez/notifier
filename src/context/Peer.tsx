import React, { useCallback, useContext, useEffect, useState } from "react";
import peerConfiguration from "../utils/stunServers";


const PeerContext = React.createContext<{
    peer: RTCPeerConnection;
    createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
    createOffer: () => Promise<RTCSessionDescriptionInit>;
    setRemoteAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
    sendStream: (stream: MediaStream) => Promise<void>;
    remoteStream: MediaStream | null;
    addIceCandidate: (candidate: RTCIceCandidate) => Promise<void>;
    setRemoteStream: (stream: MediaStream) => void;

} | null>(null);

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    //Creating peer connection 
    const peer = React.useMemo(() => new RTCPeerConnection(peerConfiguration), []);
    const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
    const [iceCandidateQueue, setIceCandidateQueue] = useState<RTCIceCandidate[]>([]);
    console.log('>>>>>>>>>>>', iceCandidateQueue)


    const createOffer = async () => {
        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peer.setLocalDescription(offer);
        return offer;
      };

    const createAnswer = async (offer: RTCSessionDescriptionInit) => {

        console.log('>>>>>>>>>>>in peer', offer)
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
    }

    const setRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
        if (peer.signalingState === "have-local-offer") {
          try {
            // Ensure the answer has the same m-line order as the offer
            const offerSdp = peer.localDescription?.sdp;
            const answerSdp = answer.sdp;
            
            if (offerSdp && answerSdp) {
              const reorderedAnswerSdp = reorderSdpMLines(offerSdp, answerSdp);
              const reorderedAnswer = new RTCSessionDescription({
                type: 'answer',
                sdp: reorderedAnswerSdp
              });
              await peer.setRemoteDescription(reorderedAnswer);
            } else {
              await peer.setRemoteDescription(answer);
            }
            console.log("Remote answer set successfully");
          } catch (error) {
            console.error("Failed to set remote answer:", error);
          }
        } else {
          console.warn("Attempted to set remote answer in incorrect state:", peer.signalingState);
        }
      }


    // Send a media stream
    const sendStream = async (stream: MediaStream) => {
        stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
        });
    };

    // Handle incoming tracks
    const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
        console.log('Track event received:', event);
        if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
        } else {
            console.warn('No streams in track event');
        }
    }, []);



    const addIceCandidate = async (candidate: RTCIceCandidate) => {
        try {
            if (peer.remoteDescription && peer.remoteDescription.type) {
                await peer.addIceCandidate(candidate);
            } else {
                setIceCandidateQueue(prev => [...prev, candidate]);
            }
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    };


    const reorderSdpMLines = (offerSdp: string, answerSdp: string): string => {
        const offerLines = offerSdp.split('\r\n');
        const answerLines = answerSdp.split('\r\n');
        const offerMLines = offerLines.filter(line => line.startsWith('m='));
        const answerMLines = answerLines.filter(line => line.startsWith('m='));
         console.log('>>>>>>>>>>>', answerMLines)
        let reorderedSdp = '';
        let currentSection = '';
        
        for (const line of answerLines) {
          if (line.startsWith('m=')) {
            if (currentSection) {
              reorderedSdp += currentSection;
            }
            const matchingMLine = offerMLines.find(offerLine => 
              offerLine.split(' ')[0] === line.split(' ')[0]
            );
            currentSection = matchingMLine ? matchingMLine + '\r\n' : line + '\r\n';
          } else {
            currentSection += line + '\r\n';
          }
        }
        
        if (currentSection) {
          reorderedSdp += currentSection;
        }
        
        return reorderedSdp.trim();
      };


    // Set up event listeners
    useEffect(() => {
        peer.addEventListener('track', handleTrackEvent);

        peer.addEventListener('connectionstatechange', () => {
            console.log('Connection state:', peer.connectionState);
        });

        peer.addEventListener('icecandidateerror', (event) => {
            console.error('ICE candidate error:', event);
        });

        return () => {
            peer.removeEventListener('track', handleTrackEvent);
            peer.removeEventListener('connectionstatechange', () => { });
            peer.removeEventListener('icecandidateerror', () => { });
        };
    }, [peer, handleTrackEvent]);

    // Log remote stream changes
    useEffect(() => {
        if (remoteStream) {
            console.log("Remote Stream is active:", remoteStream.active);
            remoteStream.getTracks().forEach(track => {
                console.log(`Track kind: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`);
            });
        }
    }, [remoteStream]);

    return (
        <PeerContext.Provider
            value={{ peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream, addIceCandidate, setRemoteStream }}>
            {children}
        </PeerContext.Provider>
    );
};



export const usePeer = () => {
    const context = useContext(PeerContext);
    if (!context) {
        throw new Error("usePeer must be used within a PeerProvider");
    }
    return context;
};
