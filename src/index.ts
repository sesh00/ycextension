import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from "@jupyterlab/application";

import { ISettingRegistry } from "@jupyterlab/settingregistry";
import { INotebookTracker, Notebook } from "@jupyterlab/notebook";
import { markdownIcon, runIcon } from "@jupyterlab/ui-components";
import { Notification } from "@jupyterlab/apputils";
import { Cell } from "@jupyterlab/cells";
import axios from "axios";

const CommandIds = {
  /**
   * Command to render a markdown cell.
   */
  renderMarkdownCell: "toolbar-button:render-markdown-cell",
  /**
   * Command to run a code cell.
   */
  runCodeCell: "toolbar-button:run-code-cell",
  /**
   * Command to clear all outputs.
   */
  clearAllOutputs: "toolbar-button:clear-all-cell-outputs",
  /**
   * Command to get all code.
   */
  getAllCode: "toolbar-button:get-all-code",
  /**
   * Command for main menu settings.
   */
  checkAuthorisation: "toolbar-button:check-authorisation"
};

/**
 * Initialization data for the ycextension extension.
 */

const plugin: JupyterFrontEndPlugin<void> = {
  id: "ycextension:plugin",
  description: "A JupyterLab extension for Yandex Cloud.",
  autoStart: true,
  optional: [INotebookTracker],
  requires: [ISettingRegistry as any],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry,
    notebookTracker: INotebookTracker | null
  ) => {
     Notification.success("Extension YCextension is activated!");
    const { commands } = app;

    let email = "";
    let password = "";
    let token = "";


    function loadSetting(setting: ISettingRegistry.ISettings): void {
      email = setting.get("email").composite as string;
      password = setting.get("password").composite as string;
      token = setting.get("token").composite as string;
    }


    // @ts-ignore
    async function login(setting: ISettingRegistry.ISettings): Promise<void> {

        try {
          const response = await axios.post(
            "http://localhost:8080/api/users/login",
            { username: email, password: password }
          );

          token = response.data;
          await setting.set("token", token).then((r) => {
            Notification.success(
              `You logged in successfully to DataProc Queue. Your authentication token: '${token}'`
            );
          });

        } catch (error) {
          const errorMessage = `Login failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;

          Notification.error(`${errorMessage}`, {
            actions: [
              { label: "Help", callback: () => alert("This was a fake error.") },
            ],
            autoClose: 3000,
          });
        }



    }

    Promise.all([app.restored, settingRegistry.load(plugin.id)]).then(
      ([, setting]) => {
        loadSetting(setting);
        setting.changed.connect(loadSetting);
      }
    );

    if (notebookTracker) {
      commands.addCommand(CommandIds.runCodeCell, {
        icon: runIcon,
        caption: "Run a code cell",
        execute: () => {
          commands.execute("notebook:run-cell");
        },
        isVisible: () => notebookTracker.activeCell?.model.type === "code",
      });

      commands.addCommand(CommandIds.renderMarkdownCell, {
        icon: markdownIcon,
        caption: "Render a markdown cell",
        execute: () => {
          commands.execute("notebook:run-cell");
        },
        isVisible: () => notebookTracker.activeCell?.model.type === "markdown",
      });

      commands.addCommand(CommandIds.clearAllOutputs, {
        label: "Clear",
        caption: "Clear outputs of all cells",
        execute: () => {
          commands.execute("notebook:clear-all-cell-outputs");
        },
      });

      commands.addCommand(CommandIds.checkAuthorisation, {
        label: "Login",
        caption: "Check authorisation status",
        execute: () => {
          settingRegistry.load(plugin.id).then(setting => login(setting));
        },
      });

      commands.addCommand(CommandIds.getAllCode, {
        label: "Submit",
        caption: "Get code of all cells",
        execute: async () => {
          let notebook: Notebook;
          if (notebookTracker.currentWidget) {
            const codeCells: String[] = [];
            notebook = notebookTracker.currentWidget.content;
            notebook.widgets.forEach((cell: Cell) => {
              if (
                cell.model.type === "code" &&
                cell.model.sharedModel.source.startsWith(
                  "#!spark --cluster new\n"
                )
              ) {
                //if ((<Notebook>notebook).isSelectedOrActive(cell)) {
                codeCells.push(cell.model.sharedModel.source);
              }
            });

            try {
              const concatenatedString: string = codeCells.join("");

              const response = await axios.post(
                "http://localhost:8080/api/tasks",
                { code: concatenatedString },
                { headers: { Authorization: token } }
              );

              Notification.success(`Your code has been successfully submitted`);

              console.log("Ответ сервера:", response.data);
            } catch (error) {
              console.log(
                "Произошла ошибка при выполнении POST-запроса:",
                error
              );

              const errorMessage = `Submit failed: ${
                error instanceof Error ? error.message : "Unknown error"
              }`;

              Notification.error(`${errorMessage}`, {
                actions: [
                  {
                    label: "Help",
                    callback: () => alert("This was a fake error."),
                  },
                ],
                autoClose: 3000,
              });
            }

            console.log(codeCells);
          }
        },
      });
    }
  },
};

export default plugin;
