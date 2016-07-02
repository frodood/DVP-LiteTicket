var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Tag = require('../model/Tag').Tag;
var TagCategory = require('../model/Tag').TagCategory;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');




function CreateTagCategory(req, res){};
function GetTagCategorys(req, res){};
function GetTagCategory(req, res){};
function DeleteTagCategory(req, res){};
function AddTag(req, res){};
function GetAllTagsInCategory(req, res){};
function DeleteTag(req, res){};

module.exports.CreateTagCategory = CreateTagCategory;
module.exports.GetTagCategorys = GetTagCategorys;
module.exports.GetTagCategory = GetTagCategory;
module.exports.DeleteTagCategory = DeleteTagCategory;
module.exports.AddTag = AddTag;
module.exports.GetAllTagsInCategory= GetAllTagsInCategory;
module.exports.DeleteTag = DeleteTag;