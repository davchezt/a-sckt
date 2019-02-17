const socket = io.connect('http://192.168.1.200:8080');

var Peer = null;
let roomId = 'davchezt';
let isConnected = false;
let isCaller = false;
let targetPeer = null;
let userPeer = null;
let chats = [];
let rooms = [];
let devicesId = [];

var localVideo = document.getElementById('local-video');
var remoteVideo = document.getElementById('remote-video');

// socket.emit('subscribe', roomId);

// SOCKET
socket.on('message', function (data) {
  chats.push(data);
  $('#message-list').html(data.message);
});

socket.on('start-call', function (data) {
  if (data.data.type === 'offer') {
    if (!isCaller) {
      console.warn('socket:menunggu diangkat', data);
      var targetPeerN = JSON.stringify(data.data);
      if (Peer && !Peer.destroyed) {
        Peer.signal(JSON.parse(targetPeerN));
      }
      else {
        starCall();
        targetPeer = targetPeerN;
        if (Peer) {
          Peer.signal(JSON.parse(targetPeer));
        }
        else {
          setTimeout(() => {
            Peer.signal(JSON.parse(targetPeer));
          }, 500);
        }
      }
    }
  }
  else {
    if (isCaller) {
      console.warn('socket:menghubungkant');
      var targetPeerN = JSON.stringify(data.data);
      if (Peer && !Peer.destroyed) {
        if (targetPeer) Peer.signal(JSON.parse(targetPeerN));
        else {
          targetPeer = targetPeerN;
          Peer.signal(JSON.parse(targetPeer));
        }
      }
    }
  }
});

socket.on('in-call', function () {
  isConnected = true;
  // console.warn('socket:in-call');
});

socket.on('chat-call', function (data) {
  console.warn('socket:chat-call', data);
});

socket.on('stop-call', function () {
  isConnected = false;
  console.warn('socket:stop-call');
  endCall();
});

socket.on('room', function (data) {
  if (rooms.indexOf(data.room) === -1) {
    rooms.push(data.room);
    $('#room-list').append('<li>' + data.room + '</li>');
  }
});
// END SOCKET

// JQUERY
$('#room').val(roomId);
$('#join').click(function () {
  var room = $('#room').val();
  socket.emit('subscribe', room);
  roomId = room;
});
$('#left').click(function () {
  var room = $('#room').val();
  socket.emit('unsubscribe', room);
});
$('#send').click(function () {
  var room = $('#room').val(), message = $('#message').val();
  socket.emit('ping-text', { room: room, message: message });
  $('#message').val('');
});
$('#clear').click(function () {
  chats = [];
  $('#message-list').html('');
});
$('#call').click(function () {
  isCaller = true;
  starCall();
});
$('#end').click(function () {
  endCall();
});
$('#jawab').click(function () {
  isCaller = false;
  jawabCall();
});
$('#send-data').click(function () {
  var val = $("#data").val();
  if (Peer && !Peer.destroyed) Peer.send(val);
  $("#data").val('');
});
$('#change').click(function () {
  changeStream();
});
// JQUERY END

registerDevices = () => {
  navigator.mediaDevices.enumerateDevices()
  .then((devicesIds) => {
    devicesIds.forEach((device) => {
      if (device.kind === 'videoinput') {
        // console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
        if (devicesId.indexOf(device.deviceId) === -1) devicesId.push(device.deviceId);
        // console.log(devicesId);
      }
      if (devicesId.length > 1) {
        console.log('multy camera detected');
      }
    });
  })
  .catch((e) => {
    console.log(e.name + ": " + e.message);
  });
}

registerDevices();

changeStream = () => {
  const ifSuccess = (stream) => {
    if (Peer && !Peer.destroyed) {
      Peer.addStream(stream);
    }
    localVideo.srcObject = stream;
    localVideo.volume = 1;
    localVideo.muted = true;
    localVideo.play();
  }
  const ifError = (error) => {
    console.error(error);
  }
  navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: devicesId[0] ? {
        exact: devicesId[0]
      } : undefined },
    audio: true
  }).then(ifSuccess).catch(ifError);
}

starCall = () => {
  navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: devicesId[0] ? {
        exact: devicesId[0]
      } : undefined },
    audio: true
  }).then(onSuccess).catch(onError);
}

onSuccess = (stream) => {
  window.stream = stream;
  localVideo.srcObject = stream;
  localVideo.volume = 1;
  localVideo.muted = true;
  localVideo.play();
  // Mulai RTC
  Peer = new SimplePeer({
    initiator: isCaller,
    trickle: false,
    stream: stream,
    iceTransportPolicy: "relay",
    config: {
      iceServers: []
    }
  });
  // Konekeksi Perr
  Peer.on('connect', () => {
    socket.emit('in-call', { room: roomId });
    console.log("peer:connect");
    // Peer.addStream(window.stream);
  });
  // Signal server perr
  Peer.on('signal', (data) => {
    if (data.type === 'offer') {
      userPeer = JSON.stringify(data);
    }
    else if (data.type === 'answer') {
      userPeer = JSON.stringify(data);
    }
    // Peer.signal(data);
    // console.log("peer:signal:", userPeer);
    socket.emit('start-call', { room: roomId, data: data });
  });
  // Negotiate server perr
  Peer.on('negotiate', (data) => {
    console.log("peer:negotiate");
    // Manual Force
    // Peer.negotiate();
    // Peer.once('negotiate', function () {
    //   console.log('Peer negotiated again')
    //   Peer.negotiate();
    //   Peer.once('negotiate', function () {
    //     console.log('Peer negotiated again')
    //   });
    // });
  });
  // Signal streaming
  Peer.on('stream', (streams) => {
    console.log("peer:stream", streams);
    remoteVideo.srcObject = streams;
    remoteVideo.play();
  });
  // Tracks streaming
  Peer.on('track', (track, streams) => {
    console.log("peer:track");
  });
  // Tracks streaming
  Peer.on('data', (data) => {
    let message = data.toString();
    $("#data").val(message);
    console.log("peer:data");
  });
  // Close peer
  Peer.on('close', () => {
    console.log("peer:close");
    socket.emit('stop-call', { room: roomId });
  });
  // Peer Error
  Peer.on('error', (err) => {
    console.log("peer:error:", err);
  });
  // Akhir RTC
};

onError = (error) => {
  console.log("RTCError:", error);
}

endCall = () => {
  window.stream.getVideoTracks().forEach((track) => {
    track.stop();
  });
  window.stream.getAudioTracks().forEach((track) => {
    track.stop();
  });
  if (Peer && !Peer.destroyed) {
    Peer.destroy();
    Peer = null;
    targetPeer = null;
    isCaller = false;
  }
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
};

jawabCall = () => {
  if (Peer && !Peer.destroyed) Peer.signal(JSON.parse(targetPeer));
}