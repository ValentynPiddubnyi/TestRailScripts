name: FindeRaplaceV3
description: Add new version to existing
author: Valentyn Piddubnyi
version: 1.0
includes: ^suites/view/5558
excludes:

js:

    $(document).ready(function() {
            UserInterface.addButtonToolBar('Replace');
        }
    );

    var findTextfield = '';
    var replacefield = '';

    var UserInterface = {

        textFieldFind : {
            text: 'Find text:',
            id: 'findTextField'
        },
        textFieldReplace: {
            text: 'Replace by:',
            id: 'replaceTextField'
        },
        popUpLocator : '.ui-dialog .dialog-message',


        addButtonToolBar (buttonName) {
            /* Create the button */
            var button = $('<a id="'+ buttonName + '" class="toolbar-button button-responsive button-edit dropdownLink" href="javascript:void(0)"><span class="button-text">'+ buttonName + '</span></a>');

            /* Add it to the toolbar */
            $("#contentSticky .toolbar").prepend(button);

            this.eventButtonToolBar(buttonName);

        },

        eventButtonToolBar (buttonName){
            $('#'+buttonName).click(function() {
                UserInterface.createFindReplacePopUp();
                    return false;
                }
            );
        },

        createFindReplacePopUp () {
            this.createGeneralPopUp('Replace');
            if(this.getSelectedTests().length==0) {
                this.addText('ATTENTION: you are going to find/replace through all test cases in suite','red');
            }
            this.addField(this.textFieldFind);
            this.addField(this.textFieldReplace);
            //this.addButtonPopUp('Replace', 'ReplacePopUp', true);
            this.addButtonPopUp('Find', 'FindPopUp', false);
            $("a.button.button-ok.button-left.button-positive.dialog-action-default:visible").hide();
        },

        createResultsPopUp(){
            this.createGeneralPopUp('Results:');
            $('.ui-dialog').width('98%');
            $('.ui-dialog').css({left: 10});
            ResultsPopUp.addResultsHeader();
            UserInterface.addButtonPopUp('Replace', 'ReplacePopUp', true);
            $("a.button.button-ok.button-left.button-positive.dialog-action-default:visible").hide();
            $("#FindPopUp").hide();
        },

        createGeneralPopUp(title){
            App.Dialogs.message('',title);
            $(".ui-icon-closethick").click(function() {
                location.reload(false);
            });
        },

        addText(text,color){
            $(this.popUpLocator).append('<div style="color:' + color +';">'+ text + '</div>');
        },

        addField(field){
            var findTextfield = $('<input id="' + field.id + '" type="text" class="form-control form-control-full " value="" maxlength="250">');
            $(this.popUpLocator).append('<div>'+ field.text + '</div>').append(findTextfield);

        },

        addButtonPopUp(buttonName, buttonId, updateCases){
            if (!$('#' + buttonId).length) {
                var button = $('<button id="' + buttonId + '" class="button button-start button-left button-positive dialog-action-default">'+ buttonName + ' </button>');
                $(".ui-dialog .dialog-buttons").append(button);
            }
            this.eventButtonPopUp(buttonName, buttonId, updateCases)
        },

        eventButtonPopUp(buttonName, buttonId, updateCases){
            $('#'+buttonId).off('click').click(function (e) {
                e.preventDefault();
                if(findTextfield==='') {
                    findTextfield = $('#' + UserInterface.textFieldFind.id).val();
                    replacefield = $('#' + UserInterface.textFieldReplace.id).val();
                }
                console.log('Text to Find field value: ',findTextfield);
                console.log('Text to Replace field value: ',replacefield);
                if(updateCases===false){
                    UserInterface.createResultsPopUp();
                }
                if(findTextfield != '') {
                if(UserInterface.getSelectedTests() == 0){
                        var projectId = App.Suites.project_id;
                        var suiteId = App.Suites.suite_id;
                        ApiRequests.getCases(projectId,suiteId).then(function (result) {
                            Replacer.replaceTextArray(result, findTextfield, replacefield, updateCases);
                        })
                    }else {
                    var promises = [];
                    UserInterface.getSelectedTests().forEach(function (key){
                        promises.push(ApiRequests.getCase(key.id));
                    });
                    Promise.all(promises).then(function (results) {
                        Replacer.replaceTextArray(results, findTextfield, replacefield, updateCases);
                        }
                        
                    )
                }
                }
            });
        },

        getSelectedTests() {
            var selected = $(".oddSelected,.evenSelected");
            var testIdsList = [];

            for (var i = selected.length-1; i >= 0 ; i--) {
                testIdsList.push({id : selected.eq(i).attr("rel")});
            }

            return testIdsList;
        }

    };

    var Replacer = {

        replaceTextArray(selectedTests, textToBeReplaced, newText, update){
                var requests = [];
                //console.log('Selected test cases: ',selectedTests);
                console.log('selectedTests.length: ',selectedTests.length);
                if(update){
                    console.clear();
                    console.log('\n \n ============!!!!! UPDATING !!!!!!============= \n \n ');
                } else {
                    console.log('\n \n ============!!!!! CHECKING NOT UPDATING !!!!!!============= \n \n ');
                }
                for (var i = 0; i < selectedTests.length; i++) {
                    requests.push(this.replaceText(textToBeReplaced, newText, selectedTests[i], update));
                    //console.log('Test ware replaced id: ',selectedTests[i]);
                }/*
        if(update) {
            $.when.apply($, requests)
                .then(function () {
                    App.Dialogs.message('Done', title);
                    $("#replace").hide();
                    $("#check").hide();
                }, function () {
                    App.Dialogs.message('Error appears check logs and try again after refreshing page', 'Ooopppsss...');
                });
        }*/

        },

 replaceText(textToBeReplaced, newText,response, update) {
    var regExp = new RegExp(textToBeReplaced, 'g');
    var newTextDemo = '<strong class="demoText">*' + newText + '*</strong>';
    var oldTextDemo = '<strong class="demoText">*' + textToBeReplaced + '*</strong>';
    var payload = {};
    //console.log('response: ',response);
    var firstField = true;
    Object.keys(response).forEach(function(key) {
        if(typeof response[key] === 'string' && regExp.test(response[key])){
            //console.log(key,'is string!');
            if(firstField) {
                console.log('\n\n\n------------============= Test ID ' + response.id + ' =============-------------');
                ResultsPopUp.addTestID(response.id, response.id + ' Title: ' + response.title);
            }
            firstField = false;
            console.log('\n \n =============== Field is: ' + key + ' ===============');
            ResultsPopUp.addTestField(key);
            console.log('\n -------- Text before replace: ----------- \n' + response[key].replace(regExp,oldTextDemo));
            console.log('\n -------- Text after replace: ----------- \n' + response[key].replace(regExp,newTextDemo));
            ResultsPopUp.addResult(response[key].replace(regExp,oldTextDemo),response[key].replace(regExp,newTextDemo));
            payload[key] = response[key].replace(regExp,newText);
        }
        if(key === 'custom_steps_separated' && response[key]!=null){
            response[key].forEach(function(key2,index){
                //console.log('INDEX is ' + index + ' value is: ', response['custom_steps_separated'][index]);
                //console.log('response[\'custom_steps_separated\']['+index+'][content]: ', response[key][index]['content']);
                //console.log('response[\'custom_steps_separated\']['+index+'][expected]: ', response[key][index]['expected']);
                if(regExp.test(key2['content']) || regExp.test(key2['expected'])) {
                    if(firstField){
                        console.log('\n\n\n------------============= Test ID ' + response.id + ' =============-------------');
                        ResultsPopUp.addTestID(response.id);
                        firstField = false;
                    }
                    console.log('\n \n =============== Field is: ' + key + ' ===============');
                    console.log('\n -------======== Step number: ' + (index + 1) + ' ========------');
                    ResultsPopUp.addTestField(key + ' Step number: ' + (index + 1));

                    if(key2['content'].includes(textToBeReplaced)) {
                        console.log('--------- Content -------- ');
                        ResultsPopUp.addStepField('Content');
                        console.log('\n ------- Text before replace: ----------- \n' + response[key][index]['content'].replace(regExp, oldTextDemo));
                        console.log('\n ------- Text after replace: ----------- \n' + response[key][index]['content'].replace(regExp, newTextDemo));
                        ResultsPopUp.addResult(response[key][index]['content'].replace(regExp, oldTextDemo),response[key][index]['content'].replace(regExp, newTextDemo));
                        response[key][index]['content'] = response[key][index]['content'].replace(regExp, newText);
                    }

                    if(key2['expected'].includes(textToBeReplaced)) {
                        console.log('--------- Expected -------- ');
                        ResultsPopUp.addStepField('Expected');
                        console.log('\n ------- Text before replace: ----------- \n' + response[key][index]['expected'].replace(regExp, oldTextDemo));
                        console.log('\n ------- Text after replace: ----------- \n' + response[key][index]['expected'].replace(regExp, newTextDemo));
                        ResultsPopUp.addResult(response[key][index]['expected'].replace(regExp, oldTextDemo),response[key][index]['expected'].replace(regExp, newTextDemo));
                        response[key][index]['expected'] = response[key][index]['expected'].replace(regExp, newText);
                    }

                    payload[key] = response[key];
                }
            });

        }


    });
    if(!firstField){
        console.log('==================  To be updated for test id: ' + response.id + '========================== \n', payload);
    }
    if(update && !firstField){
        ApiRequests.updateCase(response.id, payload);
    }
}

    };

    var ResultsPopUp = {

        addResultsHeader(){
            $(UserInterface.popUpLocator).append('' +
                '<div class="Table" id="ResultTable">' +
                '<div class="Heading">' +
                '<div class="Cell">' +
                '<p>Current text: </p>' +
                '</div>' +
                '<div class="Cell">' +
                '<p>After replace: </p>' +
                '</div>' +
                '</div>' +
                '</div>');
        },

        addTestID(testID,title){
            $('#ResultTable').append('<br/><a class="testID" href="/testrail/index.php?/cases/view/'+ testID +'" target="_blank">Test Case ID: ' + title + '</a>');
        },

        addTestField(testField){
            $('#ResultTable').append('<div class="caseField">Field: ' + testField + '</div>');
        },

        addStepField(stepField){
            $('#ResultTable').append('<div class="stepField">Step ' + stepField + '</div>');
        },

        addResult(textExist,textWillBe){
            $('#ResultTable').append(
                '<div class="row">' +
                    '<div class="Cell">' + textExist +' </div>' +
                    '<div class="Cell">' + textWillBe +'</div>' +
                    //TO DO this buttons should update or skip specific test field
                    //'<div class="Cell"><button id="ReplaceField" class="button button-left button-positive dialog-action-default" style="padding: 0px 8px;">Replace</button></div>' +
                    //'<div class="Cell"><button id="SkipField" class="button button-left button-positive dialog-action-default" style="padding: 0px 8px;">Skip</button></div>' +
                '</div>');
        },

    };

    var ApiRequests = {
        getCases(projectID,suiteID) {
            return $.ajax({
                url: 'index.php?/api/v2/get_cases/' + projectID + '&suite_id=' + suiteID,
                dataType: 'json',
                beforeSend: function(xhr, settings) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                error: function(xhr, status, error){
                    console.log(error);
                }
            });

        },

        getCase(id) {
            return $.ajax({
                url: 'index.php?api/v2/get_case/' + id,
                dataType: 'json',
                beforeSend: function(xhr, settings) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                error: function(xhr, status, error){
                    console.log(error);
                }
            });
        },

        updateCase(id, payload) {
            return $.ajax({
                type: "POST",
                url: 'index.php?api/v2/update_case/' + id,
                dataType: 'json',
                data: JSON.stringify(payload),
                contentType: 'application/json',
                error: function(xhr, status, error){
                    console.log(error);
                }
            });
        }


    };

css:
    div.some-class {}

    div.Table
{
    display: table;
}
div.Title
{
    display: table-caption;
    text-align: center;
    font-weight: bold;
    font-size: larger;
}
div.Heading
{
    display: table-row;
    font-weight: bold;
    text-align: center;
}
div.Row
{
    display: table-row;
}
div.Cell
{
    display: table-cell;
    border-width: thin;
    padding-left: 5px;
    padding-right: 5px;
}
a.testID
{
    font-weight: bold;
    text-align: center;
}
div.caseField
{
    font-weight: bold;
    text-align: center;
}
div.stepField
{
    font-weight: bold;
    text-align: center;
}
strong.demoText
{
    font-weight: bold;
    color: green;
}

