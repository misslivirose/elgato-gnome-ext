// A simple toggle to turn my Elgato Keylight on and off
// I've already set up keylight-control, so this is just invoking that without using the command line
// Adds a button to the GNOME taskbar at the top  of the OS 
// Tested on GNOME v42, Ubuntu 22.04

const { St, Clutter } = imports.gi;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;

const SCHEMA_STRING = 'org.gnome.shell.extensions.elgato-light';

// Define objects for the window
let uiWindow, indicatorButton, indicatorButtonText, toggleButton, toggleLabel;

// Variables for controlling the light
let lightOn = false;
let settings, temperature, brightness;

const UIWindow = GObject.registerClass(
  class UIWindow extends PanelMenu.Button {
    _init() {
      super._init(0);

      // Set up the indicator button
      indicatorButtonText = new St.Label({
        text: 'Elgato',
        y_align: Clutter.ActorAlign.CENTER,
      });

      this.add_child(indicatorButtonText);

      toggleButton = new PopupMenu.PopupMenuItem('Turn light:');
      toggleLabel = new St.Label({ text: lightOn ? 'off' : 'on' });
      toggleButton.add_child(toggleLabel);
      this.menu.addMenuItem(toggleButton);
      toggleButton.connect('activate', () => {
        log ('Clicked brightness item');
        toggleLight();
      });

      // Add UI elements
      let brightnessPanel = new PopupMenu.PopupBaseMenuItem({activate: false});
      brightnessPanel.add_child(new St.Label({text: 'Brightness: '}));
      let brightnessSlider = new Slider.Slider(brightness/100);
      brightnessPanel.add_child(brightnessSlider);
      this.menu.addMenuItem(brightnessPanel);
      brightnessSlider.connect('drag-end', () => {
        updateBrightness(brightnessSlider.value * 100);
      })

      let temperaturePanel = new PopupMenu.PopupBaseMenuItem({activate: false});
      temperaturePanel.add_child(new St.Label({text: 'Temperature: '}));
      let temperatureSlider = new Slider.Slider((temperature - 2900)/4100);
      temperaturePanel.add_child(temperatureSlider);
      this.menu.addMenuItem(temperaturePanel);
      temperatureSlider.connect('drag-end', () => {
        updateTemperature(temperatureSlider.value);
      });

      this.menu.connect('open-state-changed', (menu, open) => {
        if(open) {
          log ('opened menu');
        } else {
          log ('closed menu');
        }
      });
    }
  }
);

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

// Toggle the light on or off
function toggleLight() {

  log('Calling toggleLight...');
  if (lightOn) {
    lightOn = false;
    GLib.spawn_command_line_sync('keylight-control --bright 0');
    toggleLabel.set_text("on");
  } else {
    lightOn = true;
    GLib.spawn_command_line_sync('keylight-control --bright ' + settings.get_int('bright'));
    toggleLabel.set_text("off");
  }
}

// Update the brightness of the light 
function updateBrightness(level) {
  if (!lightOn) {
    lightOn = true;
    toggleLabel.set_text("off");
  }
  brightness = level.toFixed(0);
  GLib.spawn_command_line_sync('keylight-control  --bright ' + brightness);
  settings.set_int('bright', brightness);
}

// Update the temperature of the light 
function updateTemperature(level) {
  if (!lightOn) {
    lightOn = true;
    toggleLabel.set_text("off");
  }

  let levelToKelvin = 2900 + level*4100;
  temperature = levelToKelvin.toFixed(0);
  GLib.spawn_command_line_sync('keylight-control  --temp ' + temperature);
  settings.set_int('temperature', temperature);
}

function init() {
  // Load the settings file from extension schema
  settings = getLightSettingsFromSchema();
  
  brightness = settings.get_int('bright');
  temperature = settings.get_int('temperature');
  
  log('Light IP Address: ' + settings.get_string('light-ip-address'));
  
  log('Light Brightness: ' + brightness);
  log('Light Temperature: ' + temperature + 'K');
}

function enable() {
  uiWindow = new UIWindow();
  // Add the button to the panel
  Main.panel.addToStatusArea('uiWindow', uiWindow, 1);
}

function disable() {
  // Remove the added button from panel
  uiWindow.destroy();
}