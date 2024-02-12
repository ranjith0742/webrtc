import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BaseComponent } from './base/base.component';
import { SignalRSrv } from './service/signalr.service';
import { StateService } from './service/state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent extends BaseComponent implements OnInit, AfterViewInit {
  title = 'adilstrangerui';
  connectedUsers: any[] = [];
  constructor(protected override signalr: SignalRSrv, protected override state: StateService, private changeDetection: ChangeDetectorRef) {
    super(signalr, state)
  }
  ngOnInit(): void {
    this.ConnecttoSignalR();
  }
  ngAfterViewInit(): void {

    
    this.signalr.hubConnection.on('get_connected_clients', (data) => {
      if (data.length > 1) {
        this.connectedUsers = data;
        this.changeDetection.detectChanges();
      }
    });

    this.signalr.hubConnection.on('pre-offer', (data) => {
      this.userdetails.to = data.callerSocketId;
      this.OnCallAccepted();
    });

    this.signalr.hubConnection.on('pre-offer-answer', (data) => {
      this.createPeer(this.userdetails.to, "offer");
    });

    this.signalr.hubConnection.on('IceCandidate', (Candidate) => {
      console.log('OnIceCandidateAsync', Candidate);
      var obj = JSON.parse(Candidate.candidate);
      if (obj) {
        this.iCECandidateFunc(obj);
      }
    }
    )

    this.signalr.hubConnection.on('OnOffer', (targetOffer: any) => {
      console.log('OnOfferAsync', targetOffer);
      var obj = JSON.parse(targetOffer.offer);
      this.handleRecieveCall(obj);
    });

    this.signalr.hubConnection.on('OnAnswerOffer', (targetOffer: any) => {
      console.log('OnAnswerOffer', targetOffer);
      var obj = JSON.parse(targetOffer.answer);
      this.handleAnswer(obj);
    }
    );
  }
  settouser(data) {
    this.userdetails.to = data;
    this.changeDetection.detectChanges();
  }
}
