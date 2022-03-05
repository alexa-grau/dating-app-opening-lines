(function () {
	"use strict";
    const template = $("#line-template");
    template.hide();

    function sorted(obj){
        let sortable = [];

        for (var key in obj) {
            sortable.push([key, obj[key]]);
        }

        sortable.sort(function(a, b) {
            const aTrust = (a[1].likes+1)/(a[1].likes+a[1].dislikes+2);
            const bTrust = (b[1].likes+1)/(b[1].likes+b[1].dislikes+2);
            return bTrust - aTrust;
        });

        return sortable;
    }

    function likeClickHandler(elt, session, key){
        elt.find(".like").click(function(){
            let addToLikes = 0;
            const icon = elt.find(".like i")[0];
            if(icon.className==="bi bi-heart"){
                icon.className="bi bi-heart-fill";
                addToLikes = 1;
                session.likes.add(key);
            } else {
                icon.className="bi bi-heart";
                addToLikes = -1;
                session.likes.delete(key);
            }
            // post to update session
            let jsonData = JSON.stringify({
                session: {
                    id: session.id,
                    likes: Array.from(session.likes),
                    dislikes: Array.from(session.dislikes),
                    personalLikes: session.personalLikes,
                },
                updatedLikesDislikes: {
                    line: key,
                    changeLikes: addToLikes,
                    changeDislikes: 0
                }
            });
            $.post( "/openingLines/all",jsonData);
        });
    }

    function dislikeClickHandler(elt, session, key){
        elt.find(".dislike").click(function(){
            let addToDislikes = 0;
            const icon = elt.find(".dislike i")[0];
            if(icon.className==="bi bi-flag"){
                icon.className="bi bi-flag-fill";
                addToDislikes = 1;
                session.dislikes.add(key);
            } else {
                icon.className="bi bi-flag";
                addToDislikes = -1;
                session.dislikes.delete(key);
            }
            // post to update session
            let jsonData = JSON.stringify({
                session: {
                    id: session.id,
                    likes: Array.from(session.likes),
                    dislikes: Array.from(session.dislikes),
                    personalLikes: session.personalLikes,
                },
                updatedLikesDislikes: {
                    line: key,
                    changeLikes: 0,
                    changeDislikes: addToDislikes
                }
            });
            $.post( "/openingLines/all",jsonData);
        });
    }

    function freshGeneratedClick(elt, session){
        elt.click(function(){
            const icon = elt.find("i")[0];
            if(icon.className==="bi bi-heart"){
                icon.className="bi bi-heart-fill";
                if(!session.personalLikes) session.personalLikes = new Set();
                session.personalLikes.add(globalVal);
            } else if(icon.className==="bi bi-heart-fill"){
                icon.className="bi bi-heart";
                if(session.personalLikes) session.personalLikes.delete(globalVal);
            } else if(icon.className==="bi bi-flag"){
                icon.className="bi bi-flag-fill";
            } else {
                icon.className="bi bi-flag";
            }
            let jsonData = JSON.stringify({
                session: {
                    id: session.id,
                    likes: Array.from(session.likes),
                    dislikes: Array.from(session.dislikes),
                    personalLikes: Array.from(session.personalLikes),
                }
            });
            $.post( "/openingLines/all",jsonData);
        });
    }

    let globalVal = "";
    $.get("/openingLines/new", function(data){
        $("#new-textarea").val("NEW! "+data);
        globalVal=data;
    });

	$.get("/openingLines/all", function(data) {
        if(!data) {
            console.log("No data");
            return;
        }
        const openingLines = JSON.parse(data).jsonDatabase;
        let session = JSON.parse(data).session;
        session.likes = new Set(Object.values(session.likes));
        session.dislikes = new Set(Object.values(session.dislikes));
        session.personalLikes = new Set(Object.values(session.personalLikes));
        freshGeneratedClick($("#like-generated-btn"), session);
        freshGeneratedClick($("#dislike-generated-btn"), session);

        const sortedByTrust = sorted(openingLines);
		for (let i=0; i<sortedByTrust.length;i++) {
            const line = sortedByTrust[i];
            if(line[0]==="None") continue;
            const newTodo = template.clone();
            newTodo.find("textarea").val(line[0]);
            if(session.likes.has(line[0])) {
                newTodo.find(".like i")[0].className="bi bi-heart-fill";
            }
            if(session.dislikes.has(line[0])) {
                newTodo.find(".dislike i")[0].className="bi bi-flag-fill";
            }
            likeClickHandler(newTodo, session, line[0]);
            dislikeClickHandler(newTodo, session, line[0]);
			newTodo.show();
			$(`.card-body#openers-list-1`).append(newTodo);
		}
	});
}());