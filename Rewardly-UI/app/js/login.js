'use strict';
//var mockdata = {username:'jefree', userid:'123456', status:true};
$(document).ready( function(){

 $('#login-btn').on('click', function () {    
  var username = $("#name").val();
  var pwd = $("#pwd").val();
  
     


  $.ajax({
  type: 'POST',
     contentType: 'application/json',
     url: 'https://rewardly.herokuapp.com/api/users/authenticate',   
     data: JSON.stringify(
    { 
     email: username
   }), 
     success: function(data) {         
         if(data == "user doesn't have access to the application"){
          $(".error-msg").html("Please check your login credentials");
         }
         else
         {
           document.cookie = {currentuserid: data.userId, currentusername: data.user_name};
          window.location.replace('http://localhost:8000/homepage.html');
      }
     },
     error: function (xhr, status, error) {
            console.log('Error: ' + error.message);
            
     },
 });        
 });
});