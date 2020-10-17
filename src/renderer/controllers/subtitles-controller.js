const electron = require("electron");
const fs = require("fs");
const path = require("path");
const parallel = require("run-parallel");
const Trakt = require("trakt.tv");
const request = require("request");
const config = require('./../../config')

const trackOptions = {
  client_id: "secret",
  client_secret:
    "secret",
  redirect_uri: null, // defaults to 'urn:ietf:wg:oauth:2.0:oob'
  api_url: null, // defaults to 'https://api.trakt.tv'
  useragent: null, // defaults to 'trakt.tv/<version>'
  pagination: true, // defaults to false, global pagination (see below)
};

const trakt = new Trakt(trackOptions);

const remote = electron.remote;

const { dispatch } = require("../lib/dispatcher");

const OS = require("opensubtitles-api");

module.exports = class SubtitlesController {
  constructor(state) {
    this.state = state;
  }

  openSubtitles() {
    loadOpenSubtitles();

    /*  const filenames = remote.dialog.showOpenDialogSync({
      title: "Select a subtitles file.",
      filters: [{ name: "Subtitles", extensions: ["vtt", "srt"] }],
      properties: ["openFile"],
    });*/
    const filenames = [];
    if (!Array.isArray(filenames)) return;
    this.addSubtitles(filenames, true);
  }

  selectSubtitle(ix) {
    this.state.playing.subtitles.selectedIndex = ix;
  }

  toggleSubtitlesControls() {
    const subtitles = this.state.playing.subtitles;
    subtitles.showControls = !subtitles.showControls;
  }

  toggleSubtitlesMenu() {
    const subtitles = this.state.playing.subtitles;
    subtitles.showMenu = !subtitles.showMenu;
  }

  toggleLoginPage() {
    const subtitles = this.state.playing.subtitles;
    subtitles.showLoginPage = !subtitles.showLoginPage;
  }

  tryToLogin(username, password) {
    const subtitles = this.state.playing.subtitles;
    subtitles.isProcessLogin = !subtitles.isProcessLogin;
    subtitles.loginError = null;

    subtitles.openSubApi = new OS({
      useragent: "UserAgent",
      username: username,
      password: password,
      ssl: true,
    });

    subtitles.openSubApi
      .login()
      .then((res) => {
        subtitles.openSubtitlesToken = res.token;
        subtitles.showLoginPage = !subtitles.showLoginPage;
        subtitles.isProcessLogin = !subtitles.isProcessLogin;
        subtitles.showSearchBar = true;
      })
      .catch((err) => {
        subtitles.isProcessLogin = !subtitles.isProcessLogin;
        subtitles.showSearchBar = false;
        subtitles.loginError = err;
      });
  }

  cleanMovieTitle(fileName) {}

  searchSubtitles(textSearch) {
    const subtitles = this.state.playing.subtitles;

    const searchQuery = {};

    const myRegexp = /[S|s](\d+)[E|e](\d+)/g;
    const match = myRegexp.exec(textSearch);
    let movieShowTitle = textSearch;
    if (match != null) {
      searchQuery.season = match[1];
      searchQuery.episode = match[2];
      movieShowTitle = movieShowTitle.replace(match[0],"");
    }
     
    trakt.search
      .text({
        query: movieShowTitle,
        type: "movie,show",
      })
      .then((response) => {
        const imbdid = response.data[0].show ? response.data[0].show.ids.imdb : response.data[0].movie.ids.imdb;
        
        searchQuery.sublanguageid = "es";
        searchQuery.extensions = ["srt", "vtt"];
        searchQuery.limit = "10";
        searchQuery.gzip= false

        searchQuery.imdbid = imbdid;

          subtitles.openSubApi
          .search(searchQuery)
          .then((subs) => {
            subtitles.listSubtitles = subs["es"];
          })
          .catch((err) => {
            subtitles.listSubtitles = [];
          });
      });
  }

  selectSubtitleOpenSubtitles(idx){
    const subtitles = this.state.playing.subtitles;
    const downPath = config.DEFAULT_DOWNLOAD_PATH+ "\\"+subtitles.listSubtitles[idx].filename;
    request(subtitles.listSubtitles[idx].url).pipe(fs.createWriteStream())
    this.addSubtitles([subtitles.listSubtitles[idx].url], true);
  }
  
  addSubtitles(files, autoSelect) {
    // Subtitles are only supported when playing video files
    if (this.state.playing.type !== "video") return;
    if (files.length === 0) return;
    const subtitles = this.state.playing.subtitles;

    // Read the files concurrently, then add all resulting subtitle tracks
    const tasks = files.map((file) => (cb) => loadSubtitle(file, cb));
    parallel(tasks, function (err, tracks) {
      if (err) return dispatch("error", err);

      for (let i = 0; i < tracks.length; i++) {
        // No dupes allowed
        const track = tracks[i];
        let trackIndex = subtitles.tracks.findIndex(
          (t) => track.filePath === t.filePath
        );

        // Add the track
        if (trackIndex === -1) {
          trackIndex = subtitles.tracks.push(track) - 1;
        }

        // If we're auto-selecting a track, try to find one in the user's language
        if (autoSelect && (i === 0 || isSystemLanguage(track.language))) {
          subtitles.selectedIndex = trackIndex;
        }
      }

      // Finally, make sure no two tracks have the same label
      relabelSubtitles(subtitles);
    });
  }

  checkForSubtitles() {
    if (this.state.playing.type !== "video") return;
    const torrentSummary = this.state.getPlayingTorrentSummary();
    if (!torrentSummary || !torrentSummary.progress) return;

    torrentSummary.progress.files.forEach((fp, ix) => {
      if (fp.numPieces !== fp.numPiecesPresent) return; // ignore incomplete files
      const file = torrentSummary.files[ix];
      if (!this.isSubtitle(file.name)) return;
      const filePath = path.join(torrentSummary.path, file.path);
      this.addSubtitles([filePath], false);
    });
  }

  isSubtitle(file) {
    const name = typeof file === "string" ? file : file.name;
    const ext = path.extname(name).toLowerCase();
    return ext === ".srt" || ext === ".vtt";
  }
};

function loadSubtitle(file, cb) {
  // Lazy load to keep startup fast
  const concat = require("simple-concat");
  const LanguageDetect = require("languagedetect");
  const srtToVtt = require("srt-to-vtt");

  // Read the .SRT or .VTT file, parse it, add subtitle track
  const filePath = file.path || file;
  let vttStream = null
  try{
    vttStream = fs.createReadStream(filePath).pipe(srtToVtt());
  }catch(er){
    vttStream = request(filePath).pipe(srtToVtt());
  }

  concat(vttStream, function (err, buf) {
    if (err) return dispatch("error", "Can't parse subtitles file.");

    // Detect what language the subtitles are in
    const vttContents = buf.toString().replace(/(.*-->.*)/g, "");
    let langDetected = new LanguageDetect().detect(vttContents, 2);
    langDetected = langDetected.length ? langDetected[0][0] : "subtitle";
    langDetected =
      langDetected.slice(0, 1).toUpperCase() + langDetected.slice(1);

    const track = {
      buffer: "data:text/vtt;base64," + buf.toString("base64"),
      language: langDetected,
      label: langDetected,
      filePath,
    };

    cb(null, track);
  });
}

// Checks whether a language name like 'English' or 'German' matches the system
// language, aka the current locale
function isSystemLanguage(language) {
  const iso639 = require("iso-639-1");
  const osLangISO = window.navigator.language.split("-")[0]; // eg 'en'
  const langIso = iso639.getCode(language); // eg 'de' if language is 'German'
  return langIso === osLangISO;
}

// Make sure we don't have two subtitle tracks with the same label
// Labels each track by language, eg 'German', 'English', 'English 2', ...
function relabelSubtitles(subtitles) {
  const counts = {};
  subtitles.tracks.forEach(function (track) {
    const lang = track.language;
    counts[lang] = (counts[lang] || 0) + 1;
    track.label = counts[lang] > 1 ? lang + " " + counts[lang] : lang;
  });
}
