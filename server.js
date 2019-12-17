var express = require("express");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.get("/", function(req, res) {
  res.render("index");
});

app.get("/saved", function(req, res) {
  db.Article.find({})
  .then(function(dbArticle) {
    var hbsObject = {
      articles: dbArticle
    };
    res.render("articles", hbsObject);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.get("/scrape", function(req, res) {
  axios.get("https://www.nytimes.com").then(function(response) {
    var $ = cheerio.load(response.data);
    var collection = [];
    $("article").each(function(i, element) {
      var result = {};
      result.headline = $(this)
        .find("h2")
        .text();
      result.summary = $(this)
        .find("p")
        .text();
      result.url = $(this)
        .find("a")
        .attr("href");
      collection.push(result);
    });
    res.json(collection);
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
  .populate("note")
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.post("/saveArticle", function(req, res) {
  db.Article.create(req.body)
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
  .then(function(dbNote) {
    return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: { note: dbNote._id }}, { new: true });
  })
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.delete("/notes/:id", function(req, res) {
  db.Note.findOneAndDelete({ _id: req.params.id })
  .then(function(dbNote) {
    res.json(dbNote);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.delete("/articles/:id", function(req, res) {
  db.Article.findOneAndDelete({ _id: req.params.id })
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
