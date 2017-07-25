/* eslint-env browser */
/* globals $ Materialize */

const onresize = () => {
	$('#wheeloffortune').height($(window).height() - $('nav').height() - $('footer').height() - 20);
};

$(document).ready(() => {
	$('.carousel.carousel-slider').carousel({
		fullWidth: true,
		indicators: false
	});
	Materialize.showStaggeredList('#staggered-text');
	onresize();
});

$(window).resize(onresize).resize();
