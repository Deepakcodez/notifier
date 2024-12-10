class PeerService {
    public peer: RTCPeerConnection | null;
    private lastOffer: RTCSessionDescriptionInit | null = null;
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
      if (this.peer.signalingState !== "stable") {
        await Promise.all([
          this.peer.setLocalDescription({ type: "rollback" }),
          this.peer.setRemoteDescription(new RTCSessionDescription(offer))
        ]);
      } else {
        await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
      }
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);
      return this.peer.localDescription as RTCSessionDescriptionInit;
    }
  
    
    async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {

      if (!this.peer) {
        throw new Error("Peer connection not initialized");
      }
      console.log("Setting remote description, current signaling state:", this.peer.signalingState);
      try {
        if (this.peer.signalingState !== "stable") {
          console.log("Signaling state is not stable. Applying rollback...");
          await this.peer.setLocalDescription({ type: "rollback" });
        }
        await this.peer.setRemoteDescription(new RTCSessionDescription(description));
      } catch (error) {
        console.error("Error setting remote description:", error);
        throw error;
      }
    }
  
    
    async getOffer(): Promise<RTCSessionDescriptionInit> {
      if (!this.peer) {
        throw new Error("Peer connection not initialized");
      }
  
      try {
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);
        return this.peer.localDescription as RTCSessionDescriptionInit;
      } catch (error) {
        console.error("Error generating offer:", error);
        throw error;
      }
    }

    async handleNegotiationNeeded(): Promise<RTCSessionDescriptionInit> {
      if (!this.peer) {
        throw new Error("Peer connection not initialized");
      }
      
    console.log("Handling negotiation needed, current signaling state:", this.peer.signalingState);
    try {
      const offer = await this.peer.createOffer();
      if (this.lastOffer && this.lastOffer.sdp) {
        offer.sdp = this.reorderSDP(this.lastOffer.sdp, offer.sdp || "");
      }
      await this.peer.setLocalDescription(offer);
      this.lastOffer = offer;
      return offer;
    } catch (error) {
      console.error("Error in handleNegotiationNeeded:", error);
      throw error;
    }
  }

  private reorderSDP(previousSDP: string, newSDP: string): string {
    const previousMLines = this.extractMLines(previousSDP);
    const newMLines = this.extractMLines(newSDP);

    const reorderedMLines = previousMLines.map(pLine => 
      newMLines.find(nLine => nLine.startsWith(pLine.split(' ')[0])) || pLine
    );

    const sdpLines = newSDP.split('\n');
    const mLineIndex = sdpLines.findIndex(line => line.startsWith('m='));
    
    return [
      ...sdpLines.slice(0, mLineIndex),
      ...reorderedMLines,
      ...sdpLines.slice(mLineIndex + newMLines.length)
    ].join('\n');
  }

  private extractMLines(sdp: string): string[] {
    return sdp.split('\n').filter(line => line.startsWith('m='));
  }
}
  
  export default new PeerService();
  