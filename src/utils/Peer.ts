class PeerService {
    public peer: RTCPeerConnection | null;
  
    constructor() {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
    }
  

     
     
    async getAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
      if (!this.peer) {
        throw new Error("Peer connection not initialized");
      }
  
      try {
        await this.peer.setRemoteDescription(offer);
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(new RTCSessionDescription(answer));
        return this.peer.localDescription as RTCSessionDescriptionInit;
      } catch (error) {
        console.error("Error generating answer:", error);
        throw error;
      }
    }
  
    
    async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
      if (!this.peer) {
        throw new Error("Peer connection not initialized");
      }
  
      try {
        await this.peer.setRemoteDescription(new RTCSessionDescription(description));
      } catch (error) {
        console.error("Error setting local description:", error);
        throw error;
      }
    }
  
    
    async getOffer(): Promise<RTCSessionDescriptionInit> {
      if (!this.peer) {
        throw new Error("Peer connection not initialized");
      }
  
      try {
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(new RTCSessionDescription(offer));
        return this.peer.localDescription as RTCSessionDescriptionInit;
      } catch (error) {
        console.error("Error generating offer:", error);
        throw error;
      }
    }
  }
  
  export default new PeerService();
  