import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';

Accounts.validateLoginAttempt((login) => {

  if( login.methodArguments[0] && login.methodArguments[0].cordova_g_plus ){
    
    if( login.allowed && !login.user.username ){
      
      let username = login.user.emails[0].address.substr( 0, login.user.emails[0].address.indexOf("@") );

      Meteor.users.update({ _id: login.user._id },{
        $set:{
          username: username,
          registered_emails: login.user.emails
        }
      });

      return true;
    }

    if( !login.allowed && login.error.code === 11000 ){

      let existingUser = Accounts.findUserByEmail( login.methodArguments[0].email );

      if( !existingUser || !existingUser.emails[0].verified ){
        Accounts.sendVerificationEmail( existingUser._id );
        throw new Meteor.Error('Email exists.', 'Please validate your email.');
      }
      
      let operation = login.error.getOperation();

      let userServices = _.extend(existingUser.services,{
        google: operation.services.google
      });

      Meteor.users.update({ _id: existingUser._id },{
        $set:{
          services: userServices
        }
      });

      throw new Meteor.Error('Google Account Registered');
    }
    

  }
  return true;
});

//User Account creation functions.
Accounts.onCreateUser(function(options, user) {

  if ( !user.services.password ){
    if ( user.services.facebook ){
      var existingUser = Accounts.findUserByEmail( user.services.facebook.email );
      if ( !existingUser ) {
        user.emails = [];
        user.username = user.services.facebook.email.substr( 0, user.services.facebook.email.indexOf("@") );
        user.emails.push( { address: user.services.facebook.email, verified: true } );
        return user;
      }
      //If email in Oauth login is already is registered, merge with existing account.
      else if ( existingUser.emails[0].verified === true ) {
        return user;
      }
      //Error if registered email is not yet verified.
      else if ( existingUser.emails[0].verified === false )  {
        Accounts.sendVerificationEmail( existingUser._id );
        throw new Meteor.Error('Email exists.', 'Please validate your email.');
      }
    }
    else if ( user.services.google ) {

      var existingUser = Accounts.findUserByEmail( user.services.google.email );
      if ( !existingUser ) {
        user.emails = [];
        user.username = user.services.google.email.substr( 0, user.services.google.email.indexOf("@") );
        user.emails.push( { address: user.services.google.email, verified: true } );
        return user;
      }
      //If email in Oauth login is already is registered, merge with existing account.
      else if ( existingUser.emails[0].verified === true ) {
        return user;
      }
      //Error if registered email is not yet verified.
      else if ( existingUser.emails[0].verified === false )  {
        Accounts.sendVerificationEmail( existingUser._id );
        throw new Meteor.Error('Email exists.', 'Please validate your email.');
      }
    }
  }
  else {
    user.emails = [{
      address: options.email,
      verified: false
    }]
    user.registered_emails = [{
      address: options.email,
      verified: false
    }]
  return user;
  }
});
