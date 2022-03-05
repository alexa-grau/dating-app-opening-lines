(function () {
	"use strict";
    const template = $("#line-template");
	template.hide();

    function likeClickHandler(elt, session, key, personal=false){
        elt.find(".like").click(function(){
            console.log(session);
            // remove elt from page
            elt.remove();
            // remove from session likes
            session.likes=Array.from(session.likes);
            session.personalLikes=Array.from(session.personalLikes);

            let index = session.likes.indexOf(key);
            if(index>-1) session.likes.splice(index, 1);

            index = session.personalLikes.indexOf(key);
            if(index>-1) session.personalLikes.splice(index, 1);

            // post to update session
            let jsonData = {
                session: {
                    id: session.id,
                    likes: Array.from(session.likes),
                    dislikes: Array.from(session.dislikes),
                    personalLikes: Array.from(session.personalLikes),
                },
                updatedLikesDislikes: {
                    line: key,
                    num: -1
                }
            };
            if(personal) delete jsonData.updatedLikesDislikes;
            $.post({
                url: '/openingLines/user',
                contentType: 'application/json',
                data: JSON.stringify(jsonData),
                dataType: 'json',
            });
        });
    }

	$.get("/openingLines/user", function(data) {
        // let session = JSON.parse(data);
        let session = data.session;
        console.log(session);
        if(Object.keys(session.likes).length<1 && Object.keys(session.personalLikes).length<1){
            $("#openers-list").append("<p class='text-centered'>No favorites yet! Once you like opening lines on our homepage, you'll see those lines here.</p>")
        }
        
        if(Object.keys(session.likes).length>0){
            for (const line of session.likes) {
                if(line[0]==="None") continue;
                const newTodo = template.clone();
                newTodo.find("textarea").val(line);
                likeClickHandler(newTodo, session, line);
                newTodo.show();
                $(".card-body#openers-list").append(newTodo);	
            }
        }
        if(Object.keys(session.personalLikes).length>0){
            for (const line of session.personalLikes){
                const newTodo = template.clone();
                newTodo.find("textarea").val(line);
                likeClickHandler(newTodo, session, line, true);
                newTodo.show();
                $(".card-body#openers-list").append(newTodo);
            }
        }
	});
}());