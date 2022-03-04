(function () {
	"use strict";
	const template = $("#line-template");
	template.hide();
	const mainForm = $("#main-form");
	const mainResponses  = $("#main-responses");
	mainResponses.hide();
	$('#spinner').hide();

	const interestInput = $("#info-form input[name='interests']");
	const standoutInput = $("#info-form input[name='standouts']");

	$("input[type='range']").css({"width":"100%"});

	function postMethod(){
		$.ajax({
			method: 'POST',
			url: "/openingLines/personalized", 
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
					const newOpeningLine = template.clone();
					newOpeningLine.id=i;
					newOpeningLine.find("textarea").val(cleanedString);
					newOpeningLine.show();
					$(".card-body#openers-list").append(newOpeningLine);
				}
				// switch out main divs
				mainResponses.show();
			}
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
		mainForm.show();
		mainResponses.hide();
	});

	$("button[name='tryAgain']").click(function(event){
		event.preventDefault();
		postMethod(); // resubmit same info for GPT3
	});

	$("#cv-spinner").css({
		"height": "100%",
		"display": "flex",
		"justify-content": "center",
		"align-items": "center"
	});
}());