var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Tag = require('../model/Tag').Tag;
var TagCategory = require('../model/Tag').TagCategory;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');



function CreateTagCategory(req, res){

    logger.debug("DVP-LiteTicket.CreateTagCategory Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;
    var tagCategory = TagCategory({
        name:req.body.name,
        company:company,
        tenant:tenant,
        description:req.body.description
    });

    tagCategory.save(function (errNewCategory, resNewCategory) {
        if(errNewCategory)
        {
            jsonString=messageFormatter.FormatMessage(errNewCategory, "Tag category creation failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Tag category creation succeeded", true, resNewCategory);
        }
        res.end(jsonString);
    });


};
function RemoveTagCategory(req, res){

    logger.debug("DVP-LiteTicket.RemoveTagCategory Internal method ");

    var jsonString;

    TagCategory.findOneAndRemove({name:req.body.name}, function (errRemove,resRemove) {
        if(errRemove)
        {
            jsonString=messageFormatter.FormatMessage(errRemove, "Tag category deletion failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Tag category deletion succeeded", true, resRemove);
        }
        res.end(jsonString);
    });

};


function CreateTag(req, res){

    logger.debug("DVP-LiteTicket.CreateTagCategory Internal method ");

    var jsonString;
    var tag = Tag({
        name:req.body.name,
        description:re.body.description

    });

    tag.save(function (errNewTag, resNewTag) {
        if(errNewTag)
        {
            jsonString=messageFormatter.FormatMessage(errNewTag, "Tag creation failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Tag creation succeeded", true, resNewTag);
        }
        res.end(jsonString);
    });

};
function GetTags(req, res){

    logger.debug("DVP-LiteTicket.GetTags Internal method ");

    var jsonString;

    Tag.find(function (errAllTags,resAllTags) {

        if(errAllTags)
        {
            jsonString=messageFormatter.FormatMessage(errAllTags, "Picking All tags failed", false, undefined);
        }
        else
        {
            if(resAllTags)
            {
                jsonString=messageFormatter.FormatMessage(undefined, "Picking All tags succeeded", true, resAllTags);
            }
            else
            {
                jsonString=messageFormatter.FormatMessage(undefined, "No tags found", false, resAllTags)
            }

        }
        res.end(jsonString);
    });


};
function GetTag(req, res){

    logger.debug("DVP-LiteTicket.GetTag Internal method ");

    var jsonString;
    var tagName=req.body.name;

    Tag.find({name:tagName},function (errPickTag,PickTag) {

        if(errPickTag)
        {
            jsonString=messageFormatter.FormatMessage(errPickTag, "Picking tag failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Picking tag succeeded", true, PickTag);
        }
        res.end(jsonString);
    });

};
function DeleteTag(req, res){

    logger.debug("DVP-LiteTicket.DeleteTag Internal method ");

    var jsonString;

    Tag.findOneAndRemove({id:req.params.id}, function (errTagRemove,resTagRemove) {
        if(errTagRemove)
        {
            jsonString=messageFormatter.FormatMessage(errTagRemove, "Tag category deletion failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Tag category deletion succeeded", true, resTagRemove);
        }
        res.end(jsonString);
    });


};
function AttachTagsToTag(req, res){

    logger.debug("DVP-LiteTicket.AttachTagsToTag Internal method ");

    var jsonString;

    Tag.findOneAndUpdate({id:req.params.id}, {
        $push:{
            tags:
            {
                $each:[req.params.tagid]
            }
        }

    },function(errAttachTag,resAttachTag)
    {
        if(errAttachTag)
        {
            jsonString=messageFormatter.FormatMessage(errParentTag, "Attaching Tags failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Attaching Tags succeeded", false, resAttachTag);
        }
        res.end(jsonString);
    });



};
function CreateTagsToTag(req, res){

    logger.debug("DVP-LiteTicket.CreateTagsToTag Internal method ");

    var jsonString;

    var newTag = Tag({
        name:req.body.name,
        description:res.body.description
    });

    newTag.save()(function (errSubTag,resSubTag) {

        if(errSubTag)
        {
            jsonString=messageFormatter.FormatMessage(errSubTag, "Sub Tags creation failed", false, undefined);
            res.end(jsonString);
        }
        else
        {
            Tag.findOneAndUpdate({id:req.params.id}, {
                $push:{
                    tags:
                    {
                        $each:[newTag._id]
                    }
                }

            },function(errAttachTag,resAttachTag)
            {
                if(errAttachTag)
                {
                    jsonString=messageFormatter.FormatMessage(errAttachTag, "Attaching Tags failed", false, undefined);
                }
                else
                {
                    jsonString=messageFormatter.FormatMessage(undefined, "Attaching Tags succeeded", false, resAttachTag);
                }
                res.end(jsonString);
            });

        }

    });


};


function DetachTagsFromTag(req,res){

    logger.debug("DVP-LiteTicket.DetachTagsFromTag Internal method ");

    var jsonString;
    var parentTagId=req.params.id;
    var childTagId=req.params.tagid;

    Tag.findOneAndUpdate({id:parentTagId},{"$pull":{tags:childTagId}}, function (errDetachTag,resDetachTag) {

        if(errDetachTag)
        {
            jsonString=messageFormatter.FormatMessage(errDetachTag, "Detaching Tags failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Detaching Tags succeeded", false, resDetachTag)
        }
        res.end(jsonString);

    });

};
function AttachTagsToCategory(req, res){

    logger.debug("DVP-LiteTicket.AttachTagsToCategory Internal method ");

    var jsonString;
    var TagId=req.params.tagid;
    var CaregoryId=req.params.id;


    TagCategory.findOneAndUpdate({id:CaregoryId}, {
        $push:{
            tags:
            {
                $each:[TagId]
            }
        }

    },function(errAttachCatToTag,resAttachCatToTag)
    {
        if(errAttachCatToTag)
        {
            jsonString=messageFormatter.FormatMessage(errAttachCatToTag, "Attaching Tags failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Attaching Tags succeeded", false, resAttachCatToTag);
        }
        res.end(jsonString);
    });

};
function DetachTagsFromCategory(req,res){

    logger.debug("DVP-LiteTicket.DetachTagsToCategory Internal method ");

    var jsonString;
    var TagId=req.params.tagid;
    var CaregoryId=req.params.id;

    TagCategory.findOneAndUpdate({id:CaregoryId},{"$pull":{tags:TagId}},function(errDetachCatToTag,resDetachCatToTag)
    {
        if(errDetachCatToTag)
        {
            jsonString=messageFormatter.FormatMessage(errDetachCatToTag, "Attaching Tags failed", false, undefined);
        }
        else
        {
            jsonString=messageFormatter.FormatMessage(undefined, "Attaching Tags succeeded", false, resDetachCatToTag);
        }
        res.end(jsonString);
    });


};



module.exports.CreateTag = CreateTag;
module.exports.GetTags = GetTags;
module.exports.GetTag = GetTag;
module.exports.AttachTagsToTag = AttachTagsToTag;
module.exports.CreateTagsToTag = CreateTagsToTag;
module.exports.DeleteTag = DeleteTag;
module.exports.DetachTagsFromTag = DetachTagsFromTag;
module.exports.CreateTagCategory = CreateTagCategory;
module.exports.RemoveTagCategory = RemoveTagCategory;
module.exports.AttachTagsToCategory = AttachTagsToCategory;
module.exports.DetachTagsFromCategory = DetachTagsFromCategory;


