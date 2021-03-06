const React = require("react");
const { dispatch, dispatcher } = require("../lib/dispatcher");

let typingTimer;

module.exports = class SubtitlePage extends React.Component {
  render() {
    const state = this.props;
    return (
      <div className="subtitlesControls">
        {!state.showSearchBar &&
          !state.showLoginPage &&
          renderSelectionButtons(state)}
        {state.showLoginPage && renderOpenSubtitlesInputFields(state)}
        {state.showSearchBar && renderOpenSubtitlesInputSearch(state)}
      </div>
    );
  }
};

function renderSelectionButtons(state) {
  return (
    <div>
      <button>Load local file</button>
      <button onClick={dispatcher("toggleLoginPage")}>
        Login openSubtitles
      </button>
    </div>
  );
}

function tryToLogin(event) {
  event.preventDefault();
  const username = event.target.elements.username.value;
  const password = event.target.elements.password.value;

  dispatch("tryToLogin", username, password);
}

function renderOpenSubtitlesInputFields(state) {
  return (
    <div>
      <form style={{ marginTop: "75px" }} onSubmit={tryToLogin}>
        <h1 style={{ textAlign: "center" }}>OpenSubtitles Login</h1>
        <label>Username</label>
        <input
          disabled={state.isProcessLogin}
          type="text"
          name="username"
          className="username"
        ></input>
        <label>Password</label>
        <input
          disabled={state.isProcessLogin}
          type="password"
          name="password"
          className="password"
        ></input>

        <input
          disabled={state.isProcessLogin}
          type="submit"
          value={state.isProcessLogin ? "trying to log in..." : "Log-in"}
        ></input>
        {state.loginError && <span>{state.loginError}</span>}
      </form>
    </div>
  );
}

function tryToSearch(event) {
  const value = event.target.value;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(()=>doneTyping(value), 3000);
}

function doneTyping(text){
  dispatch("searchSubtitles", text);
}

function renderOpenSubtitlesInputSearch(state) {
  return (
    <div className="searchSection">
      <i
        className="icon back"
        style={{ fontSize: "30px", marginTop: "-3px" }}
      ></i>
      <h1 style={{ textAlign: "center" }}>Search subtitle</h1>
      <input type="text" name="searchBar" className="searchBar"
      onKeyUp={(e=>tryToSearch(e))}></input>

      <ul>{renderSubtitleItem(state.listSubtitles)}</ul>
    </div>
  );
}

function renderSubtitleItem(listSubtitles) {
  return listSubtitles.map((x,idx) => <li key={"sub_"+idx} onClick={()=>selectSubtitle(idx)}>{x.filename}</li>);
}


function selectSubtitle(idx){
  dispatch("selectSubtitleOpenSubtitles", idx);
}