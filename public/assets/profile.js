const mainResponses  = $("#main-responses");
const template = $("#line-template");

// hide responses, template, spinner, and filled heart to begin
mainResponses.hide();
template.hide();
$('#spinner').hide();
$('svg.bi-heart-fill').hide();
$('.offcanvas span').hide();

function postMethod(){
    $.ajax({
        method: 'POST',
        url: "/gpt3/profile", 
        contentType: 'application/json',
        data: JSON.stringify({
            prompt: `Write a ${$('select#tone').val()} dating app profile bio for ${$('input#user-name').val()}, age ${$('input#user-age').val()}. Some key points are ${$('textarea#key-points').val()}.`,
        }),
        dataType: 'json',
        beforeSend: function(){
            // hide form, show spinner
            $("#main-form").hide();
            $('#spinner').show();
        },
        complete: function(){
            // request complete, hide spinner
            $('#spinner').hide();
        },
        success: function(data){
            // clear old
            const children = $("#profiles-list").children();
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
                newOpeningLine.id=i;
                newOpeningLine.find("textarea").val(cleanedString);
                newOpeningLine.show();
                $(".card-body#profiles-list").append(newOpeningLine);
            }

            // show responses
            buttonEvents(); // add event listeners
            mainResponses.show();
        }
    });
}

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

// post from form submit
$("#info-form").find("button[name='submit']").click(function (event) {
    event.preventDefault();
    postMethod();
});

// edit form again
$("button[name='edit']").click(function(event){
    event.preventDefault();
    updateSaved();
    mainResponses.hide();
    mainForm.show();
});

// post same info
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

// css
mainResponses.css('margin-bottom', '100px');
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
$('#info-form label').css('margin-top', '16px');
$('.offcanvas span').css({
    'position': 'absolute',
    'bottom': '20px',
    'right': '150px',
    'z-index': 2000
})