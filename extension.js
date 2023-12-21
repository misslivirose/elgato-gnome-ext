// A simple toggle to turn my Elgato Keylight on and off
// I've already set up keylight-control, so this is just invoking that without using the command line
// Adds a button to the GNOME taskbar at the top  of the OS 
// Tested on GNOME v42, Ubuntu 22.04

const { St, Clutter } = imports.gi;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const SCHEMA_STRING = 'org.gnome.shell.extensions.elgato-light';

// Define objects for the window
let uiWindow, indicatorButton, indicatorButtonText;

// Variables for controlling the light
let lightOn = false;

let settings;

// Get the saved settings from the light
function getLightSettingsFromSchema() {
  let GioSchemaSource = Gio.SettingsSchemaSource;
  let schemaSource = GioSchemaSource.new_from_directory(
    Me.dir.get_child('schemas').get_path(),
    GioSchemaSource.get_default(),
    false
  );
  let schemaObj = schemaSource.lookup(SCHEMA_STRING, true);
  if (!schemaObj) {
    log('Error finding saved settings schema');
  }
  return new Gio.Settings({ settings_schema: schemaObj });
}

function buildUI() {
  let brightness = new PopupMenu.PopupMenuItem('Brightness');
  brightness.add_child(new St.Label({ text: 'Brightness: ' + settings.get_int('bright') }));
  indicatorButton.menu.addMenuItem(brightness);
}

function toggleLight() {

  // Run `journalctl -f -o cat /usr/bin/gnome-shell in terminal window to view log output
  log('Calling toggleLight...');
  if (lightOn) {
    lightOn = false;
    GLib.spawn_command_line_sync('keylight-control --bright 0');
    indicatorButtonText.set_text('On');
  } else {
    lightOn = true;
    GLib.spawn_command_line_sync('keylight-control --bright 50');
    indicatorButtonText.set_text('Off');
  }

}

function init() {
  // Load the settings file from extension schema
  settings = getLightSettingsFromSchema();
  log('Light IP Address: ' + settings.get_string('light-ip-address'));
}

function enable() {
    // Create a toggle button with "Elgato" text
  // TODO: Make panel with additional controls
  // For now, just a toggle
  indicatorButton = new PanelMenu.Button({
    style_class: 'panel-button'
  });
  indicatorButtonText = new St.Label({
    text: 'Elgato',
    y_align: Clutter.ActorAlign.CENTER,
  });

  //Make button respond as a toggle, add text, connect press event
  //indicatorButton.set_toggle_mode(true);
  indicatorButton.add_child(indicatorButtonText);
  indicatorButton.connect('button-press-event', toggleLight); 


  // Add the button to the panel
  Main.panel.addToStatusArea('indicator', indicatorButton, 1);
}

function disable() {
  // Remove the added button from panel
  indicatorButton.destroy();
}