require("dotenv").config();

const express = require("express");
const session = require("express-session");
const qs = require("querystring");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const moment = require("moment-timezone");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirect_uri = "https://play-whatever.appspot.com/callback";
// const redirect_uri = "https://play-whatever.herokuapp.com/callback";
// const redirect_uri = "http://localhost:5000/callback";

const app = express();

app.use(cookieParser());
app.use(session({ secret: "6969", resave: true, saveUninitialized: true }));
app.use(express.static("public"));

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = (length) => {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
const stateKey = "spotify_auth_state";

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/whoami", (req, res) => {
  res.send({ user: req.session.userId });
});

app.get("/login", (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  const scope =
    "user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      qs.stringify({
        response_type: "code",
        client_id: clientId,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

app.get("/callback", async (req, res) => {
  // your application requests refresh and access tokens
  // after checking the state parameter

  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        qs.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    const test = await axios.post(
      "https://accounts.spotify.com/api/token",
      qs.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        responseType: "json",
      }
    );
    // TODO: error check here
    const data = test.data;
    req.session.accessToken = data.access_token;
    req.session.refreshToken = data.refresh_token;

    const me = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: "Bearer " + data.access_token },
      responseType: "json",
    });
    req.session.userId = me.data.id;

    res.redirect("/");
  }
});

const getPlaylists = async (accessToken) => {
  const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: "Bearer " + accessToken },
    responseType: "json",
  });
  return response.data.items;
};

const getPlaylistItems = async (accessToken, playlist) => {
  const playlistId = playlist.id;
  const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: "Bearer " + accessToken },
    responseType: "json",
  });
  return response.data.items;
};

/**
 *
 * @param {string} accessToken
 * @param {Array<Track>} seeds
 */
const getRecommendations = async (accessToken, seeds) => {
  const seedIds = seeds.map((el) => el.track.id);
  const response = await axios.get(`https://api.spotify.com/v1/recommendations`, {
    params: {
      limit: 30,
      seed_tracks: seedIds.join(","),
    },
    headers: { Authorization: "Bearer " + accessToken },
    responseType: "json",
  });
  return response.data;
};

const formatSeeds = (seeds) => {
  const formatted = seeds.map((seed) => {
    const name = seed.track.name;
    const artists = seed.track.artists.map((artist) => artist.name);
    return `${name} - ${artists.join(", ")}`;
  });
  return formatted.join(" / ");
};

const makeWhatever = async (accessToken, userId, playlists, seeds, recs) => {
  let outputPlaylist = playlists.find((el) => el.name === "whatever");
  if (!outputPlaylist) {
    const test = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: "whatever",
        public: false,
      },
      {
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        responseType: "json",
      }
    );
    outputPlaylist = test.data;
  }

  const time = moment().tz("America/Los_Angeles").format("M/D/YYYY, h:mm:ss A z");
  const formattedSeeds = formatSeeds(seeds);
  const desc = `Mixed at ${time} | SEEDS: ${formattedSeeds}`;
  const details = await axios.put(
    `https://api.spotify.com/v1/playlists/${outputPlaylist.id}`,
    {
      description: desc,
    },
    {
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      responseType: "json",
    }
  );

  const trackUris = recs.map((el) => el.uri);
  const complete = await axios.put(
    `https://api.spotify.com/v1/playlists/${outputPlaylist.id}/tracks`,
    {
      uris: trackUris,
    },
    {
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      responseType: "json",
    }
  );

  return {
    url: outputPlaylist.external_urls.spotify,
    desc,
  };
};

const drawRandom = (arr, n = 1) => {
  const shuffled = arr.sort(() => {
    return 0.5 - Math.random();
  });
  return shuffled.slice(0, n);
};

app.get("/playlists/:diversity", async (req, res) => {
  if (req.session.accessToken) {
    const playlists = await getPlaylists(req.session.accessToken);
    const seedPlaylist = playlists.find((el) => el.name === "play-whatever");
    if (!seedPlaylist) {
      res.send({
        success: false,
        msg:
          "Oops, couldn't find the play-whatever playlist. Be sure to make that first and fill it with some bangers!",
      });
      return;
    }
    const items = await getPlaylistItems(req.session.accessToken, seedPlaylist);
    const seeds = drawRandom(items, parseInt(req.params.diversity));
    const recs = await getRecommendations(req.session.accessToken, seeds);
    const whatever = await makeWhatever(
      req.session.accessToken,
      req.session.userId,
      playlists,
      seeds,
      recs.tracks
    );
    res.send({ success: true, recs: "done?", url: whatever.url, desc: whatever.desc });
    return;
  }
  res.send({
    success: false,
    msg: "Oops, couldn't find your account. Try refreshing and logging in again!",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
