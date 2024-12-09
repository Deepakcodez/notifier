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

} | null>(null);

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    //Creating peer connection 
    const peer = React.useMemo(() => new RTCPeerConnection(peerConfiguration), []);
    const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
    const [iceCandidateQueue, setIceCandidateQueue] = useState<RTCIceCandidate[]>([]);
    console.log('>>>>>>>>>>>', iceCandidateQueue)
    const createOffer = async () => {
        const offer = await peer.createOffer();
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
        if (peer.signalingState !== "have-local-offer") {
            console.warn("Skipping setRemoteAnswer: Incorrect signaling state", peer.signalingState);
            return;
        }
        try {
            await peer.setRemoteDescription(answer);
            console.log("Remote answer set successfully");
        } catch (error) {
            console.error("Failed to set remote answer:", error);
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
            value={{ peer, createOffer, createAnswer, setRemoteAnswer, sendStream, remoteStream, addIceCandidate }}>
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
