
var data = {Dataset: [{imgurl:"app/images/v1.png", id:'value1'},
					  {imgurl:"app/images/v2.png", id:'value2'},
					  {imgurl:"app/images/v3.png", id:'value3'},
					  {imgurl:"app/images/v4.png", id:'value4'}]};

var idImageSourceMapping = {"value1":{iconurl: "app/icons/v1.png", name:"Force of Insight"} , 
"value2":{iconurl: "app/icons/v2.png", name:"Power of Language"} , 
"value3":{iconurl: "app/icons/v3.png", name:"Run to Criticism"} , 
 "value4":{iconurl: "app/icons/v4.png", name:"Spirit of Generosity"}}; 


var leaderboards = { lbdata : [{username: "zeruba" , badgecount: "3"} ,
       {username: "mustafa" , badgecount: "3"},
       {username: "vinoth" , badgecount: "3"},
       {username: "jefree" , badgecount: "1"},
       {username: "krishna" , badgecount: "1"} ]};

var badgecontrol = $('#badgecontrol');
var selecteduserId, selecteduserName = '';
var username = localStorage.getItem("username");
var userid = localStorage.getItem("userid");
var currentuser = {
	"username": username,
	"userid": userid
}
//var currentuserid = document.cookie.userId;
var selectedValue;
var lbsource   = $("#leaderboard-template").html();
var lbtemplate = Handlebars.compile(lbsource);        
var lbcompiled  =  lbtemplate(leaderboards);


$(document).ready(function(){
	$('.selectrEl').selectr({
	
	select:function(ev,object){ }
	, filter:false, footer:false });


	$('#badgecontrol').popover({
	content: function (curry) {
			var source   = $("#entry-template").html();
			var template = Handlebars.compile(source);        
			var html    = template(data);        	
			curry(html);
		},
		direction: 'bottom',
    	width: '500px'
	});

	$("#lb-content").html(lbcompiled);

	$('#badgecontrol').on('click', function () {				
		badgecontrol.popover('show');            
	});

	$(document).on('click','.popup-item-image', function(){
		var item = idImageSourceMapping[this.id];
		selectedValue = this.id;
		badgecontrol.attr('src',item.iconurl);
		$('.badge-label').text(item.name);
		badgecontrol.popover('hide');
		$("#badgeerror").hide();
	});

	$('.suggestr').suggestr({
		parse: function(data) {

			data[0] = $.map( data[0], function( val, i ) {
				return {
					text: val.user_name,
					value: val._id
				}
			});

			var parsedData = {
				Results: data[0]
			}
			return parsedData;
		},
		select : function(e, obj) {
			selecteduserId = e.target.id;
			selecteduserName = e.target.innerText;

			$('.suggestr').val(selecteduserName);
		}
	});

	
	var socket = io.connect('https://rewardly.herokuapp.com');
    socket.on('connect', function(data) {
        socket.emit('join', 'Hello World from client');
    });

    socket.on('messages', function(data) {
                //alert(data);
        });

    socket.on('broad', function(data) {

          var template = $("#thread-template").html();
		  var templatecompile = Handlebars.compile(template);
		  var output = templatecompile(data);
		  $(".postbox").prepend(output);
		   });

	$("#reward-btn").click(function(){
 
	 var msg = $('#message').val();

	 if(selectedValue != "" && selecteduserId != "" && msg !=""){
	 var settings = {
	   "async": true,
	   "crossDomain": true,
	   "url": "https://rewardlyapi.herokuapp.com/api/rewards",
	   "method": "POST",
	   "headers": {
		 "content-type": "application/json",
		 "cache-control": "no-cache",
		 "postman-token": "efc5c122-d5c0-1c06-0962-f63bdabc36ea"
	   },
	   "processData": false,
	   "data": JSON.stringify(
		{ 
		 "type": selectedValue,
		 "points": msg,
		 "user_recieved": selecteduserId,
		 "user_awarded": currentuser.userid 
		})

	 }

	 $.ajax(settings).done(function (response) {
	 	var dataObj = JSON.parse(settings.data);
		var message = {
		  receivername: selecteduserName,
		  rewardname: idImageSourceMapping[dataObj.type].name,
		  rewardername: currentuser.username,
		  threadmessage: dataObj.points,
		  imgpath: idImageSourceMapping[dataObj.type].iconurl};
		  
		  socket.emit('messages', message);
	 });
	}
	else
	{
		if(selecteduserId == '' || selecteduserId == undefined){
			$(".suggestr").addClass('error');
		}
		if(selectedValue == '' || selectedValue == undefined){
			$("#badgeerror").show();
		}
		if(msg == '' || msg == undefined){
            $("#message").addClass('error');
		}
	}
	});

		
	$(".suggestr").on("blur", function(){
		if(($(this).text != '') && ($(this).hasClass("error")))
		{
			$(this).removeClass('error');
		}
	 });
	$("#message").on("blur", function(){
		if(($(this).text != '') && ($(this).hasClass("error")))
		{
			$(this).removeClass('error');
		}
	 });
});
