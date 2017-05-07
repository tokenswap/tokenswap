import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base'
import { Session } from 'meteor/session';

angular
    .module('salephone')
    .controller('RegCtrl', RegCtrl);

 function RegCtrl (
                    $scope,
                    $reactive,
                    $http,
                    $state,
                    $cordovaToast,
                    $ionicLoading,
                    $rootScope,
                    $ionicPopup
                  ){
  $reactive(this).attach($scope);
  var self = this;

  this.pwdMismatch = false;
  this.invalidEmail = false;
  this.invalidUser = false;
  this.invalidPass = false;
  this.userExists = false;
  this.emailExists = false;
  this.noEmail = false;
  this.noUser = false;
  this.noPass = false;
  this.noConfirm = false;
  this.submitted = 0;

  this.clearPass = function(){
    this.pwdMismatch = false;
    this.invalidPass = false;
    this.noPass = false;
    this.noConfirm = false;
  }

  this.clearEmail = function(){
    this.emailExists = false;
    this.noEmail = false;
    this.invalidEmail = false;    
  }

  this.clearUser = function(){
    this.noUser = false;
    this.invalidUser = false;
    this.userExists = false;    
  }

  this.register = function(){
    $rootScope.$broadcast('loadspinner');

    if( Meteor.status().connected === false ){
      if (Meteor.isCordova) {
        $cordovaToast.showLongBottom('Connection error.');
      } 
      else {
        toastr.error('Connection error.');
      }
      $ionicLoading.hide();
      return;
    }

    let emailRegex = new RegExp(/.+@(.+){2,}\.(.+){2,}/);
    let usernameRegex = new RegExp(/^\S{4,}$/);
    let passwordRegex = new RegExp(/^\S{6,}$/);

    if (
      self.username &&
      self.email &&
      emailRegex.test(self.email) === true &&
      usernameRegex.test(self.username) === true &&
      passwordRegex.test(self.password) === true &&
      self.password &&
      self.password === self.confirm
    ){

      Meteor.call('checkUser', self.email, self.username, function(err){
        if(err){
          console.log(err);
          if ( err.error === 'Username Exists' ){
            self.userExists = true;
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom('Username exists.');
            } else {
              toastr.error('Username exists.');
            }
            $ionicLoading.hide();
            return;
          }
          else if ( err.error === 'Email Exists' ) {
            self.emailExists = true;
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom('Email is already registered.');
            } else {
              toastr.error('Email is already registered.');
            }

            $ionicLoading.hide();
            return;
          }
          else {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom('Error. Please try again.');
            } else {
              toastr.error('Error. Please try again.');
            }
            $ionicLoading.hide();
            return;
          }
        }
        else {
		  self.submitted++;	
			
          Accounts.createUser({
            email: self.email,
            username: self.username,
            password: self.password
          },
          function(err){
            if(err){
              if( self.submitted > 1 && err.error === 403 ){
                return;
              }
              else{
                console.log(err);
                self.submitted = 0;
                $ionicLoading.hide();
                return;
              }
            }
            else{
              return self.createProfile();
            }
          });
        }
      });
    }
    else {
      if( !self.username ) { self.noUser = true; }
      if( !self.password ) { self.noPass = true; }
      if( !self.confirm ) { self.noConfirm = true; }
      if( !self.email ) { self.noEmail = true; }
      if ( self.username && usernameRegex.test(self.username) === false ) { this.invalidUser = true; }
      if ( self.password && passwordRegex.test(self.password) === false ) { this.invalidPass = true; }
      if ( ( self.password || self.confirm ) && self.password !== self.confirm ) { this.pwdMismatch = true; }
      if ( self.email && emailRegex.test(self.email) === false ) { this.invalidEmail = true; }
      $ionicLoading.hide();
      return;
    }
  };  

  //Oauth login with Facebook.
  this.loginFB = function() {
    Meteor.loginWithFacebook({
      requestPermissions: ['email', 'public_profile'],
      redirectUrl: Meteor.absoluteUrl('_oauth/facebook')
    }, function(err){
        if(err){
          if( err.error === 'Email exists.' ) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom('Account is not verified. Please check your email on how to verify your account.');
            } else {
              toastr.error('Account is not verified. Please check your email on how to verify your account.');
            }
          }
          $state.reload('app.register');
          return;
        }
        else{
          return self.checkUser();
        }
    });
  };

    //Oauth login with Google.
    this.googleMerged = function(){
      var alertPopup = $ionicPopup.alert({
        title: 'Account Updated',
        template: 'Your existing account is now registered with Google.',
        okType: 'button-balanced',
        okText: 'Continue'
      });
    
      alertPopup.then(function(res) {
        if( Meteor.userId() ){
          return;
        }

        return self.loginGoogle();
      });
    }

  //Oauth login with Google.
  this.loginGoogle = function() {
    if ( Meteor.isCordova ) {
      if(!Meteor.settings.public.google.clientId){
        return;
      }

      $rootScope.$broadcast('loadspinner');
      
      if( Meteor.status().connected === false ){
        $ionicLoading.hide();
        return;
      }
      
      Meteor.cordova_g_plus({
        cordova_g_plus: true,
        profile: ['email', 'profile'],
        webClientId: Meteor.settings.public.google.clientId,
      }, function(err) {                
        if(err){
          $ionicLoading.hide();
          if( err.error === 'Google Account Registered' ) {
            return self.googleMerged();
          }
          
          if( err.error === 'Email exists.' ) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom('Account is not verified. Please check your email on how to verify your account.');
            } else {
              toastr.error('Account is not verified. Please check your email on how to verify your account.');
            }
          }
          $state.reload('app.register');
          return;
        }
        else{
          return self.checkUser();
        }
      });
    }
    else {
      Meteor.loginWithGoogle({
        requestPermissions: ['email', 'profile'],
        redirectUrl: Meteor.absoluteUrl('_oauth/google')
      }, function(err){
          if(err){
            if( err.error === 'Email exists.' ) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom('Account is not verified. Please check your email on how to verify your account.');
              } else {
                toastr.error('Account is not verified. Please check your email on how to verify your account.');
              }
            }
            $state.reload('app.register');
            return;
          }
          else{
            return self.checkUser();
          }
      });
    }
  };

  this.checkUser = function(){
    //Check if user is already registered.
    //Method is located at tapshop/server/methods/profile_server.js
    Meteor.call('isRegistered', function(err, registered){
      if ( registered === false ) {
        self.createProfile();
      }
      else if ( registered === true ) {
        $state.go('app.shop');
      }
      else {
        Meteor.logout(function() {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom('Error. Please try again.');
          } 
          else {
            toastr.error('Error. Please try again.');
          }
		  self.submitted = 0;
          $state.reload('app.register');
        });
      }
    });
  };

  this.createProfile = function(){
        //Get user location using geolocation data.
        //Method is located at tapshop/server/methods/server_methods.js
        let newProfile = {
          hasLocation: false,
          location: {
            type: 'Point',
            coordinates: [0,0],
            city: null,
            region: null,
            country: null,
            countryCode: null
          }
        }
        self.currentLoc = Session.get('myCoordinates');

        if ( self.currentLoc ) {
          newProfile.location.coordinates = [ self.currentLoc.lng, self.currentLoc.lat ];
          newProfile.hasLocation = true;

          Meteor.call('getLocation', self.currentLoc, function(err, loc) {
            if ( loc ) {
              newProfile.location.city = loc.city,
              newProfile.location.region = loc.region,
              newProfile.location.country = loc.country,
              newProfile.location.countryCode = loc.countryCode

              //Create separate user profile for public.
              return self.insertProfile(newProfile);
            }
            else {
              console.log( "Error getting location." );
              return self.insertProfile(newProfile);
            }
          });
        }
        else {
          return self.insertProfile(newProfile);
        }
    }

    this.insertProfile = function(newProfile) {
      //Create separate user profile for public.
      //Method is located at tapshop/server/methods/profile_server.js
      Meteor.call('uploadProfile', newProfile, function(err, profile){
        if (!err) {
			    Meteor.call('sendVerifyEmail', Meteor.userId(), function(err){
				    if (Meteor.isCordova) {
            		$cordovaToast.showShortBottom('Account Registered');
          	} 
            else {
            	toastr.success('Account Registered');
          	}
          	$state.go('app.shop');
			    });
        }
        else {
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom('Error. Please try again.');
          } else {
            toastr.error('Error. Please try again.');
          }
		  self.submitted = 0;
          //Method is located at tapshop/server/methods/profile_server.js
          Meteor.call('signupError', function(err){
            Meteor.logout(function() {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom('Error. Please try again.');
              } else {
                toastr.error('Error. Please try again.');
              }
              $state.reload('app.register');
            });
          })
        }
      });
    };

    $scope.$on('$ionicView.afterEnter', function () {
        $ionicLoading.hide();
    });
 };
