
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



});
