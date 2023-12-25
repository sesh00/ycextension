import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { markdownIcon, runIcon } from '@jupyterlab/ui-components';
import { Cell } from '@jupyterlab/cells';

const CommandIds = {
  /**
   * Command to render a markdown cell.
   */
  renderMarkdownCell: 'toolbar-button:render-markdown-cell',
  /**
   * Command to run a code cell.
   */
  runCodeCell: 'toolbar-button:run-code-cell',
  /**
   * Command to clear all outputs.
   */
  clearAllOutputs: 'toolbar-button:clear-all-cell-outputs',
  /**
   * Command to get all code.
   */
  getAllCode: 'toolbar-button:get-all-code'
};

/**
 * Initialization data for the ycextension extension.
 */

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ycextension:plugin',
  description: 'A JupyterLab extension for Yandex Cloud.',
  autoStart: true,
  optional: [ISettingRegistry, INotebookTracker],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null, notebookTracker: INotebookTracker | null) => {
    console.log('JupyterLab extension ycextension is activated!');
    const { commands } = app;


    if(notebookTracker) {
      commands.addCommand(CommandIds.runCodeCell, {
        icon: runIcon,
        caption: 'Run a code cell',
        execute: () => {
          commands.execute('notebook:run-cell');
        },
        isVisible: () => notebookTracker.activeCell?.model.type === 'code'
      });

      commands.addCommand(CommandIds.renderMarkdownCell, {
        icon: markdownIcon,
        caption: 'Render a markdown cell',
        execute: () => {
          commands.execute('notebook:run-cell');
        },
        isVisible: () => notebookTracker.activeCell?.model.type === 'markdown'
      });

      commands.addCommand(CommandIds.clearAllOutputs, {
        label: 'Clear',
        caption: 'Clear outputs of all cells',
        execute: () => {
          commands.execute('notebook:clear-all-cell-outputs');
        },
      });

      commands.addCommand(CommandIds.getAllCode, {
        label: 'Code',
        caption: 'Get code of all cells',
        execute: async () => {

          let notebook: Notebook;
          if (notebookTracker.currentWidget) {
            const codeCells: String[] = [];
            notebook = notebookTracker.currentWidget.content;
            notebook.widgets.forEach((cell: Cell) => {
              if (cell.model.type === 'code') {
                //if ((<Notebook>notebook).isSelectedOrActive(cell)) {
                  codeCells.push(cell.model.sharedModel.source);
                //}
              }
            });
            console.log(codeCells)

          }




        },
      });
    }




   /* if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('ycextension settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for ycextension.', reason);
        });
    }*/
  }
};

export default plugin;

