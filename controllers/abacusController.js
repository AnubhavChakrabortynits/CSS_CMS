const Abacus = require("../models/abacus");
const Team = require("../models/teamModel");
const User = require("../models/users");
const cloudinary = require("cloudinary");

exports.register = async (req, res, next) => {
  try {
    const event_id = req.params.event_id;
    const event = await Abacus.findById(event_id);

    if (!event) {
      return res.status(404).json({
        status: `fail`,
        message: `no event found with given id: ${event_id}`,
      });
    }

    const { teamName, memberScholarIDs } = req.body;

    if (!(teamName && memberScholarIDs && memberScholarIDs.length >= 1)) {
      res.status(400).json({
        status: "fail",
        message: "please provide all required fields",
      });
    }

    const memberIDs = [];

    for (let scholarID of memberScholarIDs) {
      const user = await User.findOne({ scholarID: scholarID });
      memberIDs.push(user._id);
    }

    const team = await Team.create({
      name: teamName,
      members: memberIDs,
    });

    res.status(201).json({
      status: "success",
      message: "team successfully created",
      team: team,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: `error`,
      message: `something went wrong: ${err.name}`,
    });
  }
};

exports.createAbacusEvent = async (req, res) => {
  try {
    const { name, description, startDate, endDate, eventType, minTeamSize, maxTeamSize } = req.body;
    let myCloud = await cloudinary.v2.uploader.upload(req.files.coverPic.tempFilePath, {
      folder: "abacus",
    });

    if (!name || !description || !startDate || !endDate || !eventType || !minTeamSize || !maxTeamSize) {
      return res.status(400).json({ status: "fail", message: "Please provide all the details" });
    }

    const event = await Abacus({
      name,
      description,
      startDate,
      endDate,
      eventType,
      minTeamSize,
      maxTeamSize,
      coverPic:{
        public_id: myCloud.public_id,
        url: myCloud.url
      },
    }).save();

    res.status(200).json({ status: "success", message: "Event Succesfully Created", event: event });
  } catch (e) {
    res.status(500).json({ status: "error", message: `something went wrong: ${e}` });
  }
};

exports.updateAbacusEvent = async (req, res) => {
  try {
    const id = req.body.id;
    const event = await Abacus.findById(id);

    if (!event) {
      return res.status(400).json({ status: "fail", message: "No such event exists" });
    }

    if (req.files) {
      const imageId = event.coverPic.public_id;
      //console.log("on the way to delete");
      await cloudinary.v2.uploader.destroy(imageId);
      //console.log("deleted");
    }

    const newBodyObj=req.body;

    if (req.files) {
      const myCloud = await cloudinary.v2.uploader.upload(req.files.coverPic.tempFilePath, {
        folder: "abacus",
      });
      newBodyObj["coverPic"] = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }


    Object.assign(event, newBodyObj);
    const updatedEvent = await event.save();

    res.status(200).json({ status: "success", message: "event successfully updated", event: updatedEvent });
  } catch (e) {
    res.status(500).json({ status: "error", message: `Something went wrong : ${e}` });
  }
};