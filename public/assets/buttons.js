const url = window.location.pathname.split("/");
const content = url[url.length-1]; // last bit of url, should be profile, opening-line, saved

const buttonsTemplate = $("div.input-group.template");
const interestInput = $("#info-form input[name='interests']");
const standoutInput = $("#info-form input[name='standouts']");
const profileKeyPoint = $("#info-form #key-points");
// const savedModal = new bootstrap.Modal('.modal', {});

// let modalLiked = {};

function buttonEvents(){
    // add tooltips
    new bootstrap.Tooltip(document.body, {
        selector: "button.copy",
        title: "Copy to clipboard"
    });
    new bootstrap.Tooltip(document.body, {
        selector: "button.save",
        title: "Save"
    });
    new bootstrap.Tooltip(document.body, {
        selector: "button.more",
        title: "More like this"
    });
    new bootstrap.Tooltip(document.body, {
        selector: "button.delete",
        title: "Remove from saved"
    });

    $("button.copy").click(function(event){
        event.preventDefault();
        // copy to clipboard
        $(this).siblings("textarea").eq(0).select();
        document.execCommand('copy');
    
        // update tooltip
        const tooltip = bootstrap.Tooltip.getInstance(this);
        tooltip.setContent({ '.tooltip-inner': 'Copied!' });
        // after 1 second revert to original message
        setTimeout(() => {tooltip.setContent({ '.tooltip-inner': 'Copy to clipboard' });}, 1000);
    });
    
    // front end only, asynchronous post on window unload handles backend
    $("button.save").click(function(event){
        event.preventDefault();

        $(this).find('svg.bi-heart').toggle();
        $(this).find('svg.bi-heart-fill').toggle();
    });
    
    $("button.more").click(function(event){
        event.preventDefault();

        const text = $(this).siblings("textarea").eq(0).val();
        let s='';
        if(content==='opening-line'){
            s=`Write 5 unique dating app ${content}s for somebody who ${interestInput.val()} and ${standoutInput.val()}. It should be something like this: “${text}”\n1.`;
        } else if(content==='profile'){
            s=`Remix this dating app profile bio 5 different times:\n${text}\n1.`;
        } else if(content==='saved'){
            const contentType = $(this).parent()[0].id.split("-").slice(0,-1).join("-");
            if(contentType==='opening-line') s = `Write 5 unique dating app ${contentType}s like this: "${text}"\n1.`;
            else if(contentType==='profile') s=`Remix this dating app profile bio 5 different times:\n${text}\n1.`;
        }
        postMethodMore(JSON.stringify({prompt: s}), $(this).parent());
    });

    // front end only
    $("button.delete").click(function(event){
        event.preventDefault();
        // remove from current screen and hide tooltip
        const tooltip = bootstrap.Tooltip.getInstance(this);
        $(this).parent().remove();
        tooltip.hide();
    });

    
    // $('.modal-body #more-list .input-group button.save').on('click', function(event){
    //     event.preventDefault();
    //     if($(this).find('svg.bi-heart-fill').is(":visible"))
    //         modalLiked[$(this).parent().find("textarea").eq(0).val()]=true;
    //     else
    //         delete modalLiked[$(this).parent().find("textarea").eq(0).val()]
    // });
}

// problem - may need to call buttonEvents, but buttonEvents calls this?
function postMethodMore(s, callingElt){
    $.ajax({
        method: 'POST',
        url: "/gpt3/more", 
        contentType: 'application/json',
        data: s,
        dataType: 'json',
        beforeSend: function(){
            let children = $("div.card-body").children();
            if(content==='saved') children = $(".modal div.card-body").children();
            if(children.length>1){
                for(const child of children){
                    if(child == buttonsTemplate[0] || child == $('#more-template')[0] || child == callingElt[0]) continue;
                    else child.remove();
                }
            }
            if(content==='saved'){
                $('#more-template').hide();
                if(callingElt[0].id.includes('profile')){
                    $("h5.modal-title").text('More Profiles');}
                else if(callingElt[0].id.includes('opening-line'))
                    $("h5.modal-title").text('More Opening Lines');
                savedModal.show();
            }
            $('#spinner').show();
        },
        complete: function(){
            $('#spinner').hide();
        },
        success: function(data){
            // let tempSet = [... new Set(data.responses[0].split(/(\d\.|\d\))/gm))];  // should only be 1 elt in data.responses for more, splits by #. or #)
            // let arr=Array.from(tempSet);
            let arr = [... new Set(data.responses[0].split(/(\d\.|\d\))/gm))];  // should only be 1 elt in data.responses for more, splits by #. or #)
            // append new
            for(let i in arr){
                let cleanedString = arr[i].replace(/(\r\n|\n|\r|^\.|")/gm, "");
                if(cleanedString.length<3) continue;
                let newOpeningLine = buttonsTemplate.clone();
                if(content==='saved'){
                    newOpeningLine = $("#more-template").clone();
                    if(callingElt[0].id.includes('profile')){
                        newOpeningLine.find("textarea").attr('rows', '4');}
                }
                newOpeningLine[0].id=i;
                newOpeningLine.find("textarea").val(cleanedString);
                newOpeningLine.show();
                if(content==='saved'){
                    $(".modal-dialog div.card-body").append(newOpeningLine);
                } else {
                    $("div.card-body").append(newOpeningLine);
                }
            }
            buttonEvents();
        }
    });
}

function postSentiment(){
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: '/sentiment',
        dataType: 'json',
        data: JSON.stringify({text: $('.offcanvas-body textarea').val()}),
        complete: function(data){
            $('.offcanvas span').show();
            $('.offcanvas span').html(data.responseText);
        }
    });
}

function updateSaved(modal_likes=null){
    let objToSend = {'content': content};

    if(content==='profile' || content==='opening-line'){
        let currentWindowLiked = [];
        $('.card-body .input-group').each(function(){
            if($(this).find('svg.bi-heart-fill').is(":visible")){
                currentWindowLiked.push($(this).find("textarea").eq(0).val());
            }
        });
        $('.offcanvas-body.input-group').each(function(){
            if($(this).find('svg.bi-heart-fill').is(":visible")){
                currentWindowLiked.push($(this).find("textarea").eq(0).val());
            }
        })
        objToSend.newArr = currentWindowLiked;
    } else if(content==='saved'){
        let currentLikedLines = [];
        $('#lines-list .input-group').each(function(){
            if($(this)[0].id==='template') console.log('template');
            else currentLikedLines.push($(this).find("textarea").eq(0).val());
        });

        let currentLikedProfiles = [];
        $('#profiles-list .input-group').each(function(){
            currentLikedProfiles.push($(this).find("textarea").eq(0).val());
        });

        // save modal likes
        if(modal_likes){
            // lines-list or profiles-list
            if(modal_likes.content == 'lines-list'){
                currentLikedLines.concat(modal_likes.likes);
            } else if(modal_likes.content == 'profiles-list') {
                currentLikedProfiles.concat(modal_likes.likes);
            } else {
                console.log("incorrectly formatted modal_likes");
            }
        }

        objToSend.newLikedLines = currentLikedLines;
        objToSend.newLikedProfiles = currentLikedProfiles;
    }

    // Async, so some risk that browser may abort
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: '/user/saved',
        dataType: 'json',
        data: JSON.stringify(objToSend)
    });
}