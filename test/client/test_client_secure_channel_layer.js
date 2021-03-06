var ClientSecureChannelLayer = require("../../lib/client/client_secure_channel_layer").ClientSecureChannelLayer;
var should  = require("should");
var assert = require('better-assert');

var debugLog  = require("../../lib/utils").make_debugLog(__filename);

var MockTransport           = require("../mocks/mock_transport").MockTransport;
var fake_AcknowledgeMessage = require("../mocks/mock_transport").fake_AcknowledgeMessage;



describe("testing ClientSecureChannelLayer ",function(){

    it("should create a ClientSecureChannelLayer",function(done){

        var mock = new MockTransport([

            //
            opcua.packTcpMessage("ACK", fake_AcknowledgeMessage),

            require("../fixtures/fixture_full_tcp_packets").packet_sc_2 // OpenChannelResponse

        ],done);

        require("../../lib/transport/tcp_transport").setFakeTransport(mock.fake_socket.client);

        var secureChannel = new ClientSecureChannelLayer();

        secureChannel.create("fake://localhost:2033/SomeAddress",function(err){
            done(err);
        });
    });

    it("should close a ClientSecureChannelLayer",function(done){

        var mock = new MockTransport([

            // ---------------------------------------------------- Transaction 1
            // Client will send a HEl_message
            // Server will reply with this :
            opcua.packTcpMessage("ACK", fake_AcknowledgeMessage),

            // ---------------------------------------------------- Transaction 2
            // client will send a "OPN" OpenSecureChannelRequest
            // Server will reply with this:
            require("../fixtures/fixture_full_tcp_packets").packet_sc_2, // OpenChannelResponse

            // ---------------------------------------------------- Transaction 3
            // client will send a "CLO" CloseSecureChannelRequest
            // Server will close the socket, without sending a response
            function() { this.fake_socket.server.end(); },

            function() { done(new Error("no more packet to mock")); }

        ],done);

        require("../../lib/transport/tcp_transport").setFakeTransport(mock.fake_socket.client);

        var secureChannel = new ClientSecureChannelLayer();

        secureChannel.create("fake://localhost:2033/SomeAddress",function(err){
            secureChannel.close(function(err){
                done(err);
            });
        });
    });


    it("should use token provided by server in messages",function(done){

        var mock = new MockTransport([
            // ---------------------------------------------------- Transaction 1
            // Client will send a HEl_message
            // Server will reply with this :
            opcua.packTcpMessage("ACK", fake_AcknowledgeMessage),

            // ---------------------------------------------------- Transaction 2
            // client will send a "OPN" OpenSecureChannelRequest
            // Server will reply with this:
            require("../fixtures/fixture_full_tcp_packets").packet_sc_2,

            // ---------------------------------------------------- Transaction 3
            // client will send a "CLO" CloseSecureChannelRequest
            // Server will close the socket, without sending a response
            function() { this.fake_socket.server.end(); }

        ],done);

        require("../../lib/transport/tcp_transport").setFakeTransport(mock.fake_socket.client);

        var secureChannel = new ClientSecureChannelLayer();

        // before connection the securityToken shall not exist
        should(secureChannel.securityToken).equal(undefined);

        secureChannel.create("fake://localhost:2033/SomeAddress",function(err){

            // after connection client holds the security token provided by the server
            should(secureChannel.securityToken).not.equal(undefined);

            // in our server implementation, token id starts at 1
            secureChannel.securityToken.tokenId.should.equal(1);


            secureChannel.close(function(err){
                done(err);
            });
        });
    });

    it("should callback with an error if performMessageTransaction is called before connection",function(done){

        var secureChannel = new ClientSecureChannelLayer();
        var s = require("../../lib/structures");
        var message = new s.GetEndpointsRequest();
        secureChannel.performMessageTransaction(message,function(err/*, response*/){
            err.message.should.equal("Client not connected");
            done();
        });
    });





});
