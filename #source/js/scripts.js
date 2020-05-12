$(function () {

	@@include('webp-addClass.js')
	@@include('name-slider.js')

	$("body").on('click', '[href*="#"]', function (e) {
		$.scrollTo($(this.hash), 1000);
	});

});