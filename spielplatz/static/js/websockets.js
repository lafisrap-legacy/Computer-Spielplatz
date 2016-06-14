$WS = {
    _websocket: null,
    _connected: false,
    _callbacks: [],
    _openCallback: null,
    _xsrf: null,
    _timeOffset: null,
    _badConnectionCallback: null,

    connect: function(addr, xsrf, badConnectionCallback, cb) {

        var self = this;

        try {
            this._websocket = new WebSocket(addr);
        } catch(e) {
            console.error("WebSocket connection to \""+addr+"\" failed.");
            return false;
        }

        this._websocket.onopen = function(evt) { self.onOpen(evt) };
        this._websocket.onmessage = function(evt) { self.onMessage(evt); };
        this._websocket.onerror = function(evt) { self.onError(evt); };
        this._websocket.onclose = function(evt) { self.onClose(evt); };       
    
        this.getId = this.idFactory();

        this._openCallback = cb;
        this._badConnectionCallback = badConnectionCallback;

        this._xsrf = xsrf;

        return true;
    },

    onOpen: function(evt) {
        this._connected = true;
    },

    onMessage: function(evt) {

        try {
            var data = JSON.parse(evt.data);
        } catch (e) {
            throw "onMessage: parse json message failed (" + e + ")";
        }

        if( data.Time ) {
            this.setTimeOffset(data.Time);
            if( this._openCallback ) {
                this._openCallback();
                this._openCallback = null;
            }
        }

        if( data.Id && this._callbacks[data.Id] ) {
            var id = data.Id;
            delete data.Id;
            this._callbacks[id](data);
        }
    },

    setTimeOffset: function(serverTime) {
        this._timeOffset = new Date().getTime() - serverTime;
    },

    getServerTime: function(time) {
        return (time || new Date().getTime()) - this._timeOffset;
    },

    onError: function(evt) {
        this._connected = false;
        console.error("A websockets error occured.")
    },

    onClose: function(evt) {
        this._connected = false;
        console.log("Websockets connection closed.")
    },

    sendMessage: function( message, cb, noConnectionWarning ) {
        var self = this,
            response = false;

        var send = function( message ) {
            message = message || {};
            message.Id = self.getId();
            message.Xsrf = self._xsrf;

            self._websocket.send(JSON.stringify(message));      
            self._callbacks[message.Id] = function(data) {

                self._badConnectionCallback( false );
                response = true;
                cb(data); 
            };
        };

        // Check connection and call bad connection modal when bad
        if( !this._connected ) {

            if( !noConnectionWarning ) {
                this._badConnectionCallback( function( ok ) {
                    if( !ok ) {
                        cb( {
                            Error: "no connection"
                        } );
                        return;
                    }

                    console.assert( self._connected, "Websockets connection should be active at this point." );

                    this._badConnectionCallback( false );
                    send( message );
                } )
            }
            return;
        }

        send( message );

        // Wait for timeout and call bad connection modal when bad
        setTimeout( function() {
            if( response === true ) return;

            if( !noConnectionWarning ) {
                self._badConnectionCallback( function( ok ) {
                    if( !ok ) {
                        cb( {
                            Error: "no connection"
                        } );
                        return;
                    }

                    console.assert( self._connected, "Websockets connection should be active at this point." );

                    send( message );
                } )
            }
            return;
        }, 1000 )
    },

    idFactory: function() {
        var id = 1000;

        return function() {
            return ++id;
        }
    },
    getId: null,

    isConnected: function() {
        return this._connected;
    },
};
