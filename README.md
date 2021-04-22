<h1 align="center">play-whatever</h1>
<h2 align="center">A tool to generate <strong>infinite</strong> playlists on Spotify!</h2>

<p align="center">
  <img width="500" src="play.png">
</p>

## How to use it

1. Make a Spotify playlist named play-whatever (must be that exact name).
2. Fill it with some of your absolute favorite songs. These will serve as the seeds for your infinite playlists.
   1. The more seeds, the merrier. You'll find that the playlists you generate end up more unique. I recommend at least 10 songs.
3. Head to [the tool](https://play-whatever.appspot.com/).
4. Sign in with Spotify.
5. Choose a diversity. This is the number of tracks that will be used to seed the resulting playlist.
   1. For a more uniform playlist, choose a low diversity. For a highly varied playlist, choose a high diversity.
6. Click "Make the magic happen"!
7. Voila. Your new playlist has been made, and should be titled whatever. You can find it in your Spotify client or head there directly with the "See the results" button.
   1. Any new playlist you generate will override the old one.

## Contributing

**Prerequisites**: You'll need Node and npm/yarn.

1. Clone the repo.
2. Head to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications).
3. Create a new app. You can call it whatever you like.
4. Click on "Edit Settings". Add `http://localhost:5000/callback` as a Redirect URI. Hit "Save".
5. Grab the client ID and client secret. Put them in a `.env` file in the root of the repo as CLIENT_ID and CLIENT_SECRET.
6. In `server.js`, make sure that the `redirect_uri` is set to `"http://localhost:5000/callback"`.
7. Run `npm start` or `yarn start`.
8. Navigate to http://localhost:5000/callback in your browser.
9. You should see the app! Any changes you make will be reflected upon refresh.
10. Push your changes to a branch. Open a PR, and let me know!

## Author

Matt Farejowicz
