
var data = {Dataset: [{imgurl:"app/images/value1.png", id:'value1'},
					  {imgurl:"app/images/value2.png", id:'value2'},
					  {imgurl:"app/images/value3.png", id:'value3'},
					  {imgurl:"app/images/value4.png", id:'value4'}]};

var idImageSourceMapping = {"value1":{iconurl: "app/icons/value1.png", name:"Force of Insight"} , 
"value2":{iconurl: "app/icons/value2.png", name:"Power of Language"} , 
"value3":{iconurl: "app/icons/value3.png", name:"Run to Criticism"} , 
 "value4":{iconurl: "app/icons/value4.png", name:"Spirit of Generosity"}}; 



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
		var badgecontrol = $('#badgecontrol');		
    	badgecontrol.popover('show');            
	});

	$(document).on('click','.popup-item-image', function(){
		var item = idImageSourceMapping[this.id];
		$('#badgecontrol').attr('src',item.iconurl);
		$('.badge-label').text(item.name);
	});

	$('.suggestr').suggestr();

	$.ajax({
		type: 'GET',
		// data: JSON.stringify(data),
	    contentType: 'application/json',
	    url: 'http://localhost:3007/api/feeds',						
	    success: function(data) {
	        console.log('Success: getfeeds')
	    },
	    error: function (xhr, status, error) {
            console.log('Error: ' + error.message);
        },
	});

});

$("#reward-btn").click(function(){
	var rewardtitle = $('.badge-label').text();
	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": "http://localhost:3007/api/rewards",
	  "method": "POST",
	  "headers": {
	    "content-type": "application/json",
	    "cache-control": "no-cache",
	    "postman-token": "efc5c122-d5c0-1c06-0962-f63bdabc36ea"
	  },
	  "processData": false,
	  "data": JSON.stringify(
	  	{ 
	  		"type": rewardtitle,
  			"points": "20",
  			"user_recieved": "56bb18622f7f054d5d1be781",
  			"user_awarded": "56bb1b762f7f054d5d1be782"
	  	})

	}

	$.ajax(settings).done(function (response) {
	  console.log(response);
	});
});