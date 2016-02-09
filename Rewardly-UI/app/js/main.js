$(document).ready(function(){
	$('.selectrEl').selectr({
	
	select:function(ev,object){
	alert(object); }
	, filter:false, footer:false });
});

	$(".btn").popover({
		content: "HELLO"
	});

$(".btn").click(function(){
	$(".btn").popover("show");
})