var Vue = require( 'vue' );
var styles = require( './map-style' );

var map, usersArea;
var geolocTimer;
var addressTimer;
var geocoder, service;

var socket;

// Main Vue App
// ==========================================================================

var app = new Vue({

    el: '#app',

    data : {
        ready : false,

        radius : 125,
        center : {
            lat : null,
            lng : null,
            marker : null
        },

        me: {
            name    : 'Unknown',
            lat     : null,
            lng     : null,
            address : null,
            color   : "#000000"
        },

        // users : [
        //     {
        //         name : 'Ben',
        //         lat  : 45.762981,
        //         lng  : 4.828020,
        //         marker : null,
        //         color : "#0000ff"
        //     },
        //     {
        //         name : 'Clément',
        //         lat  : 45.761781,
        //         lng  : 4.845912,
        //         marker : null,
        //         color : "#ffff00"
        //     },
        //     {
        //         name : 'Ambroise',
        //         lat  : 45.762293,
        //         lng  : 4.822626,
        //         marker : null,
        //         color : "#f0f0f0"
        //     }
        // ],

        users : [],

        interests : [],

        markers : {
            users : [],
            interests : [],
            me : null,
            center : null
        },

        localizing : false,
    },

    watch : {
        'me.color' : function(){
            if( !this.ready ) return
            this.updateMyColor()
        },
        'me.address' : function(){
            if( !this.ready ) return
            clearTimeout( addressTimer );
            addressTimer = setTimeout( this.geocode, 1000 );
        },
        'me.name' : function(){
            if( !this.ready ) return;
            var _this = this;
            this.saveMe();
            this.markers.me.setLabel({
                color : _this.invertColor( _this.me.color, true ),
                fontFamily: 'Open Sans',
                text : _this.me.name == '' ? '' : _this.me.name.substring( 0, 1 )
            });
        },
        radius : function(){
            this.markers.center.setRadius( parseInt( this.radius ) );
        }
    },

    mounted : function(){
        this.$nextTick( function(){
            this.init();
            socket = io();
            console.log( socket );
        });
    },

    methods : {

        init : function(){
            var $map = document.getElementById( 'map' );

            map = new google.maps.Map( $map, {
                center            : { lat : 45.758399, lng : 4.832487 },
                zoom              : 15,
                clickableIcons    : false,
                fullscreenControl : false,
                mapTypeControl    : false,
                streetViewControl : false,
                styles            : styles.data,
                gestureHandling   : 'cooperative'
            });

            geocoder = new google.maps.Geocoder();
            service  = new google.maps.places.PlacesService( map );

            this.initMe();
            
            var _this = this;
            Vue.nextTick(function () {
                _this.draw();
            })
        },

        initMe : function(){

            if( localStorage.getItem( 'beeroid-me' ) ){
                var data = JSON.parse( localStorage.getItem( 'beeroid-me' ) );
                this.me = data;

                if( ( this.me.lat && this.me.lng ) || this.me.address ) return;
            }

            this.geolocalizeMe();
        },

        geolocalizeMe : function(){
            var _this = this;

            var error = function(){
                _this.localizing = false;
                console.log( 'error geoloc' );
            }

            clearTimeout( geolocTimer );

            if( navigator.geolocation ) {
                this.localizing = true;
                geolocTimer = setTimeout( error, 4000 );

                navigator.geolocation.getCurrentPosition( function( position ) {
                    clearTimeout( geolocTimer );

                    if( !_this.address ){
                        _this.localizing = false;
                        _this.me.lat = position.coords.latitude;
                        _this.me.lng = position.coords.longitude;
                        _this.draw();
                        _this.reverseGeocode();
                    }
                
                }, function(){
                    error();
                });

            } else {
                error();
            }
        },

        saveMe : function(){
            var _this = this;
            localStorage.setItem( 'beeroid-me', JSON.stringify( _this.me ) );
        },

        draw : function(){
            this.findCenter();
            this.drawMe();
            this.drawUsers();
            this.drawUsersArea();
            this.ready = true;
        },

        drawMe : function(){
            var _this = this;

            if( this.markers.me != null ){
                this.markers.me.setMap( null );
            }

            if( !this.me.lat || !this.me.lng ) return;


            this.markers.me = new google.maps.Marker({
                position : _this.me,
                map      : map,
                draggable : true,
                label    : {
                    color : _this.invertColor( _this.me.color, true ),
                    fontFamily: 'Open Sans',
                    text : !_this.me.name.length ? ' ' : _this.me.name.substring( 0, 1 )
                },
                icon     : {
                    path          : google.maps.SymbolPath.CIRCLE,
                    scale         : 14,
                    fillColor     : _this.me.color,
                    fillOpacity   : 1,
                    strokeColor   : '#000',
                    strokeWeight  : 2,
                    strokeOpacity : .2
                }
            });

            this.markers.me.addListener( 'drag', function(){
                _this.ready = false;
                _this.me.lat = this.position.lat();
                _this.me.lng = this.position.lng();
                _this.drawUsersArea();
            });

            this.markers.me.addListener( 'dragend', function(){
                _this.findCenter();
                _this.reverseGeocode();
            });
        },

        updateMyColor : function(){
            var _this = this;

            this.markers.me.setIcon( {
                path          : google.maps.SymbolPath.CIRCLE,
                scale         : 14,
                fillColor     : _this.me.color,
                fillOpacity   : 1,
                strokeColor   : '#000',
                strokeWeight  : 2,
                strokeOpacity : .5
            } );

            this.saveMe();
        },

        drawUsers : function(){
            var _this = this;

            this.users.forEach( function( user, i ){

                if( _this.markers.users[ i ] != null ){
                    _this.markers.users[ i ].setMap( null );
                }

                _this.markers.users[ i ] = new google.maps.Marker({
                    position : user,
                    map      : map,
                    label    : {
                        color : _this.invertColor( user.color, true ),
                        fontFamily: 'Open Sans',
                        text : !user.name.length ? ' ' : user.name.substring( 0, 1 )
                    },
                    icon     : {
                        path          : google.maps.SymbolPath.CIRCLE,
                        scale         : 14,
                        fillColor     : user.color,
                        fillOpacity   : 1,
                        strokeColor   : '#000',
                        strokeWeight  : 2,
                        strokeOpacity : .2
                    }
                });
            } )
        },

        findCenter : function(){

            var _this = this;

            if( this.markers.center != null ){
                this.markers.center.setMap( null );
            }

            var x = 0, y = 0, i, len = this.users.length;

            for( i = 0; i < len; i++ ) {
                x += this.users[ i ].lat;
                y += this.users[ i ].lng;
            }

            if( this.me.lat && this.me.lng ){
                x += this.me.lat;
                y += this.me.lng;
                len += 1;
            }

            this.center = {
                lat : x / len,
                lng : y / len
            }

            this.markers.center = new google.maps.Circle({
                strokeColor   : '#000',
                strokeOpacity : 0.1,
                strokeWeight  : 2,
                fillColor     : '#000',
                fillOpacity   : 0.05,
                center        : _this.center,
                radius        : parseInt( this.radius ),
                map           : map
            });

            map.panTo( this.center );

            this.getInterests();

        },

        getInterests : function(){
            var _this = this;
            
            service.nearbySearch({
                location : _this.center,
                radius   : _this.radius,
                type     : 'bar'
            }, function( results, status ){
                if( status === 'OK' ) {
                    _this.interests = results;
                    _this.drawInterests();
                } else {
                    console.log( status );
                }
            });
        },

        drawInterests : function(){
            var _this = this;

            this.interests.forEach( function( interest, i ){

                if( _this.markers.interests[ i ] != null ){
                    _this.markers.interests[ i ].setMap( null );
                }

                _this.markers.interests[ i ] = new google.maps.Marker({
                    position : interest.geometry.location,
                    map      : map
                });
            } );
        },

        drawUsersArea : function(){

            var i, len = this.users.length, p, dx, dy;

            for( i = 0; i < len; i++ ) {
                dx = this.users[ i ].lat - this.center.lat;
                dy = this.users[ i ].lng - this.center.lng;
                this.users[ i ].angle = Math.atan2( dy, dx );
            }

            var coords = this.users.slice( 0 );

            if( this.me.lat && this.me.lng ){
                coords.push( this.me );
            }

            coords.sort( function( a, b ){
                if( a.angle > b.angle ) return 1;
                else if( a.angle < b.angle ) return -1;
                return 0;
            } );

            if( usersArea != null ){
                usersArea.setMap( null );
            }

            usersArea = new google.maps.Polygon({
                paths         : coords,
                strokeColor   : '#000',
                strokeOpacity : 0.1,
                strokeWeight  : 2,
                fillColor     : '#000',
                fillOpacity   : 0.05,
                map           : map
            });
        },

        geocode : function(){
            var _this = this;
            geocoder.geocode({ 'address': this.me.address }, function( results, status ) {
                if( status === 'OK' ) {
                    clearTimeout( geolocTimer );
                    _this.me.lat = results[ 0 ].geometry.location.lat();
                    _this.me.lng = results[ 0 ].geometry.location.lng();
                    _this.draw();
                    _this.saveMe();
                } else {
                    console.log( status );
                }
            });
        },

        reverseGeocode : function(){
            var _this = this;
            geocoder.geocode({ 'location': { lat: _this.me.lat, lng : _this.me.lng } }, function( results, status ) {
                if( status === 'OK' ) {
                    _this.ready = false;
                    _this.me.address = results[ 0 ].formatted_address;
                    _this.saveMe();

                    Vue.nextTick(function () {
                        _this.ready = true;
                    })
                } else {
                    _this.ready = true;
                    console.log( status );
                }
            });
        },

        invertColor : function( hex, bw ) {
            if (hex.indexOf('#') === 0) {
                hex = hex.slice(1);
            }
            // convert 3-digit hex to 6-digits.
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            if (hex.length !== 6) {
                throw new Error('Invalid HEX color.');
            }
            var r = parseInt(hex.slice(0, 2), 16),
                g = parseInt(hex.slice(2, 4), 16),
                b = parseInt(hex.slice(4, 6), 16);
            if (bw) {
                // http://stackoverflow.com/a/3943023/112731
                return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                    ? '#000000'
                    : '#FFFFFF';
            }
            // invert color components
            r = (255 - r).toString(16);
            g = (255 - g).toString(16);
            b = (255 - b).toString(16);
            // pad each with zeros and return
            return "#" + padZero(r) + padZero(g) + padZero(b);
        }

    }

});