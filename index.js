require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const shortId = require("shortid");
const mongoose = require("mongoose");
const url = require("url");
const dns = require("dns");
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true, unique: true },
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const original_url = req.body.url;
  const urlRegex =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,})([\/\w.-]*)*(\?.*)?$/;
  if (!urlRegex.test(original_url)) {
    return res.json({ error: "invalid url" });
  }
  const urlObj = url.parse(original_url);
  dns.lookup(urlObj.hostname, async (err) => {
    if (err) {
      res.json({ error: "invalid url" });
    } else {
      const maxUrl = await Url.findOne().sort({ short_url: -1 }).exec();
      const shortUrl = maxUrl ? maxUrl.short_url + 1 : 1;
      const newUrl = new Url({
        original_url: original_url,
        short_url: shortUrl,
      });

      const savedUrl = await newUrl.save();
      res.json({
        original_url: savedUrl.original_url,
        short_url: savedUrl.short_url,
      });
    }
  });
});

app.get("/api/shorturl/:shorturl", (req, res) => {
  const shortUrl = parseInt(req.params.shorturl);
  Url.findOne({ short_url: shortUrl }).then((data) => {
    if (!data) return console.error(err);
    if (data) {
      res.redirect(data.original_url);
    } else {
      res.json({ error: "No short URL found" });
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
