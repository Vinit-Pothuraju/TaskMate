import Reminder from '../models/Reminder.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export const getReminders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      active = true,
      upcoming = false
    } = req.query;

    const userId = req.userId;
    const query = { userId };

    if (active !== undefined) {
      query.active = active === 'true';
    }

    if (upcoming === 'true') {
      query.when = { $gte: new Date() };
      query.delivered = false;
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [reminders, totalCount] = await Promise.all([
      Reminder.find(query)
        .sort({ when: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Reminder.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        reminders,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reminders'
    });
  }
};

export const createReminder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const reminderData = {
      ...req.body,
      userId: req.userId
    };

    const reminder = new Reminder(reminderData);
    await reminder.save();

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: { reminder }
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reminder'
    });
  }
};

export const updateReminder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID'
      });
    }

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      data: { reminder }
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reminder'
    });
  }
};

export const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID'
      });
    }

    const reminder = await Reminder.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reminder'
    });
  }
};
