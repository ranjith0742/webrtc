import { Injectable } from '@angular/core';
import * as signalR from "@microsoft/signalr"
import { StateService } from './state.service';
@Injectable({
    providedIn: 'root'
})
export class SignalRSrv {

    public hubConnection: signalR.HubConnection
    constructor(private readonly state: StateService) {

    }

    createConnection() {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl('https://ms.hmg.com/webrc/strangerHub')
            .build();

        return this.hubConnection
            .start()
            .then(() => { this.state.setSocketId(this.hubConnection.connectionId) })
            .catch(err => console.log('Error while starting connection: ' + err));
    }

    sendPreOffer(data: any = ''): void {
        if (this.hubConnection.state === 'Connected') {
            this.hubConnection.send('SendPreOffer', data)
                .then(() => console.log())
                .catch(error => console.error('Error sending pre-offer:', error));
        } else {
            console.error('SignalR connection is not in the Connected state');
        }
    }

    sendPreOfferAnswer = (data) => {
        if (this.hubConnection.state === 'Connected') {
            this.hubConnection.send('SendPreOfferAnswer', data)
                .then(() => console.log())
                .catch(error => console.error('Error sending pre-offer:', error));
        } else {
            console.error('SignalR connection is not in the Connected state');
        }
    };
    sendDataUsingWebRTCSignaling = (data) => {
        //console.log("sendDataUsingWebRTCSignaling : " + new Date());
        console.log(data);
        if (this.hubConnection.state === 'Connected') {
            this.hubConnection.send('webRTC', data)
                .then(() => console.log())
                .catch(error => console.error('Error sending pre-offer:', error));
        } else {
            console.error('SignalR connection is not in the Connected state');
        }
    };






    // handlePreOffer = (data) => {
    //     const { callerSocketId } = data;
    //     this.connectedUserDetails = {
    //         socketId: callerSocketId
    //     }; 
    // }
}