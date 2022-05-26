const savedModal = new bootstrap.Modal('.modal', {});
const template = $('#template');
template.hide();
$('svg.bi-heart-fill').hide();

$.get("/user/saved", function(data) {
    if(data.lines.length>0) $(".card-body#lines-list p").hide();
    if(data.profiles.length>0) $(".card-body#profiles-list p").hide();

    for(i in data.lines){
        const newLine = template.clone();
        newLine.find("textarea").val(data.lines[i]);
        newLine[0].id=`opening-line-${i}`;
        newLine.show();
        $(".card-body#lines-list").append(newLine);
    }
    for(j in data.profiles){
        const newProfile = template.clone();
        const profileTextarea = newProfile.find("textarea");
        profileTextarea.val(data.profiles[j]);
        profileTextarea.attr('rows', 4);
        newProfile[0].id=`profile-${j}`;
        newProfile.show();
        $(".card-body#profiles-list").append(newProfile);
    }
    buttonEvents();
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

function postMethod(s){
    $.ajax({
        method: 'POST',
        url: "/gpt3/more", 
        contentType: 'application/json',
        data: JSON.stringify({
            prompt: s,
        }),
        dataType: 'json',
        beforeSend: function(){
            $("#main-form").hide();
            $('#spinner').show();
        },
        complete: function(){
            $('#spinner').hide();
        },
        success: function(data){
            // clear old
            const children = $("div.card-body").children();
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
                $("div.card-body").append(newOpeningLine);
            }
            // switch out main divs
            mainResponses.show();
        }
    });
}

// function modalLikes(){
//     const contentType = $('.carousel-item.active .card-body')[0].id;
//     return {
//         content: contentType, // lines-list or profiles-list
//         likes: Object.keys(modalLiked)
//     };
// }

// // not updating saved page rn so gonna put on the backburner
// $('.modal').on('hidden.bs.modal', function(event){
//     event.preventDefault();
//     console.log("hiding modal!");
//     const contentType = $('.carousel-item.active .card-body')[0].id;
//     let modal_likes = {
//         content: contentType, // lines-list or profiles-list
//         likes: Object.keys(modalLiked)
//     };
//     // console.log(modal_likes);
//     updateSaved(modal_likes); // save liked
// });

// css
$('#carouselExampleIndicators').css('margin-bottom', '100px');
$("#cv-spinner").css({
    "height": "100%",
    "display": "flex",
    "justify-content": "center",
    "align-items": "center"
});