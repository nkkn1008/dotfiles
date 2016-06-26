var vscode = require('vscode');
function registerCodeActionCommands(client) {
    vscode.commands.registerCommand('PowerShell.ApplyCodeActionEdits', function (edit) {
        console.log("Applying edits");
        console.log(edit);
        var workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(vscode.Uri.file(edit.File), [
            new vscode.TextEdit(new vscode.Range(edit.StartLineNumber - 1, edit.StartColumnNumber - 1, edit.EndLineNumber - 1, edit.EndColumnNumber - 1), edit.Text)
        ]);
        vscode.workspace.applyEdit(workspaceEdit);
    });
}
exports.registerCodeActionCommands = registerCodeActionCommands;
//# sourceMappingURL=CodeActions.js.map