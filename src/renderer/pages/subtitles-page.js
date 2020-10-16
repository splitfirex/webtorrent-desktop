const React = require("react");
const { dispatch, dispatcher } = require("../lib/dispatcher");

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

  dispatch("tryToLogin");
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

function renderOpenSubtitlesInputSearch(state) {
  return (
    <div className="searchSection">
      <i
        className="icon back"
        style={{ fontSize: "30px", marginTop: "-3px" }}
      ></i>
      <h1 style={{ textAlign: "center" }}>Search subtitle</h1>
      <input type="text" name="searchBar" className="searchBar"></input>

      <ul>{renderSubtitleItem(null)}</ul>
    </div>
  );
}

function renderSubtitleItem(listSubtitles) {
  const pruebas = ["prueba1", "prueba2", "prueba3"];
  return pruebas.map((x) => <li></li>);
}
