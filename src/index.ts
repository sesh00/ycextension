import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the ycextension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ycextension:plugin',
  description: 'A JupyterLab extension for Yandex Cloud.',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension ycextension is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('ycextension settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for ycextension.', reason);
        });
    }
  }
};

export default plugin;
