const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const PGProperty = require('../models/PGProperty');
const BHKHouse = require('../models/BHKHouse');
const VacationSpot = require('../models/VacationSpot');
const Favorite = require('../models/Favorite');
const UserAction = require('../models/UserAction');
const { createPGProperty, createBhkProperty, createVacationSpot } = require('../controllers/propertyController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Test Route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test route works, broo!' });
});

// User Actions
router.get('/user-actions', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Fetching user actions for:', userId);
    const actions = await UserAction.find({ userId })
      .populate('propertyId', 'propertyName')
      .lean();
    console.log(`Fetched ${actions.length} actions for user ${userId}:`, actions);
    res.json(actions);
  } catch (error) {
    console.error('Error fetching user actions:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Property Creation Routes
router.post('/pg', protect, upload, [
  check('propertyName', 'Property name is required').not().isEmpty(),
  check('contactNumber', 'Contact number is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('state', 'State is required').not().isEmpty(),
  check('monthlyRent', 'Monthly rent is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('latitude', 'Latitude must be a number').isFloat().optional(),
  check('longitude', 'Longitude must be a number').isFloat().optional(),
  check('single', 'Single sharing must be a boolean').isBoolean().optional(),
  check('twoSharing', 'Two sharing must be a boolean').isBoolean().optional(),
  check('threeSharing', 'Three sharing must be a boolean').isBoolean().optional(),
  check('fourSharing', 'Four sharing must be a boolean').isBoolean().optional(),
  check('wifi', 'WiFi must be a boolean').isBoolean().optional(),
  check('tiffinService', 'Tiffin service must be a boolean').isBoolean().optional(),
  check('tvRoom', 'TV room must be a boolean').isBoolean().optional(),
  check('laundry', 'Laundry must be a boolean').isBoolean().optional(),
  check('bikeParking', 'Bike parking must be a boolean').isBoolean().optional(),
  check('hotWater', 'Hot water must be a boolean').isBoolean().optional(),
  check('coffeeMachine', 'Coffee machine must be a boolean').isBoolean().optional(),
  check('airConditioning', 'Air conditioning must be a boolean').isBoolean().optional(),
], validate, createPGProperty);

router.post('/bhk', protect, upload, [
  check('propertyName', 'Property name is required').not().isEmpty(),
  check('contactNumber', 'Contact number is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('state', 'State is required').not().isEmpty(),
  check('monthlyRent', 'Monthly rent is required').not().isEmpty(),
  check('bedrooms', 'Number of bedrooms is required').toInt().isInt({ min: 1 }),
  check('bathrooms', 'Number of bathrooms is required').toInt().isInt({ min: 1 }),
  check('squareFeet', 'Square footage is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('latitude', 'Latitude must be a number').isFloat().optional(),
  check('longitude', 'Longitude must be a number').isFloat().optional(),
  check('carParking', 'Car parking must be a boolean').isBoolean().optional(),
  check('wifiSetup', 'WiFi setup must be a boolean').isBoolean().optional(),
  check('acUnits', 'AC units must be a boolean').isBoolean().optional(),
  check('furnished', 'Furnished must be a boolean').isBoolean().optional(),
  check('securitySystem', 'Security system must be a boolean').isBoolean().optional(),
  check('geysers', 'Geysers must be a boolean').isBoolean().optional(),
  check('ceilingFans', 'Ceiling fans must be a boolean').isBoolean().optional(),
  check('tvSetup', 'TV setup must be a boolean').isBoolean().optional(),
  check('modularKitchen', 'Modular kitchen must be a boolean').isBoolean().optional(),
  check('extraStorage', 'Extra storage must be a boolean').isBoolean().optional(),
], validate, createBhkProperty);

router.post('/vacation', protect, upload, [
  check('propertyName', 'Property name is required').not().isEmpty(),
  check('contactNumber', 'Contact number is required').not().isEmpty(),
  check('address', 'Address is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('state', 'State is required').not().isEmpty(),
  check('ratePerDay', 'Rate per day is required').not().isEmpty(),
  check('maxGuests', 'Maximum guests is required').toInt().isInt({ min: 1 }),
  check('description', 'Description is required').not().isEmpty(),
  check('latitude', 'Latitude must be a number').isFloat().optional(),
  check('longitude', 'Longitude must be a number').isFloat().optional(),
  check('beachAccess', 'Beach access must be a boolean').isBoolean().optional(),
  check('highSpeedWifi', 'High-speed WiFi must be a boolean').isBoolean().optional(),
  check('parkingSpace', 'Parking space must be a boolean').isBoolean().optional(),
  check('airConditioning', 'Air conditioning must be a boolean').isBoolean().optional(),
  check('kingSizeBed', 'King size bed must be a boolean').isBoolean().optional(),
  check('roomService', 'Room service must be a boolean').isBoolean().optional(),
  check('spaAccess', 'Spa access must be a boolean').isBoolean().optional(),
  check('fitnessCenter', 'Fitness center must be a boolean').isBoolean().optional(),
  check('smartTV', 'Smart TV must be a boolean').isBoolean().optional(),
  check('loungeAccess', 'Lounge access must be a boolean').isBoolean().optional(),
], validate, createVacationSpot);

// Property Listing Routes
router.get('/pg', optionalAuth, async (req, res) => {
  try {
    console.log('Fetching PG properties...');
    const pgProperties = await PGProperty.find({ deletedAt: null });
    console.log('PG properties fetched:', pgProperties.length);
    if (req.user) {
      console.log('User authenticated, fetching favorites for:', req.user._id);
      const favorites = await Favorite.find({ user: req.user._id, propertyType: 'pg' });
      console.log('Favorites fetched:', favorites.length);
      const favoriteIds = new Set(favorites.map(fav => fav.propertyId.toString()));
      pgProperties.forEach(prop => {
        prop._doc.isFavorited = favoriteIds.has(prop._id.toString());
      });
    }
    res.json(pgProperties);
  } catch (error) {
    console.error('Error in /pg route:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/bhk', optionalAuth, async (req, res) => {
  try {
    console.log('Fetching BHK properties...');
    const bhkProperties = await BHKHouse.find({ deletedAt: null });
    console.log('BHK properties fetched:', bhkProperties.length);
    if (req.user) {
      console.log('User authenticated, fetching favorites for:', req.user._id);
      const favorites = await Favorite.find({ user: req.user._id, propertyType: 'bhk' });
      console.log('Favorites fetched:', favorites.length);
      const favoriteIds = new Set(favorites.map(fav => fav.propertyId.toString()));
      bhkProperties.forEach(prop => {
        prop._doc.isFavorited = favoriteIds.has(prop._id.toString());
      });
    }
    res.json(bhkProperties);
  } catch (error) {
    console.error('Error in /bhk route:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/vacation', optionalAuth, async (req, res) => {
  try {
    console.log('Fetching vacation properties...');
    const vacationProperties = await VacationSpot.find({ deletedAt: null });
    console.log('Vacation properties fetched:', vacationProperties.length);
    if (req.user) {
      console.log('User authenticated, fetching favorites for:', req.user._id);
      const favorites = await Favorite.find({ user: req.user._id, propertyType: 'vacation' });
      console.log('Favorites fetched:', favorites.length);
      const favoriteIds = new Set(favorites.map(fav => fav.propertyId.toString()));
      vacationProperties.forEach(prop => {
        prop._doc.isFavorited = favoriteIds.has(prop._id.toString());
      });
    }
    res.json(vacationProperties);
  } catch (error) {
    console.error('Error in /vacation route:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/my-properties', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Fetching active properties for user:', userId);

    const pgProperties = await PGProperty.find({ user: userId, deletedAt: null });
    const bhkProperties = await BHKHouse.find({ user: userId, deletedAt: null });
    const vacationProperties = await VacationSpot.find({ user: userId, deletedAt: null });

    const properties = [
      ...pgProperties.map(p => ({ ...p.toObject(), type: 'pg' })),
      ...bhkProperties.map(p => ({ ...p.toObject(), type: 'bhk' })),
      ...vacationProperties.map(p => ({ ...p.toObject(), type: 'vacation' })),
    ];

    console.log('Active user properties fetched:', properties.length);
    res.json(properties);
  } catch (error) {
    console.error('Error fetching user properties:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/my-properties/deleted', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Fetching deleted properties for user:', userId);

    const pgProperties = await PGProperty.find({ user: userId, deletedAt: { $ne: null } });
    const bhkProperties = await BHKHouse.find({ user: userId, deletedAt: { $ne: null } });
    const vacationProperties = await VacationSpot.find({ user: userId, deletedAt: { $ne: null } });

    const properties = [
      ...pgProperties.map(p => ({ ...p.toObject(), type: 'pg' })),
      ...bhkProperties.map(p => ({ ...p.toObject(), type: 'bhk' })),
      ...vacationProperties.map(p => ({ ...p.toObject(), type: 'vacation' })),
    ];

    console.log('Deleted user properties fetched:', properties.length);
    res.json(properties);
  } catch (error) {
    console.error('Error fetching deleted properties:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Property Details, Edit, Delete
router.get('/:type/:propertyId', optionalAuth, async (req, res) => {
  const { type, propertyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    console.log('Invalid propertyId:', propertyId);
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  try {
    console.log(`Fetching property: ${type}/${propertyId}`);
    let property;
    if (type === 'pg') property = await PGProperty.findById(propertyId);
    else if (type === 'bhk') property = await BHKHouse.findById(propertyId);
    else if (type === 'vacation') property = await VacationSpot.findById(propertyId);
    else {
      console.log('Invalid property type:', type);
      return res.status(400).json({ message: 'Invalid property type' });
    }

    if (!property || property.deletedAt) {
      console.log('Property not found or deleted:', propertyId);
      return res.status(404).json({ message: 'Property not found or deleted' });
    }

    if (type === 'vacation') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentBookings = property.bookings.filter(
        (booking) => new Date(booking.createdAt) >= sixMonthsAgo
      );
      const bookingsLast6Months = recentBookings.reduce(
        (sum, booking) => sum + (booking.numGuests || 0),
        0
      );
      property = property.toObject();
      property.bookingsLast6Months = bookingsLast6Months;
    }

    console.log('Property fetched:', property.propertyName);
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:type/:propertyId', protect, async (req, res) => {
  const { type, propertyId } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  try {
    if (!['pg', 'bhk', 'vacation'].includes(type)) {
      console.log('Invalid property type:', type);
      return res.status(400).json({ message: 'Invalid property type' });
    }

    let Model;
    if (type === 'pg') Model = PGProperty;
    else if (type === 'bhk') Model = BHKHouse;
    else Model = VacationSpot;

    console.log(`Updating property ${type}/${propertyId} by user ${userId}`);
    const property = await Model.findOne({ _id: propertyId, user: userId, deletedAt: null });
    if (!property) {
      console.log('Property not found or not owned by user:', propertyId);
      return res.status(404).json({ message: 'Property not found or not yours' });
    }

    delete updates.user;
    delete updates.deletedAt;

    Object.assign(property, updates);
    await property.save();
    console.log(`Property ${propertyId} updated by user ${userId} with updates:`, updates);
    res.json(property);
  } catch (error) {
    console.error('Error updating property:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:type/:propertyId', protect, async (req, res) => {
  const { type, propertyId } = req.params;
  const userId = req.user._id;

  try {
    if (!['pg', 'bhk', 'vacation'].includes(type)) {
      console.log('Invalid property type:', type);
      return res.status(400).json({ message: 'Invalid property type' });
    }

    let Model;
    if (type === 'pg') Model = PGProperty;
    else if (type === 'bhk') Model = BHKHouse;
    else Model = VacationSpot;

    console.log(`Deleting property ${type}/${propertyId} by user ${userId}`);
    const property = await Model.findOne({ _id: propertyId, user: userId, deletedAt: null });
    if (!property) {
      console.log('Property not found or not owned by user:', propertyId);
      return res.status(404).json({ message: 'Property not found or not yours' });
    }

    property.deletedAt = new Date();
    await property.save();
    console.log(`Property ${propertyId} soft deleted by user ${userId}`);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Vacation Review Route
router.post('/vacation/:propertyId/review', protect, async (req, res) => {
  const { propertyId } = req.params;
  const { rating, review } = req.body;
  const userId = req.user.id;

  console.log('Review request:', { propertyId, rating, review, userId });

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    console.log('Invalid propertyId:', propertyId);
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  if (!rating || rating < 1 || rating > 5) {
    console.log('Invalid rating:', rating);
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    console.log('Fetching vacation property:', propertyId);
    const property = await VacationSpot.findById(propertyId);
    if (!property || property.deletedAt) {
      console.log('Property not found or deleted:', propertyId);
      return res.status(404).json({ message: 'Property not found or deleted' });
    }

    property.reviews = property.reviews || [];
    property.reviews.push({ user: userId, rating, review, date: new Date() });

    const totalRating = property.reviews.reduce((sum, r) => sum + r.rating, 0);
    property.rating = totalRating / property.reviews.length;
    property.reviewsCount = property.reviews.length;

    await property.save();
    console.log(`Review added to ${property.propertyName} by user ${userId}`);
    res.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Review submission error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;