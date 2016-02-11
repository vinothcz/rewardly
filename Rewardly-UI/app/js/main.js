
var data = {Dataset: [{imgurl:"app/images/value1.png", id:'value1'},
					  {imgurl:"app/images/value2.png", id:'value2'},
					  {imgurl:"app/images/value3.png", id:'value3'},
					  {imgurl:"app/images/value4.png", id:'value4'}]};

var idImageSourceMapping = {"value1":{iconurl: "app/icons/value1.png", name:"Force of Insight"} , 
"value2":{iconurl: "app/icons/value2.png", name:"Power of Language"} , 
"value3":{iconurl: "app/icons/value3.png", name:"Run to Criticism"} , 
 "value4":{iconurl: "app/icons/value4.png", name:"Spirit of Generosity"}}; 

var badgecontrol = $('#badgecontrol');
var selecteduser = '';
var currentuser = document.cookie;
var selectedValue;


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
		direction: 'bottom'
	});

	$('#badgecontrol').on('click', function () {				
		badgecontrol.popover('show');            
	});

	$(document).on('click','.popup-item-image', function(){
		var item = idImageSourceMapping[this.id];
		selectedValue = this.id;
		badgecontrol.attr('src',item.iconurl);
		$('.badge-label').text(item.name);
		badgecontrol.popover('hide');

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
			selecteduser = e.target.id;
			$('.suggestr').val(e.target.innerText);
		}
	});

	
	var socket = io.connect('http://localhost:4200');
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

	 var settings = {
	   "async": true,
	   "crossDomain": true,
	   "url": "https://rewardly.herokuapp.com/api/rewards",
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
		 "user_recieved": selecteduser,
		 "user_awarded": currentuser.currentuserid 
		})

	 }

	 $.ajax(settings).done(function (response) {
		var message = {
		  "receivername": settings.data.user_recieved,
		  "rewardname": idImageSourceMapping[settings.data.type],
		  "rewardername": settings.data.user_awarded,
		  "threadmessage": settings.data.points};
		  
		  socket.emit('messages', message);
	 });
	});

});
