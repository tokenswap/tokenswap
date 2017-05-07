import { _meteorAngular } from 'meteor/angular';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base'
import { Session } from 'meteor/session';

angular
    .module('salephone')
    .controller('LoginCtrl', LoginCtrl);

 function LoginCtrl (
                      $scope,
                      $reactive,
                      $cordovaToast,
                      $rootScope,
                      $http,
                      $state,
                      $ionicLoading,
                      $ionicPopup,
                    ){

    $reactive(this).attach($scope);
    var self = this;

    this.login = function(){
      $rootScope.$broadcast('loadspinner');

      if( Meteor.status().connected === false ){
        $ionicLoading.hide();
        return;
      }

      if( self.user && self.password ){
        let regex = new RegExp(/.+@(.+){2,}\.(.+){2,}/);

        let loginOptions = {
          username: self.user
        }

        if ( regex.test(self.user) === true ){
          loginOptions = {
            email: self.user
          }
        }
          
        Meteor.loginWithPassword(loginOptions, self.password, function(err){
          if (err) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom('Invalid Email or Password.');
            }
            else {
              toastr.error('Invalid Email or Password.');
            }
            $ionicLoading.hide();
          } 
          else {
            self.user = '';
            self.password = '';
            $state.go('app.shop');
            return;
          }
        });
      }
      else {
        if (Meteor.isCordova) {
          $cordovaToast.showLongBottom('Invalid Email or Password.');
        }
        else {
          toastr.error('Invalid Email or Password.');
        }
        $ionicLoading.hide();
        return;
      }
    }    

    //Oauth login with Facebook.
    this.loginFB = function() {
      Meteor.loginWithFacebook({
        requestPermissions: ['email', 'public_profile'],
        redirectUrl: Meteor.absoluteUrl('_oauth/facebook'),
        loginStyle: "popup"
      }, function(err){
        
        if(err){
          if( err.error === 'Email exists.' ) {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom('Account is not verified. Please check your email on how to verify your account.');
            } else {
              toastr.error('Account is not verified. Please check your email on how to verify your account.');
            }
          }
          $state.reload('app.login');
          return;          
        }
        else{
          return self.register();
        }
      });
    };

    //Oauth login with Google.
    this.googleMerged = function(){
      var alertPopup = $ionicPopup.alert({
        title: 'Account Updated',
        template: 'You have registered your existing account with Google.',
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
            $state.reload('app.login');
            return;
          }
          else{
            return self.register();
          }
        });
      }
      else{
        Meteor.loginWithGoogle({
          requestPermissions: ['email', 'profile'],
          redirectUrl: Meteor.absoluteUrl('_oauth/google'),
          loginStyle: "popup"
        }, function(err){
          if(err){
            if( err.error === 'Email exists.' ) {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom('Account is not verified. Please check your email on how to verify your account.');
              } else {
                toastr.error('Account is not verified. Please check your email on how to verify your account.');
              }
            }
            $state.reload('app.login');
            return;          
          }
          else{
            return self.register();
          }
        });
      }      
    };

    this.register = function(){
      Meteor.call('isRegistered', function(err, registered){
        if ( registered === false ) {
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
                    self.createProfile(newProfile);
                  }
                  else {
                    console.log( "Error getting location." );
                    self.createProfile(newProfile);
                  }
                });
              }
              else {
                self.createProfile(newProfile);
              }
        }
        else if ( registered === true ) {
          $state.go('app.shop');          
        }
        else {
          Meteor.logout(function() {
            if (Meteor.isCordova) {
              $cordovaToast.showLongBottom('Error. Please try again.');
            } else {
              toastr.error('Error. Please try again.');
            }
            $state.reload('app.login');
          });
        }
      });
    }    

    this.createProfile = function(newProfile) {
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
          console.log("Error with your account signup. Please try again.");
          if (Meteor.isCordova) {
            $cordovaToast.showLongBottom('Error. Please try again.');
          } else {
            toastr.error('Error. Please try again.');
          }
          //Method is located at tapshop/server/methods/profile_server.js
          Meteor.call('signupError', function(err){
            Meteor.logout(function() {
              if (Meteor.isCordova) {
                $cordovaToast.showLongBottom('Error. Please try again.');
              } else {
                toastr.error('Error. Please try again.');
              }
              $state.reload('app.login');
            });
          })
        }
      });
    };

    $rootScope.$on('$cordovaInAppBrowser:exit', function(e, event){
      if ( Meteor.loggingIn() === false ) {
        $ionicLoading.hide();
      }
    });

    $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
      viewData.enableBack = false;
    });

    $scope.$on('$ionicView.afterEnter', function (e, event) {
        $ionicLoading.hide();
    });
 };
