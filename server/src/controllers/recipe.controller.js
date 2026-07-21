const recipeService = require('../services/recipe.service');
const catchAsync = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const data = { ...req.body, createdBy: req.user.id };
  const recipe = await recipeService.create(data);
  res.status(201).json({ success: true, data: recipe });
});

const getById = catchAsync(async (req, res) => {
  const recipe = await recipeService.getById(req.params.id);
  res.status(200).json({ success: true, data: recipe });
});

const list = catchAsync(async (req, res) => {
  const recipes = await recipeService.list(req.query);
  res.status(200).json({ success: true, data: recipes });
});

const update = catchAsync(async (req, res) => {
  const recipe = await recipeService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data: recipe });
});

const updateStatus = catchAsync(async (req, res) => {
  const recipe = await recipeService.updateStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: recipe });
});

module.exports = { create, getById, list, update, updateStatus };
