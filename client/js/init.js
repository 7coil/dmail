/* eslint-env browser */
/* globals $ Materialize */

$(document).ready(() => {
	$('.carousel.carousel-slider').carousel({
		fullWidth: true,
		indicators: false
	});
	Materialize.showStaggeredList('#staggered-text');
});

$(window).resize(() => {
	$('#wheeloffortune').height($(window).height() - $('nav').height() - $('footer').height() - 20);
}).resize();
