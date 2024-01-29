import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';//NotebookActions
import { markdownIcon, runIcon } from '@jupyterlab/ui-components';
import { ILoggerRegistry, ITextLog } from '@jupyterlab/logconsole';

import { Cell } from '@jupyterlab/cells';
import axios from 'axios';

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
  getAllCode: 'toolbar-button:get-all-code',
  /**
   * Command for main menu settings.
   */

};

/**
 * Initialization data for the ycextension extension.
 */

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ycextension:plugin',
  description: 'A JupyterLab extension for Yandex Cloud.',
  autoStart: true,
  optional: [INotebookTracker],
  requires: [ILoggerRegistry, ISettingRegistry as any],
  activate: (app: JupyterFrontEnd, loggerRegistry: ILoggerRegistry,
             settingRegistry: ISettingRegistry, notebookTracker: INotebookTracker | null) => {
    console.log('JupyterLab extension ycextension is activated!');
    const { commands } = app;

    let email = "";
    let password = "";
    let token = "";

    /**
     * Load the settings for this extension
     *
     * @param setting Extension settings
     */
    function loadSetting(setting: ISettingRegistry.ISettings): void {
      // Read the settings and convert to the correct type
      email = setting.get('email').composite as string;
      password = setting.get('password').composite as string;
      token = setting.get('token').composite as string;

      console.log(
        `'${password}' '${email}' '${token}'`
      );
    }

    function setSetting(setting: ISettingRegistry.ISettings): void {
      // Read the settings and convert to the correct type
      setting.set('email', email);
      setting.set('password', password);
      setting.set('token', token);
     

      console.log(
        `'${password}' '${email}' '${token}'`
      );
    }

   Promise.all([app.restored, settingRegistry.load(plugin.id)])
      .then(([, setting]) => {
        loadSetting(setting);
      })

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
              if (cell.model.type === 'code' && cell.model.sharedModel.source.startsWith('#!spark --cluster new\n')) {
                //if ((<Notebook>notebook).isSelectedOrActive(cell)) {
                  codeCells.push(cell.model.sharedModel.source);

                 const logger = loggerRegistry.getLogger(
            notebookTracker.currentWidget?.context.path || ''
                  );

                  const msg: ITextLog = {
                    type: 'text',
                    level: 'info',
                    data: cell.model.sharedModel.source
                  };

                  logger.log(msg);

                  //cell.model.sharedModel.updateSource(0,cell.model.sharedModel.source.length, 'print("deleted")' );
                  //NotebookActions.insertBelow(notebook);
                  // const activeCell = notebook.activeCell;
                  //if(activeCell)   activeCell.model.sharedModel.setSource("my content");

                //}
              }
            });


            if (email.length > 0 && password.length > 0) {
              try {
                const response =  await axios.post("http://localhost:8080/api/users/login",
                  { username: email, password: password }
                );

                token = response.data;
                settingRegistry.load(plugin.id).then(setting =>  setSetting(setting));


              } catch (error) {
                console.log('Произошла ошибка при выполнении POST-запроса:', error);
              }

            }


            try {
              const concatenatedString: string = codeCells.join('');
             /* const response = await axios.post("http://localhost:8080/api/tasks",
                { userId: 1, code: concatenatedString });*/

              const response = await axios.post("http://localhost:8080/api/tasks",
                { code: concatenatedString },
                { headers: { 'Authorization': token } }
              );

              console.log('Ответ сервера:', response.data);
            } catch (error) {
              console.log('Произошла ошибка при выполнении POST-запроса:', error);
            }


            console.log(codeCells)
          }
        },
      });
    }


  }
};

export default plugin;

