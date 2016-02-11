'use strict';
//var mockdata = {username:'jefree', userid:'123456', status:true};
$(document).ready( function(){

 $('#login-btn').on('click', function () {    
  var username = $("#name").val();
  var pwd = $("#pwd").val();
  
     


  $.ajax({
  type: 'POST',
     contentType: 'application/json',
     url: 'https://rewardlyapi.herokuapp.com/api/users/authenticate',   
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
           localStorage.setItem("userid", data.userId);
           localStorage.setItem("username", data.user_name  );
           window.location.replace('https://rewardly.herokuapp.com/homepage.html');
      }
     },
     error: function (xhr, status, error) {
            console.log('Error: ' + error.message);
            
     },
 });        
 });
});