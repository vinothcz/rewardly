'use strict';

$(document).ready( 	function(){

var template = $("#thread-template").html();

var templatecompile = Handlebars.compile(template);
	
	$.ajax({
		async: true,
		crossDomain: true,
		url: "http://localhost:3007/api/rewards" ,
		type: 'GET',
//		headers: { 'Content-Type' : 'application/json' },
		success: function (data) {

		if ( data != null) 	{

		console.log(data);
		var i=0;
		while (data[i] != null )  {
		var context ={	rewardname : data[i][0].type ,
				rewardername : data[i][0].user_awarded[0].user_name ,
				receivername: data[i][0].user_recieved[0].user_name
			  };	
		var output = templatecompile(context);
		$(".postbox").prepend(output);
		i+=1;
		}
		
	}

	}

	}); 

});


