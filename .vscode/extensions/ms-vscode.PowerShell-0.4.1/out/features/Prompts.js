var vscode = require('vscode');
var ShowChoicePromptNotification;
(function (ShowChoicePromptNotification) {
    ShowChoicePromptNotification.type = { get method() { return 'powerShell/showChoicePrompt'; } };
})(ShowChoicePromptNotification = exports.ShowChoicePromptNotification || (exports.ShowChoicePromptNotification = {}));
var CompleteChoicePromptNotification;
(function (CompleteChoicePromptNotification) {
    CompleteChoicePromptNotification.type = { get method() { return 'powerShell/completeChoicePrompt'; } };
})(CompleteChoicePromptNotification = exports.CompleteChoicePromptNotification || (exports.CompleteChoicePromptNotification = {}));
function showChoicePrompt(promptDetails, client) {
    var quickPickItems = promptDetails.choices.map(function (choice) {
        return {
            label: choice.label,
            description: choice.helpMessage
        };
    });
    // Shift the default item to the front of the
    // array so that the user can select it easily
    if (promptDetails.defaultChoice > -1 &&
        promptDetails.defaultChoice < promptDetails.choices.length) {
        var defaultChoiceItem = quickPickItems[promptDetails.defaultChoice];
        quickPickItems.splice(promptDetails.defaultChoice, 1);
        // Add the default choice to the head of the array
        quickPickItems = [defaultChoiceItem].concat(quickPickItems);
    }
    vscode.window
        .showQuickPick(quickPickItems, { placeHolder: promptDetails.caption + " - " + promptDetails.message })
        .then(function (chosenItem) { return onItemSelected(chosenItem, client); });
}
function onItemSelected(chosenItem, client) {
    if (chosenItem !== undefined) {
        client.sendNotification(CompleteChoicePromptNotification.type, { chosenItem: chosenItem.label });
    }
    else {
    }
}
function registerPromptHandlers(client) {
    client.onNotification(ShowChoicePromptNotification.type, function (promptDetails) { return showChoicePrompt(promptDetails, client); });
}
exports.registerPromptHandlers = registerPromptHandlers;
//# sourceMappingURL=Prompts.js.map