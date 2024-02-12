using Microsoft.AspNetCore.SignalR;

namespace WebRTCStranger.Hubs
{
    public class data
    {
        public string? callerSocketId { get; set; } = null;
        public string? calleePersonalCode { get; set; } = null;
        public string? callType { get; set; } = null;
        public string? type { get; set; } = null;
        public string? connectedUserSocketId { get; set; } = null;    
        public string? offer { get; set; } = null;
        public string? candidate { get; set; } = null;
        public string? answer { get; set; }
    }
    public class Stranger : Hub
    {
        private static readonly List<string> connectedPeers = new List<string>();

        public override async Task OnConnectedAsync()
        {
            connectedPeers.Add(Context.ConnectionId);
            await base.OnConnectedAsync();
            if(connectedPeers.Count > 0)
            {
                foreach (var item in connectedPeers)
                {
                    await Clients.Client(item).SendAsync("get_connected_clients", connectedPeers);
                }
               
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            connectedPeers.Remove(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendPreOffer(data data)
        {
            string calleePersonalCode = data.calleePersonalCode.Trim();

            string connectedPeer = connectedPeers.Find(peerSocketId => peerSocketId == calleePersonalCode);

            if (connectedPeer != null)
            {
                var response = new
                {
                    callerSocketId = Context.ConnectionId,
                };

                await Clients.Client(calleePersonalCode).SendAsync("pre-offer", response);
            }
        }

        public async Task SendPreOfferAnswer(data data)
        {
            string callerSocketId = data.callerSocketId.Trim();

            string connectedPeer = connectedPeers.Find(peerSocketId => peerSocketId == callerSocketId);

            if (connectedPeer != null)
            {
                await Clients.Client(callerSocketId).SendAsync("pre-offer-answer", data);
            }
        }
        public async Task OnOffer(data data)
        {
            string connectedUserSocketId = data.connectedUserSocketId.Trim();

            string connectedPeer = connectedPeers.Find(peerSocketId => peerSocketId == connectedUserSocketId);

            if (connectedPeer != null)
            {
                var clientProxy = Clients.Client(connectedUserSocketId) as IClientProxy;
                if (clientProxy != null)
                {
                    await clientProxy.SendAsync("OnOffer", data);
                }
            }
        }
        public async Task OnAnswerOffer(data data)
        {
            string connectedUserSocketId = data.connectedUserSocketId.Trim();

            string connectedPeer = connectedPeers.Find(peerSocketId => peerSocketId == connectedUserSocketId);

            if (connectedPeer != null)
            {
                var clientProxy = Clients.Client(connectedUserSocketId) as IClientProxy;
                if (clientProxy != null)
                {
                    await clientProxy.SendAsync("OnAnswerOffer", data);
                }
            }
        }
        public async Task IceCandidate(data data)
        {
            string connectedUserSocketId = data.connectedUserSocketId.Trim();

            string connectedPeer = connectedPeers.Find(peerSocketId => peerSocketId == connectedUserSocketId);

            if (connectedPeer != null)
            {
                var clientProxy = Clients.Client(connectedUserSocketId) as IClientProxy;
                if (clientProxy != null)
                {
                    await clientProxy.SendAsync("IceCandidate", data);
                }
            }
        }
        public async Task WebRTC(data data)
        {
            string connectedUserSocketId = data.connectedUserSocketId.Trim();

            string connectedPeer = connectedPeers.Find(peerSocketId => peerSocketId == connectedUserSocketId);

            if (connectedPeer != null)
            {
                var clientProxy = Clients.Client(connectedUserSocketId) as IClientProxy;
                if (clientProxy != null)
                {
                    await clientProxy.SendAsync("webRTC",data);
                }
            }
        }

        public async Task UserHungUp(data data)
        {
            string connectedUserSocketId = data.connectedUserSocketId;

            string connectedPeer = connectedPeers.Find(peerSocketId => peerSocketId == connectedUserSocketId);

            if (connectedPeer != null)
            {
                await Clients.Client(connectedUserSocketId).SendAsync("user-hanged-up");
            }
        }
    }
}
