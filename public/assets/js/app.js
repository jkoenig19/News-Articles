$(document).ready(function() {
    var newsArticles = [];

    $("#getArticles").on("click", function(event){
        event.preventDefault();
        $("#articles").empty();
        newsArticles = [];
        $.get("/scrape", function(data) {
            newsArticles = data;
            var link = "";
            var articleCount = 0;
            for (var i = 0; i < data.length; i++) {
                if (data[i].headline && data[i].summary && data[i].url){
                    link = "https://www.nytimes.com" + data[i].url;
                    var articleDiv = $("<div class='shadow p-3 mb-5 bg-white rounded border'>");
                    articleDiv.append("<p>" + "Headline: " + data[i].headline + "</p>");
                    articleDiv.append("<p>" + "Summary: " + data[i].summary + "</p>");
                    articleDiv.append("<p>" + "URL: " + "<a href=" + link + ">" + link + "</a>" + "</p>");
                    var newButton = $("<button>");
                    newButton.addClass("article btn btn-success");
                    newButton.attr("data-id", i);
                    newButton.text("SAVE ARTICLE");
                    articleDiv.append(newButton);
                    $("#articles").append(articleDiv);
                    articleCount++;
                }
            }
            $("#countModal").modal("show");
            $("#count").empty();
            $("#count").append("Added " + articleCount + " articles for review!");
        });
    });

    $(document).on("click", ".article", function(){
        var articleId = $(this).attr("data-id");
        var saveArticle = newsArticles[articleId];
        $.ajax({
            method: "GET",
            url: "/articles"
            })
            .then(function(data) {
                if (data.length === 0){
                    $.ajax({
                        method: "POST",
                        url: "/saveArticle",
                        data: {
                            headline: saveArticle.headline,
                            summary: saveArticle.summary,
                            url: saveArticle.url
                        }
                    })
                    .then(function(data) {
                        location.replace("/saved");
                    });
                }
                for (var i=0; i < data.length; i++){
                    if (data[i].headline === saveArticle.headline){
                        $("#countModal").modal("show");
                        $("#count").empty();
                        $("#count").append("Article already saved!");
                    }
                    else if (data[i].headline !== saveArticle.headline && i === data.length-1){
                        $.ajax({
                            method: "POST",
                            url: "/saveArticle",
                            data: {
                                headline: saveArticle.headline,
                                summary: saveArticle.summary,
                                url: saveArticle.url
                            }
                        })
                        .then(function(data) {
                            location.replace("/saved");
                        });
                    }
                }
            });
    });

    $(document).on("click", ".articleNotes", function() {
        $("#commentsModalLabel").empty();
        $("#previousComments").empty();
        $("#commentsField").empty();
        $("#commentsModal").modal("show");
        var articleId = $(this).attr("data-id");
        $.ajax({
            method: "GET",
            url: "/articles/" + articleId
            })
            .then(function(data) {
                console.log(data)
            $("#commentsModalLabel").append("Notes For Article: " + data._id);
            if (data.note.length === 0) {
                var savedDiv = $("<div class='savedComments text-center border'>");
                savedDiv.append("No saved notes for this article.");
                $("#previousComments").append(savedDiv);
                $("#previousComments").append("<br>");
            }
            else {
                for (var i=0; i < data.note.length; i++){
                    var savedDiv = $("<div class='savedComments text-center border'>");
                    savedDiv.append(data.note[i].comment);
                    savedDiv.append("<button class='btn btn-danger btn-sm float-right mr-3' data-noteId=" + data.note[i]._id + " id='deleteNote'>Delete Note</button>");
                    $("#previousComments").append(savedDiv);
                    $("#previousComments").append("<br>");
                }
            }
            $("#commentsField").append("<textarea id='commentInput' placeholder='new note'></textarea>");
            $("#saveNote").attr("data-id", data._id);
            });
    });

    $(document).on("click", "#saveNote", function() {
        var articleId = $(this).attr("data-id");
        $.ajax({
            method: "POST",
            url: "/articles/" + articleId,
            data: {
                comment: $("#commentInput").val()
            }
        })
        .then(function(data) {
            console.log(data)
        });
    });

    $(document).on("click", "#deleteNote", function() {
        $("#commentsModal").modal("hide");
        var noteId = $(this).attr("data-noteId");
        $.ajax({
            method: "DELETE",
            url: "/notes/" + noteId
        })
        .then(function(data) {
        });
    });

    $(document).on("click", ".articleDelete", function() {
        var articleId = $(this).attr("data-id");
        $.ajax({
            method: "GET",
            url: "/articles/" + articleId
            })
            .then(function(data) {
                if (data.note.length !== 0) {
                    for (var i=0; i < data.note.length; i++){
                        var noteId = data.note[i]._id;
                        $.ajax({
                            method: "DELETE",
                            url: "/notes/" + noteId
                        })
                        .then(function(data) {
                        });
                    }
                }                
                $.ajax({
                    method: "DELETE",
                    url: "/articles/" + articleId
                })
                .then(function(data) {
                    location.reload();
                });
            });
    });
});