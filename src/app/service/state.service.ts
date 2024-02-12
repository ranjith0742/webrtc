import { Injectable } from '@angular/core';
import { CallState } from './constant';
@Injectable({
  providedIn: 'root'
})
export class StateService {
  private state = {
    socketId: null,
    localStream: null,
    remoteStream: null,
    screenSharingActive: false,
    screenSharingStream: null,
    allowConnectionsFromStrangers: false,
    callState: CallState.CALL_AVAILABLE_ONLY_CHAT // Assuming you have a constant named 'CallState' with the call states
  };

  constructor() { }

  setSocketId(socketId: string): void {
    this.state.socketId = socketId;
  }

  setLocalStream(stream: MediaStream): void {
    this.state.localStream = stream;
  }

  setAllowConnectionsFromStrangers(allowConnection: boolean): void {
    this.state.allowConnectionsFromStrangers = allowConnection;
  }

  setScreenSharingActive(screenSharingActive: boolean): void {
    this.state.screenSharingActive = screenSharingActive;
  }

  setScreenSharingStream(stream: MediaStream): void {
    this.state.screenSharingStream = stream;
  }

  setRemoteStream(stream: MediaStream): void {
    this.state.remoteStream = stream;
  }

  setCallState(callState: CallState): void {
    this.state.callState = callState;
  }

  getState(): any {
    return this.state;
  }
}
