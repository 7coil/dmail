/* eslint-env browser */
/* globals $ */

$(document).ready(() => {
	$('.carousel.carousel-slider').carousel({
		fullWidth: true,
		indicators: false
	});
	Materialize.showStaggeredList('#staggered-text')
});

$(window).resize(() => {
	$('#wheeloffortune').height(document.body.clientHeight - $('nav').height() - $('footer').height() - 20);
}).resize();
