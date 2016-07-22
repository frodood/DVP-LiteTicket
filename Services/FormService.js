var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var FormMaster = require('dvp-mongomodels/model/FormMaster').FormMaster;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');






function CreateForm(req, res){

    logger.debug("DVP-LiteTicket.CreateForm Internal method ");
    var jsonString;
    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);


    if(req.body && req.body.name) {
        var form = FormMaster({

            name: req.body.name,
            company: parseInt(req.user.company),
            tenant: parseInt(req.user.tenant)
        });


        form.save(function (err, form) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Form save failed", false, undefined);
                res.end(jsonString);
            } else {


                jsonString = messageFormatter.FormatMessage(undefined, "Form saved successfully", true, form);
                res.end(jsonString);
            }
        });
    }else{


        jsonString = messageFormatter.FormatMessage(undefined, "Requre fields not found", false, undefined);
        res.end(jsonString);

    }


};
function GetForms(req, res){


    logger.debug("DVP-LiteTicket.GetForms Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    FormMaster.find({company: company, tenant: tenant}, function(err, forms) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Forms Failed", false, undefined);

        }else {

            if (forms) {


                jsonString = messageFormatter.FormatMessage(err, "Get Forms Successful", true, forms);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No Forms Found", false, undefined);

            }
        }

        res.end(jsonString);
    });



};
function GetForm(req, res){


    logger.debug("DVP-LiteTicket.GetForm Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    FormMaster.findOne({name: req.params.name,company: company, tenant: tenant}, function(err, form) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Form Failed", false, undefined);

        }else{

            if(form) {
                var userObj;
                jsonString = messageFormatter.FormatMessage(err, "Get Form Successful", true, form);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No Form found", false, undefined);

            }

        }

        res.end(jsonString);
    });

};
function DeleteForm(req, res){

    logger.debug("DVP-LiteTicket.DeleteForm Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    FormMaster.findOneAndRemove({name: req.params.name,company: company, tenant: tenant}, function(err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Delete Form failed", false, undefined);
        }else{
            jsonString = messageFormatter.FormatMessage(undefined, "Delete Form Success", true, undefined);
        }
        res.end(jsonString);
    });

};
function AddDynamicField(req, res){


    logger.debug("DVP-LiteTicket.AddDynamicField Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    req.body.updated_at = Date.now();
    FormMaster.findOneAndUpdate({name: req.params.name,company: company, tenant: tenant}, { $addToSet :{
        fields : {
        field: req.body.field,
        type: req.body.type,
        description: req.body.description,
        title:  req.body.title,
        active:  req.body.activw,
        require:  req.body.require,
        values: req.body.values
        }}}, function (err, fields) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Add Dynamic Fields Failed", false, undefined);

        } else {

            jsonString = messageFormatter.FormatMessage(undefined, "Add Dynamic Fields Successful", true, fields);

        }

        res.end(jsonString);
    });


};
function RemoveDynamicField(req, res){

    logger.debug("DVP-LiteTicket.RemoveDynamicField Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    FormMaster.findOneAndUpdate({name: req.params.name,company: company, tenant: tenant},{ $pull: { 'fields': {'_id':req.params.field} } }, function(err, fields) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Remove Dynamic Fields Failed", false, undefined);


        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Remove Dynamic Fields successfully", false, fields);

        }

        res.end(jsonString);


    });

};
function UpdateDynamicField(req, res){


    logger.debug("DVP-LiteTicket.GetForm Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    FormMaster.update({name: req.params.name, company: company, tenant: tenant, 'fields.field' : req.params.field}, {
        $set:{
        "fields.$.field":req.body.field,
        "fields.$.type": req.body.type,
        "fields.$.description": req.body.description,
        "fields.$.title":  req.body.title,
        "fields.$.active":  req.body.active,
        "fields.$.require":  req.body.require,
        "fields.$.values": req.body.values
    }},{upsert:true},function(err, form) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Form Failed", false, undefined);
            res.end(jsonString);

        }else{

            jsonString = messageFormatter.FormatMessage(undefined, "Update Field successful", true, form);
            res.end(jsonString);

        }

    });

};


module.exports.CreateForm = CreateForm;
module.exports.GetForm = GetForm;
module.exports.GetForms = GetForms;
module.exports.DeleteForm = DeleteForm;
module.exports.AddDynamicField = AddDynamicField;
module.exports.RemoveDynamicField = RemoveDynamicField;
module.exports.UpdateDynamicField = UpdateDynamicField;




