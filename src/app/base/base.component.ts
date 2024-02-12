import { Component, ElementRef, ViewChild } from '@angular/core';
import { SignalRSrv } from '../service/signalr.service';
import { StateService } from '../service/state.service';
import { HubConnectionState } from '@microsoft/signalr/dist/esm/HubConnection';
enum CodecEnum {
  H264 = 'H264',
  VP8 = 'VP8',
  VP9 = 'VP9',
  AAC = 'AAC',
  Opus = 'Opus',
  PCM = 'PCM',
  // Add more codec values as needed
}
@Component({
  selector: 'app-base',
  standalone: true,
  templateUrl: './base.component.html'
})
export class BaseComponent {
  constructor(protected readonly signalr: SignalRSrv, protected readonly state: StateService) {

  }
  preferredCodec: CodecEnum = CodecEnum.H264;
  @ViewChild('localVideo') localVideo: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo: ElementRef<HTMLVideoElement>;
  peerConnectionConfig: RTCConfiguration = {
    iceServers: [
      { urls: "turn:15.185.116.59:3479", username: "admin", credential: "admin" }
    ],
    iceCandidatePoolSize: 10
  };
  peerConnection: any;
  userdetails: any = { from: '', to: '' };
  ConnecttoSignalR() {
    this.signalr.createConnection().then((connectionId: any) => {
      this.userdetails.from = this.state.getState().socketId;
      this.AccessWebCamera();
    }).catch(err => { });
  }
  AccessWebCamera() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        this.updateLocalVideo(stream);
      })
      .catch(error => {
        console.error('Error accessing webcam:', error);
      });
  }

  updateLocalVideo(stream: MediaStream): void {
    if (this.localVideo.nativeElement) {
      this.localVideo.nativeElement.srcObject = stream;
      this.localVideo.nativeElement.addEventListener('loadedmetadata', () => {
        this.localVideo.nativeElement.play();
      });
      this.state.setLocalStream(stream)
    }
  }

  updateRemoteVideo(stream: MediaStream): void {
    if (this.remoteVideo.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = stream;
      this.remoteVideo.nativeElement.addEventListener('loadedmetadata', () => {
        this.remoteVideo.nativeElement.play();
      });
    }
  }

  StartVideoCall(callee) {
    this.signalr.sendPreOffer({ "calleePersonalCode": callee, "callerSocketId": this.userdetails.from });
  }
  OnCallAccepted(callerSocketId: string | null = null) {
    const socketId = callerSocketId ? callerSocketId : this.userdetails.to;
    const data = {
      callerSocketId: socketId,
      calleePersonalCode: this.userdetails.from,
      preOfferAnswer: "",
    };
    this.signalr.sendPreOfferAnswer(data);
  }

  createPeer(targetUser?: any, status?: string) {
    console.log('createPeer', targetUser, status);
    try {
      var that = this;
      that.peerConnection = new RTCPeerConnection(this.peerConnectionConfig);

      const localStream = this.state.getState().localStream;
      if (localStream != null) {
        localStream.getTracks().forEach(function (track) {
          that.peerConnection.addTrack(track, localStream);
        });
      }

      that.peerConnection.onicecandidate = (evt) =>
        this.onicecandidateEvent(evt, targetUser);

      const remoteStream = new MediaStream();
      this.state.setRemoteStream(remoteStream);
      this.updateRemoteVideo(remoteStream);
      this.peerConnection.ontrack = (event) => {
        remoteStream.addTrack(event.track);
      };

      if (status == 'offer') {
        that.peerConnection.onnegotiationneeded = () =>
          this.onnegotiationneededEvent(targetUser);
      }

      that.peerConnection.oniceconnectionstatechange = () => {
        console.log(that.peerConnection.iceConnectionState);
        if (that.peerConnection.iceConnectionState == 'disconnected') {
          this.StartVideoCall(this.userdetails.to)
        }
      };

      //return peerConnection;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  onicecandidateEvent(e, targetUser: any) {
    console.log('onicecandidateEvent', e);
    try {
      if (e && e.candidate && targetUser) {
        if (e.candidate?.type == 'srflx') {
          console.log('The STUN server is reachable!');
          console.log(`Your Public IP Address is: ${e?.candidate?.address}`);
        }
        if (e?.candidate?.type == 'relay') {
          console.log('The turn server is reachable!');
          console.log(`Your Public IP Address is: ${e?.candidate?.address}`);
        }

        const payload = {
          target: targetUser,
          callerSocketId: this.userdetails.from,
          calleePersonalCode: targetUser,
          connectedUserSocketId: targetUser,
          candidate: JSON.stringify(e.candidate),
        };
        if (
          this.signalr.hubConnection.state == HubConnectionState.Connected
        ) {
          this.signalr.hubConnection.invoke('IceCandidate', payload)
            .catch((err) => {
              console.error(err);
            });
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  onnegotiationneededEvent(targetUser: any) {
    console.log('onnegotiationneededEvent', targetUser);
    try {
      var that = this;
      this.peerConnection.createOffer().then((offer) => {
        console.log('onnegotiationneededEvent first then', offer);
        // offer.sdp = this.vcHandle.tweakVCStreams(offer.sdp, this.preferredCodec);
        return that.peerConnection.setLocalDescription(offer);
      })
        .then(() => {
          const payload = {
            calleePersonalCode: that.userdetails.to,
            callerSocketId: that.userdetails.from,
            connectedUserSocketId: that.userdetails.to,
            offer: JSON.stringify(that.peerConnection.localDescription),
          };
          console.log('onnegotiationneededEvent second then', payload);
          if (that.signalr.hubConnection.state == HubConnectionState.Connected) {
            that.signalr.hubConnection.invoke('OnOffer',payload)
              .catch((err) => {
                console.error(err);
              });
          }
        })
        .catch((e) => console.log(e));
    } catch (error) {
      console.error(error);
    }
  }
  iCECandidateFunc(candidate: any) {
    console.log('iCECandidateFunc', candidate);
    try {
      var that = this;
      let myCandidate = new RTCIceCandidate(candidate);
      //if (that.peer)
      that.peerConnection.addIceCandidate(myCandidate).catch((e) => console.error(e));
    } catch (error) {
      console.error(error);
    }
  }

  async handleRecieveCall(targetOffer: any) {
    console.log('handleRecieveCall', targetOffer);
    try {
      var that = this;
      this.createPeer(this.userdetails.to, 'answer');
      const desc = new RTCSessionDescription(targetOffer);
      this.peerConnection.setRemoteDescription(desc).then(() => {
        // that.localStream
        //   .getTracks()
        //   .forEach((track) => that.peer.addTrack(track, that.localStream));
      })
        .then(() => {
          return this.peerConnection.createAnswer();
        })
        .then((answer) => {
          return this.peerConnection.setLocalDescription(answer);
        })
        .then(() => {
          if (
            that.signalr.hubConnection.state == HubConnectionState.Connected && that.userdetails && that.userdetails.to
          ) {
            const payload = {
              connectedUserSocketId: that.userdetails.to,
              callerSocketId: that.userdetails.from,
              answer: JSON.stringify( that.peerConnection.localDescription),
            };

            that.signalr.hubConnection.invoke('OnAnswerOffer',payload)
              .catch((err) => {
                console.error(err);
              });
          }
        });
    } catch (error) {
      console.error(error);
    }
  }

  handleAnswer(CallerOffer: any) {
    console.log('handleAnswer', CallerOffer);
    try {
      const desc = new RTCSessionDescription(CallerOffer);
      this.peerConnection.setRemoteDescription(desc).catch((e) => console.log(e));
    } catch (error) {
      console.error(error);
    }
  }
}
