'use strict';

var idImageSourceMapping = {"value1":{iconurl: "app/icons/value1.png", name:"Force of Insight"} , 
"value2":{iconurl: "app/icons/value2.png", name:"Power of Language"} , 
"value3":{iconurl: "app/icons/value3.png", name:"Run to Criticism"} , 
 "value4":{iconurl: "app/icons/value4.png", name:"Spirit of Generosity"}};

$(document).ready( 	function(){

var template = $("#thread-template").html();

var templatecompile = Handlebars.compile(template);
	
	$.ajax({
		async: true,
		crossDomain: true,
		url: "https://rewardlyapi.herokuapp.com/api/rewards" ,
		type: 'GET',
//		headers: { 'Content-Type' : 'application/json' },
		success: function (data) {

		if ( data != null) 	{

		console.log(data);
		var i=0;
		while (data[0][i] != null )  {
		var currentItem = data[0][i];
		var context = {	rewardname : idImageSourceMapping[currentItem.type].name ,
				rewardername : currentItem.user_awarded.user_name ,
				receivername: currentItem.user_recieved.user_name,
				threadmessage : currentItem.points,
				imgpath: idImageSourceMapping[currentItem.type].iconurl
			  };	
		var output = templatecompile(context);
		$(".postbox").prepend(output);
		i+=1;
		}
		
	}

	}

	}); 

});

