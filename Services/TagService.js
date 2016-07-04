var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Tag = require('../model/Tag').Tag;
var TagCategory = require('../model/Tag').TagCategory;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');




function CreateTag(req, res){};
function GetTags(req, res){};
function GetTag(req, res){};
function AttachTagsToTag(req, res){};
function DeleteTag(req, res){};
function DetachTagsFromTag(req,res){};


module.exports.CreateTag = CreateTag;
module.exports.GetTags = GetTags;
module.exports.GetTag = GetTag;
module.exports.AttachTagsToTag = AttachTagsToTag;
module.exports.DeleteTag = DeleteTag;
module.exports.DetachTagsFromTag = DetachTagsFromTag;
