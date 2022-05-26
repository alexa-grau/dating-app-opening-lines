(function () {
	"use strict";
	const template = $("#line-template");
	const mainForm = $("#main-form");
	const mainResponses  = $("#main-responses");
	const interestInput = $("#info-form input[name='interests']");
	const standoutInput = $("#info-form input[name='standouts']");

	template.hide();
	mainResponses.hide();
	$('#spinner').hide();
	$('svg.bi-heart-fill').hide();
	$('.offcanvas span').hide();

	function postMethod(){
		let request = $.ajax({
			method: 'POST',
			url: "/gpt3/opening-lines", 
			contentType: 'application/json',
			data: JSON.stringify({
				interests: interestInput.val(),
                standOuts: standoutInput.val(),
				temperature: $("input[type='range']").val()/100,
			}),
			dataType: 'json',
			beforeSend: function(){
				mainForm.hide();
				$('#spinner').show();
			},
			complete: function(){
				$('#spinner').hide();
			},
			success: function(data){
				// clear old
				const children = $("#openers-list").children();
				if(children.length>1){
					for(const child of children){
						if(child !== template) child.remove();
					}
				}
				// append new
				for(let i in data.responses){
					let cleanedString = data.responses[i].replace(/(\r\n|\n|\r|")/gm, "");
					if(cleanedString.length<3) continue;
					const newOpeningLine = template.clone();
					newOpeningLine[0].id=i;
					newOpeningLine.find("textarea").val(cleanedString);
					newOpeningLine.show();
					$(".card-body#openers-list").append(newOpeningLine);
				}

				// show responses
				buttonEvents(); // add event listeners
				mainResponses.show();
			}
		});
		request.fail(function( jqXHR, textStatus ) {
			alert( "Request failed: " + textStatus );
		});
	}

	$("#help").click(function(event){
		event.preventDefault();
		$('label[for="interests"]').tooltip('show');
		$('label[for="standouts"]').tooltip('show');
	})

	$("#info-form").find("button[name='submit']").click(function (event) {
		event.preventDefault();
		postMethod();
	});

	$("button[name='edit']").click(function(event){
		event.preventDefault();
		updateSaved();
		mainResponses.hide();
		mainForm.show();
	});

	$("button[name='tryAgain']").click(function(event){
		event.preventDefault();
		updateSaved();
		postMethod(); // resubmit same info for GPT3
	});

	// updateSaved events
	$(document).on('visibilitychange', function(event){
		event.preventDefault();
		updateSaved();
	});
	$(window).on('beforeunload', function(event){
		event.preventDefault();
		updateSaved();
	});

	let oldVal = "";
	let lastChange = Date.now();
	$('.offcanvas-body textarea').on('change keyup', function(event){
		event.preventDefault();
		let currentVal = $(this).val();
		let currentTime = Date.now();
		// keeps event from firing w/o change or enough characters for sentiment analysis
		if(currentVal==oldVal || currentVal.length<10 || currentTime-lastChange<5*1000) return;
		oldVal = currentVal;
		lastChange = currentTime;
		postSentiment();
	});

	// css
	$("input[type='range']").css({"width":"100%"});
	$("#cv-spinner").css({
		"height": "100%",
		"display": "flex",
		"justify-content": "center",
		"align-items": "center"
	});
	$('.btn#editor').css({
		position: 'fixed',
		'z-index': '1030',
		bottom: -3,
		right: 15,
		overflow: 'hidden'
	});
	$('.offcanvas span').css({
		'position': 'absolute',
		'bottom': '20px',
		'right': '150px',
		'z-index': 2000
	})
}());