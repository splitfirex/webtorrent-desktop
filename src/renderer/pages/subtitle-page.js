const React = require('react')
const PropTypes = require('prop-types')

const Heading = require('../components/heading')
const colors = require('material-ui/styles/colors')
const { dispatch, dispatcher } = require('../lib/dispatcher')
const config = require('../../config')
const Checkbox = require('material-ui/Checkbox').default
const List = require('material-ui/List/List').default
const makeSelectable = require('material-ui/List/makeSelectable').default
const ListItem = require('material-ui/List/ListItem').default
const TextField = require('material-ui/TextField').default
const RaisedButton = require('material-ui/RaisedButton').default
const CircularProgress = require('material-ui/CircularProgress').default
const ClearButton = require('material-ui/svg-icons/content/clear').default

const SelectableList = makeSelectable(List)

const fs = require('fs')

class SubtitlePage extends React.Component {
  constructor (props) {
    super(props)
    this.state = state
  }

  enableSubtitles () {
    return (
      <Preference>
        <Checkbox
          className='control'
          label='Enable subtitles'
          style={{ marginBottom: '20px' }}
          checked={this.state.playing.subtitles.selectedIndex !== -1}
          onClick={dispatcher('toggleSubtitles')}
        />
        <div>
          <div>Tamaño letra</div>
          <RaisedButton
            label='S'
            secondary={this.state.playing.subtitles.subtitlesSize === 0}
            onClick={dispatcher('updateField', 'subtitlesSize', 0)}
          />
          <RaisedButton
            label='M'
            secondary={this.state.playing.subtitles.subtitlesSize === 1}
            onClick={dispatcher('updateField', 'subtitlesSize', 1)}
          />
          <RaisedButton
            label='L'
            secondary={this.state.playing.subtitles.subtitlesSize === 2}
            onClick={dispatcher('updateField', 'subtitlesSize', 2)}
          />
        </div>
        <div>Color letra</div>
        <RaisedButton
          label='White'
          secondary={this.state.playing.subtitles.subtitlesColor === 0}
          onClick={dispatcher('updateField', 'subtitlesColor', 0)}
        />
        <RaisedButton
          label='Yellow'
          secondary={this.state.playing.subtitles.subtitlesColor === 1}
          onClick={dispatcher('updateField', 'subtitlesColor', 1)}
        />
        <div>Color Fondo</div>
        <RaisedButton
          label='NONE'
          secondary={this.state.playing.subtitles.subtitlesBG === 0}
          onClick={dispatcher('updateField', 'subtitlesBG', 0)}
        />
        <RaisedButton
          label='Black'
          secondary={this.state.playing.subtitles.subtitlesBG === 1}
          onClick={dispatcher('updateField', 'subtitlesBG', 1)}
        />
        <RaisedButton
          label='Transparent'
          secondary={this.state.playing.subtitles.subtitlesBG === 2}
          onClick={dispatcher('updateField', 'subtitlesBG', 2)}
        />
      </Preference>
    )
  }

  localFiles () {
    const testFolder =
      config.DEFAULT_DOWNLOAD_PATH + '\\' + this.state.playing.filePath
    let listLocalSubtitles = []

    listLocalSubtitles = fs
      .readdirSync(testFolder)
      .filter((f) => f.indexOf('.srt') > -1)

    return (
      <Preference>
        <TextField
          floatingLabelText='File name :'
          style={{ width: '100%' }}
          value={
            this.state.playing.fileName
          }
        />
        <div>
          Listado subtitulos
        </div>
        <SelectableList
          style={{ maxHeight: '150px', overflow: 'auto' }}
          value={this.state.playing.subtitles.selectedIndex}
          defaultValue={this.state.playing.subtitles.selectedIndex}
        >
          {listLocalSubtitles.length > 0 &&
          listLocalSubtitles.map((value, idx) => {
            return (
              <ListItem
                rightIconButton={
                  <ClearButton
                    onClick={() =>
                      dispatch('removelocalSubtitleIndex', idx)}
                  />
                }
                value={idx}
                onClick={dispatcher('localSubtitleIndex', idx)}
              >
                {idx} - {value}
              </ListItem>
            )
          })}
        </SelectableList>
      </Preference>
    )
  }

  opensubtitlesFiles () {
    function tryToSearch (event) {
      const value = event.target.value
      dispatch('searchSubtitlesText', value)
    }

    return (
      <Preference>
        <div style={{ width: '100%' }}>
          <RaisedButton
            label='TvShow'
            secondary={this.state.playing.subtitles.selectedTraktType === 0}
            onClick={dispatcher('osSubtitlesType', 0)}
          />
          <RaisedButton
            label='Movie'
            secondary={this.state.playing.subtitles.selectedTraktType === 1}
            onClick={dispatcher('osSubtitlesType', 1)}
          />
          <TextField
            onChange={(e) => tryToSearch(e)}
            style={{ width: '100%' }}
            floatingLabelText='Busqueda'
            value={this.state.playing.subtitles.searchText}
          />
        </div>
        <div>Listado subtitulos disponibles</div>
        {this.state.playing.subtitles.isSearching ? (
          <CircularProgress
            size={80}
            thickness={5}
            style={{ marginLeft: 'auto' }}
          />
        ) : (
          <List style={{ maxHeight: '150px', overflow: 'auto' }}>
            {this.state.playing.subtitles.listSubtitles.length > 0 &&
            this.state.playing.subtitles.listSubtitles.map((value, idx) => {
              return (
                <ListItem onClick={dispatcher('downloadSubtitle', idx)}>
                  {idx} - {value.filename}
                </ListItem>
              )
            })}
            {this.state.playing.subtitles.listSubtitles.length === 0 && (
              <ListItem> NO HAY SUBTITULOS DISPONIBLES</ListItem>
            )}
          </List>
        )}
      </Preference>
    )
  }

  traktApi () {
    function updateField (field, value) {
      dispatch('updateField', field, value.currentTarget.value)
    }

    return (
      <Preference>
        <div>Trakt API</div>
        <TextField
          floatingLabelText='Client ID'
          style={{ width: '100%' }}
          value={this.state.playing.subtitles.traktClientId}
          onChange={(e) => updateField('traktClientId', e)}
        />
        <div />
        <TextField
          floatingLabelText='Client Secret'
          style={{ width: '100%' }}
          value={this.state.playing.subtitles.traktSecret}
          onChange={(e) => updateField('traktSecret', e)}
        />
        <div>OpenSubtitles Credentials</div>
        <TextField
          floatingLabelText='OpenSubtitles username'
          style={{ width: '100%' }}
          value={this.state.playing.subtitles.osUsername}
          onChange={(e) => updateField('osUsername', e)}
        />
        <div />
        <TextField
          floatingLabelText='OpenSubtitles password'
          style={{ width: '100%' }}
          value={this.state.playing.subtitles.osPassword}
          onChange={(e) => updateField('osPassword', e)}
        />
      </Preference>
    )
  }

  render () {
    const style = {
      color: colors.grey400,
      marginLeft: 25,
      marginRight: 25
    }
    return (
      <div style={style}>
        <PreferencesSection title='Subtitles config'>
          {this.enableSubtitles()}
        </PreferencesSection>
        <PreferencesSection title='Local subtitles files'>
          {this.localFiles()}
        </PreferencesSection>
        <PreferencesSection title='OpenSubtitles search'>
          {this.opensubtitlesFiles()}
        </PreferencesSection>
        <PreferencesSection title='Trak & OpenSubtitles API keys'>
          {this.traktApi()}
        </PreferencesSection>
      </div>
    )
  }
}

class PreferencesSection extends React.Component {
  static get propTypes () {
    return {
      title: PropTypes.string
    }
  }

  render () {
    const style = {
      marginBottom: 25,
      marginTop: 25
    }
    return (
      <div style={style}>
        <Heading level={2}>{this.props.title}</Heading>
        {this.props.children}
      </div>
    )
  }
}

class Preference extends React.Component {
  render () {
    const style = { marginBottom: 10 }
    return <div style={style}>{this.props.children}</div>
  }
}

module.exports = SubtitlePage
